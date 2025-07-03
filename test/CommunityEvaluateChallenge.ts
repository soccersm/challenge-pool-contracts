import { toUtf8Bytes } from "ethers";
import { ethers } from "hardhat";
import { FacetCutAction, functionSelectors } from "../ignition/lib";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deploySoccersm } from "./SoccersmDeployFixture";
import { btcEvent, customChallenge } from "./mock";
import {
  ChallengeState,
  ChallengeType,
  coder,
  getCommunityIdHash,
  prepareCreateChallenge,
  yesNo,
} from "./lib";
import { getChallenge } from "./test_helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";

describe("Evaluate Community Custom Challenge", async function () {
  async function deployCommunity() {
    const {
      poolHandlerProxy,
      cutProxy,
      communityProxy,
      communityViewProxy,
      poolViewProxy,
      oneGrand,
      oneMil,
      baller,
      keeper,
      ballsToken,
    } = await loadFixture(deploySoccersm);

    const [owner, user, user1, user2, user3] = await ethers.getSigners();

    const SOCCERSM_COUNCIL = ethers.keccak256(toUtf8Bytes("SOCCERSM_COUNCIL"));

    return {
      poolHandlerProxy,
      cutProxy,
      communityProxy,
      communityViewProxy,
      owner,
      user,
      user1,
      user2,
      user3,
      SOCCERSM_COUNCIL,
      oneGrand,
      oneMil,
      baller,
      keeper,
      ballsToken,
      poolViewProxy,
    };
  }

  it("Should create Standard and Custom challenge", async function () {
    const {
      poolHandlerProxy,
      communityProxy,
      poolViewProxy,
      oneGrand,
      oneMil,
      baller,
      keeper,
      ballsToken,
      owner,
    } = await loadFixture(deployCommunity);

    //createChallenge: standard
    const btcChallenge = btcEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );
    const preparedBTCChallenge = prepareCreateChallenge(btcChallenge.challenge);

    await ballsToken
      .connect(baller)
      .approve(
        await poolHandlerProxy.getAddress(),
        (
          await poolViewProxy.createFee(oneMil)
        )[1]
      );
    await (poolHandlerProxy.connect(baller) as any).createChallenge(
      ...(preparedBTCChallenge as any)
    );

    //getChallenge
    const challenge = await getChallenge(poolViewProxy, 0);
    console.log("Challenge: ", challenge);

    //create new community
    const COMMUNITY_ID = "Community1";
    const COMMUNITY_ID_HASH = getCommunityIdHash(COMMUNITY_ID);
    await expect(communityProxy.createCommunity(COMMUNITY_ID))
      .to.emit(communityProxy, "NewCommunity")
      .withArgs(
        COMMUNITY_ID,
        COMMUNITY_ID_HASH,
        await owner.getAddress(),
        1,
        false,
        anyValue
      );
    //make baller admin
    await (communityProxy.connect(baller) as any).joinCommunity(
      COMMUNITY_ID_HASH
    );
    await communityProxy.addCommunityAdmin(COMMUNITY_ID_HASH, baller.address);

    //customChallenge: maturity->default
    const customBtcChallenge = btcEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress,
      undefined,
      COMMUNITY_ID_HASH,
      ChallengeType.community
    );
    const preparedCustomBTCChallenge = prepareCreateChallenge(
      customBtcChallenge.challenge
    );

    await (poolHandlerProxy.connect(baller) as any).createChallenge(
      ...(preparedCustomBTCChallenge as any)
    );

    await expect(
      (poolHandlerProxy.connect(keeper) as any).createChallenge(
        ...(preparedCustomBTCChallenge as any)
      )
    ).to.be.revertedWithCustomError(communityProxy, "NotCommunityOwnerOrAdmin");

    const customChallenge = await getChallenge(poolViewProxy, 1);
    console.log("Custom Challenge: ", customChallenge);
  });

  it("Should create Community challenge and Evaluate", async function () {
    const {
      poolHandlerProxy,
      communityProxy,
      poolViewProxy,
      oneGrand,
      oneMil,
      baller,
      ballsToken,
      owner,
      keeper,
    } = await loadFixture(deployCommunity);

    //create new community
    const COMMUNITY_ID = "Community1";
    const COMMUNITY_ID_HASH = getCommunityIdHash(COMMUNITY_ID);
    await expect(communityProxy.createCommunity(COMMUNITY_ID))
      .to.emit(communityProxy, "NewCommunity")
      .withArgs(
        COMMUNITY_ID,
        COMMUNITY_ID_HASH,
        await owner.getAddress(),
        1,
        false,
        anyValue
      );
    //make baller admin
    await (communityProxy.connect(baller) as any).joinCommunity(
      COMMUNITY_ID_HASH
    );
    await communityProxy.addCommunityAdmin(COMMUNITY_ID_HASH, baller.address);

    //customChallenge
    const customBtcChallenge = btcEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress,
      undefined,
      COMMUNITY_ID_HASH,
      ChallengeType.community
    );
    const preparedCustomBTCChallenge = prepareCreateChallenge(
      customBtcChallenge.challenge
    );

    await ballsToken
      .connect(baller)
      .approve(
        await poolHandlerProxy.getAddress(),
        (
          await poolViewProxy.createFee(oneMil)
        )[1]
      );

    await (poolHandlerProxy.connect(baller) as any).createChallenge(
      ...(preparedCustomBTCChallenge as any)
    );
    const challengeBefore = await getChallenge(poolViewProxy, 0);
    console.log("Challenge Before Outcome: ", challengeBefore.outcome);

    //baller stake

    await (poolHandlerProxy.connect(baller) as any).stake(
      0,
      yesNo.yes,
      2,
      ethers.ZeroAddress
    );

    //mature
    await time.increaseTo(customBtcChallenge.maturity);
    const result = yesNo.yes;

    //admin/owner can evaluate
    await expect(
      (communityProxy.connect(keeper) as any).evaluateCustomChallenge(0, result)
    )
      .to.be.revertedWithCustomError(communityProxy, "NotCommunityOwnerOrAdmin")
      .withArgs(COMMUNITY_ID_HASH, keeper.address);

    await expect(communityProxy.evaluateCustomChallenge(0, result))
      .to.emit(communityProxy, "EvaluateChallenge")
      .withArgs(
        0,
        owner.address,
        ChallengeState.evaluated,
        result
      );

    await time.increase(60 * 60);
    await poolHandlerProxy.close(0);

    const challengeAfter = await getChallenge(poolViewProxy, 0);
    expect(challengeAfter.outcome).to.equal(yesNo.yes);
    console.log(
      "challenge after outcome: ",
      coder.decode(["string"], challengeAfter.outcome)
    );
    await expect((poolHandlerProxy.connect(baller) as any).withdraw(0)).to.emit(
      poolHandlerProxy,
      "WinningsWithdrawn"
    );
  });

  it.only("Should create Custom community challenge and Evaluate", async function () {
    const {
      poolHandlerProxy,
      communityProxy,
      poolViewProxy,
      oneGrand,
      oneMil,
      baller,
      ballsToken,
      owner,
      keeper,
    } = await loadFixture(deployCommunity);

    //create new community
    const COMMUNITY_ID = "Community1";
    const COMMUNITY_ID_HASH = getCommunityIdHash(COMMUNITY_ID);
    await expect(communityProxy.createCommunity(COMMUNITY_ID))
      .to.emit(communityProxy, "NewCommunity")
      .withArgs(
        COMMUNITY_ID,
        COMMUNITY_ID_HASH,
        await owner.getAddress(),
        1,
        false,
        anyValue
      );
    //make baller admin
    await (communityProxy.connect(baller) as any).joinCommunity(
      COMMUNITY_ID_HASH
    );
    await communityProxy.addCommunityAdmin(COMMUNITY_ID_HASH, baller.address);

    //customChallenge
    const customCommunityChallenge = customChallenge(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress,
      COMMUNITY_ID_HASH,
      ChallengeType.community
    );
    const preparedCustomCommunityChallenge = prepareCreateChallenge(
      customCommunityChallenge.challenge
    );
    console.log("Prepared custom challenge: ", preparedCustomCommunityChallenge)
    await ballsToken
      .connect(baller)
      .approve(
        await poolHandlerProxy.getAddress(),
        (
          await poolViewProxy.createFee(oneMil)
        )[1]
      );

    await (poolHandlerProxy.connect(baller) as any).createChallenge(
      ...(preparedCustomCommunityChallenge as any)
    );
    const challengeBefore = await getChallenge(poolViewProxy, 0);
    console.log("Challenge Before Outcome: ", challengeBefore.outcome);

    //baller stake: 'Somewhat'
    const stakeOption = coder.encode(["string"], ["Somewhat"])
    await (poolHandlerProxy.connect(baller) as any).stake(
      0,
      stakeOption,
      2,
      ethers.ZeroAddress
    );

    //mature
    await time.increaseTo(customCommunityChallenge.maturity);
    const result = coder.encode(['string'], ['Somewhat']);

    //admin/owner can evaluate
    await expect(
      (communityProxy.connect(keeper) as any).evaluateCustomChallenge(0, result)
    )
      .to.be.revertedWithCustomError(communityProxy, "NotCommunityOwnerOrAdmin")
      .withArgs(COMMUNITY_ID_HASH, keeper.address);

    await expect(communityProxy.evaluateCustomChallenge(0, result))
      .to.emit(communityProxy, "EvaluateChallenge")
      .withArgs(
        0,
        owner.address,
        ChallengeState.evaluated,
        result
      );

    await time.increase(60 * 60);
    await poolHandlerProxy.close(0);

    const challengeAfter = await getChallenge(poolViewProxy, 0);
    expect(challengeAfter.outcome).to.equal(result);
    console.log(
      "challenge after outcome: ",
      coder.decode(["string"], challengeAfter.outcome)
    );
    await expect((poolHandlerProxy.connect(baller) as any).withdraw(0)).to.emit(
      poolHandlerProxy,
      "WinningsWithdrawn"
    );
  });

});

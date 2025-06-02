import { toUtf8Bytes } from "ethers";
import { ethers } from "hardhat";
import { FacetCutAction, functionSelectors } from "../ignition/lib";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deploySoccersm } from "./SoccersmDeployFixture";
import { btcEvent } from "./mock";
import {
  ChallengeState,
  ChallengeType,
  coder,
  prepareCreateChallenge,
  yesNo,
} from "./lib";
import { getChallenge } from "./test_helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { getTsBuildInfoEmitOutputFilePath } from "typescript";

describe("Evaluate Community Custom Challenge", async function () {
  async function deployCommunity() {
    const {
      poolHandlerProxy,
      poolViewProxy,
      cutProxy,
      oneGrand,
      baller,
      owner,
      keeper,
      ballsToken,
      oneMil,
      paymaster,
    } = await loadFixture(deploySoccersm);

    const Community = await ethers.getContractFactory("Community");
    const community = await Community.deploy();

    const CommunityView = await ethers.getContractFactory("CommunityView");
    const communityView = await CommunityView.deploy();

    const selectors = functionSelectors("Community");
    const viewSelectors = functionSelectors("CommunityView");
    const communityCut = [
      {
        facetAddress: await community.getAddress(),
        action: FacetCutAction.Add,
        functionSelectors: selectors,
      },
      {
        facetAddress: await communityView.getAddress(),
        action: FacetCutAction.Add,
        functionSelectors: viewSelectors,
      },
    ];

    await cutProxy.diamondCut(communityCut, ethers.ZeroAddress, "0x");
    const communityProxy = await ethers.getContractAt(
      "Community",
      await cutProxy.getAddress()
    );
    const communityViewProxy = await ethers.getContractAt(
      "CommunityView",
      await cutProxy.getAddress()
    );

    const SOCCERSM_COUNCIL = ethers.keccak256(toUtf8Bytes("SOCCERSM_COUNCIL"));

    return {
      poolHandlerProxy,
      cutProxy,
      communityProxy,
      communityViewProxy,
      owner,
      keeper,
      baller,
      SOCCERSM_COUNCIL,
      oneGrand,
      oneMil,
      ballsToken,
      paymaster,
      poolViewProxy,
    };
  }

  it("Should create Standard and Custom challenge", async function () {
    const {
      poolHandlerProxy,
      communityViewProxy,
      communityProxy,
      poolViewProxy,
      oneGrand,
      oneMil,
      baller,
      keeper,
      ballsToken,
      paymaster,
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
    await expect(communityProxy.createCommunity(COMMUNITY_ID))
      .to.emit(communityProxy, "NewCommunity")
      .withArgs(COMMUNITY_ID, await owner.getAddress(), anyValue);
    //make baller admin
    await communityProxy.connect(baller).joinCommunity(COMMUNITY_ID);
    await communityProxy.addCommunityAdmin(COMMUNITY_ID, baller.address);

    //customChallenge
    const customBtcChallenge = btcEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress,
      undefined,
      COMMUNITY_ID,
      ChallengeType.custom
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
    ).to.be.revertedWithCustomError(communityProxy, "NotCommunityAdmin");

    const customChallenge = await getChallenge(poolViewProxy, 1);
    console.log("Custom Challenge: ", customChallenge);
  });

  it("Should create Custom challenge and Evaluate", async function () {
    const {
      poolHandlerProxy,
      communityViewProxy,
      communityProxy,
      poolViewProxy,
      oneGrand,
      oneMil,
      baller,
      keeper,
      ballsToken,
      paymaster,
      owner,
    } = await loadFixture(deployCommunity);

    //create new community
    const COMMUNITY_ID = "Community1";
    await expect(communityProxy.createCommunity(COMMUNITY_ID))
      .to.emit(communityProxy, "NewCommunity")
      .withArgs(COMMUNITY_ID, await owner.getAddress(), anyValue);
    //make baller admin
    await communityProxy.connect(baller).joinCommunity(COMMUNITY_ID);
    await communityProxy.addCommunityAdmin(COMMUNITY_ID, baller.address);

    //customChallenge
    const customBtcChallenge = btcEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress,
      undefined,
      COMMUNITY_ID,
      ChallengeType.custom
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

    //evaluate
    await expect(
      communityProxy.evaluateCustomChallenge(0, result)
    ).to.be.revertedWithCustomError(communityProxy, "NotCommunityAdmin");
    await expect(
      communityProxy.connect(baller).evaluateCustomChallenge(0, result)
    )
      .to.emit(communityProxy, "EvaluateCommunityChallenge")
      .withArgs(0, baller.address, ChallengeState.evaluated, result);

    await time.increase(60 * 60);
    await poolHandlerProxy.close(0);

    const challengeAfter = await getChallenge(poolViewProxy, 0);
    expect(challengeAfter.outcome).to.equal(yesNo.yes);
    console.log(
      "challenge after outcome: ",
      coder.decode(["string"], challengeAfter.outcome)
    );
  });
});

import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deploySoccersm } from "./SoccersmDeployFixture";

import { btcEvent, ghanaElectionEvent } from "./mock";
import {
  prepareCreateChallenge,
  coder,
  encodeMultiOptionByTopic,
  prepareStatementProvision,
} from "./lib";
import { getChallenge } from "./test_helpers";

describe("ChallengePool - Withdraw", function () {
  it("Should [withdraw]", async function () {
    const {
      registryProxy,
      oneGrand,
      oneMil,
      owner,
      baller,
      striker,
      ballsToken,
      poolHandlerProxy,
      poolViewProxy,
      poolManagerProxy,
    } = await loadFixture(deploySoccersm);
    //Setup: Create and Stake a challenge

    const gh = ghanaElectionEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );

    await registryProxy.registerEvent(
      gh.topicId,
      coder.encode(
        ["string", "string", "uint256", "bytes[]"],
        [
          gh.statementId,
          gh.statement,
          gh.maturity,
          gh.options.map((o) => encodeMultiOptionByTopic(gh.topicId, o)),
        ]
      )
    );

    const preparedMultiStementChallenge = prepareCreateChallenge(gh.challenge);

    await ballsToken
      .connect(baller)
      .approve(
        await poolHandlerProxy.getAddress(),
        (
          await poolViewProxy.createFee(oneGrand)
        )[1]
      );
    await (poolHandlerProxy.connect(baller) as any).createChallenge(
      ...(preparedMultiStementChallenge as any)
    );

    const challengeId = (await poolManagerProxy.challengeId()) - 1n;

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    const prediction = coder.encode(["string"], ["Mahama"]);
    //striker can stake
    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(striker) as any).stake(
      0,
      coder.encode(["string"], ["Bawumia"]),
      1,
      ethers.ZeroAddress
    );

    //baller can stake again
    await (poolHandlerProxy.connect(baller) as any).stake(
      0,
      prediction,
      1,
      ethers.ZeroAddress
    );

    //Setup: initiate withdraw:
    //[Evaluate], [Close]
    // Confirm winners have been paid
    //console.log("GH maturity: ", gh.challenge.events[0].maturity);

    const challenges = await getChallenge(poolViewProxy, 0);
    console.log("Challenges: ", challenges);
    await time.increaseTo(gh.challenge.events[0].maturity);
    // const evaluation = await (poolHandlerProxy.connect(owner) as any).evaluate(0); // reverting
    const provideDataParams = prepareStatementProvision(
      gh.statementId,
      gh.statement,
      gh.maturity,
      gh.options[0] as string
    );
    await registryProxy.provideData(...provideDataParams);

    await poolHandlerProxy.evaluate(0);
    console.log("Challenges: ", await getChallenge(poolViewProxy, 0));
    await time.increase(60 * 60);
    await poolHandlerProxy.close(0);
    console.log("Challenges: ", await getChallenge(poolViewProxy, 0));
  });
});

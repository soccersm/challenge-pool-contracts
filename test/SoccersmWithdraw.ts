import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deploySoccersm } from "./SoccersmDeployFixture";

import {
  btcEvent,
} from "./mock";
import {
  prepareCreateChallenge,
} from "./lib";
import { connectCoinbaseWalletSDK } from "thirdweb/dist/types/wallets/coinbase/coinbase-web";
import { getChallenge } from "./test_helpers";

describe("ChallengePool - Withdraw", function () {
  it("Should [withdraw]", async function () {
    const {
      registryProxy,
      oneGrand,
      oneMil,
      baller,
      ballsToken,
      poolHandlerProxy,
      poolViewProxy,
      poolManagerProxy,
    } = await loadFixture(deploySoccersm);
return;
    //Setup: Create and Stake a challenge
    //set deadline of 1hour 30secs
    const btcDeadline = (await time.latest()) + (60 * 60) + 30;
    const btcChallenge = btcEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress,
      btcDeadline
    );
    const preparedBTCChallenge = prepareCreateChallenge(btcChallenge.challenge);
    console.log("Prepared BTC Challenge: ", preparedBTCChallenge);
    await ballsToken
      .connect(baller)
      .approve(
        await poolHandlerProxy.getAddress(),
        (
          await poolViewProxy.createFee(oneGrand)
        )[1]
      );
    await (poolHandlerProxy.connect(baller) as any).createChallenge(
      ...(preparedBTCChallenge as any)
    );

    //register
    

    const challengeId = (await poolManagerProxy.challengeId()) - 1n;

    const prediction = ethers.AbiCoder.defaultAbiCoder().encode(
      ["string"],
      ["yes"]
    );

    const stakeParams = {
      _challengeId: challengeId,
      _prediction: prediction,
      _quantity: 1,
      _deadline: (await time.latest()) + 1000,
      _paymaster: ethers.ZeroAddress,
    };

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    //should stake
    await (poolHandlerProxy.connect(baller) as any).stake(
      stakeParams._challengeId,
      stakeParams._prediction,
      stakeParams._quantity,
      stakeParams._paymaster
    );

    //Assert: earlyWithdraw
    const earlyWithdrawParams = {
      ...stakeParams,
      _minPrice: oneGrand,
    };

    await expect(
      (poolHandlerProxy.connect(baller) as any).earlyWithdraw(
        earlyWithdrawParams._challengeId,
        earlyWithdrawParams._prediction,
        earlyWithdrawParams._quantity,
        earlyWithdrawParams._deadline
      )
    ).to.not.be.reverted;

    //Reverts: earlyWithdraw
    //revert invalid challengeId
    await expect(
      (poolHandlerProxy.connect(baller) as any).earlyWithdraw(
        1,
        earlyWithdrawParams._prediction,
        earlyWithdrawParams._quantity,
        earlyWithdrawParams._deadline
      )
    ).to.be.reverted;

    //revert for invalid prediction
    const invalidPrediction = ethers.AbiCoder.defaultAbiCoder().encode(
      ["string"],
      ["invalid"]
    );
    await expect(
      (poolHandlerProxy.connect(baller) as any).earlyWithdraw(
        earlyWithdrawParams._challengeId,
        invalidPrediction,
        earlyWithdrawParams._quantity,
        earlyWithdrawParams._deadline
      )
    ).to.be.reverted;

    //revert for invalid quantity
    const invalidQuantity = 0n;
    await expect(
      (poolHandlerProxy.connect(baller) as any).earlyWithdraw(
        earlyWithdrawParams._challengeId,
        earlyWithdrawParams._prediction,
        invalidQuantity,
        earlyWithdrawParams._deadline
      )
    ).to.be.reverted;

    //revert for invalid deadline
    const invalidDeadline = (await time.latest()) - 1000;
    await expect(
      (poolHandlerProxy.connect(baller) as any).earlyWithdraw(
        earlyWithdrawParams._challengeId,
        earlyWithdrawParams._prediction,
        earlyWithdrawParams._quantity,
        invalidDeadline
      )
    ).to.be.reverted;

    //Reverts for withdraw
    const _challengeId = 0n;
    await expect(
      (poolHandlerProxy.connect(baller) as any).withdraw(_challengeId)
    ).to.be.reverted;

    //Setup: initiate withdraw:
    //[Evaluate], [Close]
    // Confirm winners have been paid
    await time.increaseTo(btcDeadline + 1);
    const challenges = await getChallenge(poolViewProxy, 0);
    console.log("Challenges: ", challenges);
    // const evaluation = await poolHandlerProxy.evaluate(challengeId);
    // console.log("Evaluation: ", evaluation);
  });
});

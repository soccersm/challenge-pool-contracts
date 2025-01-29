import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { expect } from "chai";
import { ethers, ignition } from "hardhat";
import { deploySoccersm } from "./SoccersmDeployFixture";

import {
  btcEvent,
} from "./mock";
import {
  prepareCreateChallenge,
} from "./lib";

describe("ChallengePool - Withdraw And Fees", function () {
  it("Should [earlyWithdraw]", async function () {
    const {
      oneGrand,
      baller,
      ballsToken,
      poolHandlerProxy,
      poolViewProxy,
      poolManagerProxy,
    } = await loadFixture(deploySoccersm);
return;
    //Setup: Create and Stake a challenge
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
          await poolViewProxy.createFee(oneGrand)
        )[1]
      );
    await (poolHandlerProxy.connect(baller) as any).createChallenge(
      ...(preparedBTCChallenge as any)
    );

    const challengeId = (await poolManagerProxy.challengeId()) - 1n;

    const maxPrice = oneGrand * 2n;
    const prediction = ethers.AbiCoder.defaultAbiCoder().encode(
      ["string"],
      ["yes"]
    );

    const stakeParams = {
      _challengeId: challengeId,
      _prediction: prediction,
      _quantity: 1,
      _maxPrice: maxPrice,
      _deadline: (await time.latest()) + 1000,
      _paymaster: ethers.ZeroAddress,
    };

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), maxPrice);
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
    //revert for challenge state: open
    const _challengeId = 0n;
    await expect(
      (poolHandlerProxy.connect(baller) as any).withdraw(_challengeId)
    ).to.be.reverted;

    //get challenge states
  });
});

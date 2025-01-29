import { ChallengePoolViewInterface } from './../typechain-types/contracts/modules/ChallengePoolView';
import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { expect } from "chai";
import { ethers } from "hardhat";
import { deploySoccersm } from "./SoccersmDeployFixture";

import {
  btcEvent,
} from "./mock";
import {
  prepareCreateChallenge,
} from "./lib";
import { getPlayerSupply } from "./test_helpers";
import { bigint } from "hardhat/internal/core/params/argumentTypes";

describe("ChallengePool - Stake Challenge", function () {
  it("Should [Stake]", async function () {
    const {
      oneGrand,
      oneMil,
      baller,
      striker,
      ballsToken,
      poolHandlerProxy,
      poolViewProxy,
      poolManagerProxy
    } = await loadFixture(deploySoccersm);

    //Create a challenge: BTC challenge
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

    expect(await poolManagerProxy.challengeId()).to.equals(1);
    //Challenge ID
    const challengeId = (await poolManagerProxy.challengeId()) - 1n;

    let predictionValue: string = "yes";
    const prediction = ethers.AbiCoder.defaultAbiCoder().encode(
      ["string"],
      [predictionValue]
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
    await expect(
      (poolHandlerProxy.connect(baller) as any).stake(
        stakeParams._challengeId,
        stakeParams._prediction,
        stakeParams._quantity,
        stakeParams._paymaster
      )
    ).to.not.be.reverted;

    //_incrementSupply after stake
    // baller created and staked challenge
    const ballerPlayerSupply = await getPlayerSupply(poolViewProxy, 0, await baller.getAddress());
    expect(ballerPlayerSupply.stakes).to.equals(stakeParams._quantity * 2);

    //Baller: playerSupply.tokens == totalAmount
    // total amount = basePrice * quantity
    const totalAmount = oneGrand * BigInt(stakeParams._quantity * 2);
    expect(ballerPlayerSupply.tokens).to.equals(totalAmount);

    //Reverts for invalid challengeId
    const invalidChallengeIdParams = {
      ...stakeParams,
    };
    //revert
    invalidChallengeIdParams._challengeId = 100n;

    await expect(
      (poolHandlerProxy.connect(baller) as any).stake(
        invalidChallengeIdParams._challengeId,
        invalidChallengeIdParams._prediction,
        invalidChallengeIdParams._quantity,
        invalidChallengeIdParams._paymaster
      )
    ).to.be.reverted;

    //Reverts for invalid prediction
    const invalidPredictionParams = {
      ...stakeParams,
    };
    //revert
    const invalidPrediction = ethers.AbiCoder.defaultAbiCoder().encode(
      ["string"],
      ["invalidPrediction"]
    );
    invalidChallengeIdParams._prediction = invalidPrediction;

    await expect(
      (poolHandlerProxy.connect(baller) as any).stake(
        invalidPredictionParams._challengeId,
        invalidPrediction,
        invalidPredictionParams._quantity,
        invalidPredictionParams._paymaster
      )
    ).to.be.reverted;

    //Reverts for invalid quantity
    const invalidQuantityParams = {
      ...stakeParams,
    };
    //revert
    invalidQuantityParams._quantity = 0;

    await expect(
      (poolHandlerProxy.connect(baller) as any).stake(
        invalidQuantityParams._challengeId,
        invalidQuantityParams._prediction,
        invalidQuantityParams._quantity,
        invalidQuantityParams._paymaster
      )
    ).to.be.reverted;

    //Stake: striker stakes
    const noPrediction = ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["no"]); 
    const quantity = 2;

    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await(
      (poolHandlerProxy.connect(striker) as any).stake(
        0,
        noPrediction,
        quantity,
        stakeParams._paymaster
      )
    );

    //_incrementSupply after stake
    const strikerPlayerSupply = await getPlayerSupply(poolViewProxy, 0, await striker.getAddress());
    expect(strikerPlayerSupply.stakes).to.equals(quantity);

    const strikerTotalAmount = oneGrand * BigInt(quantity);
    expect(strikerPlayerSupply.tokens).to.equals(strikerTotalAmount);

    //Create and Stake: _recordFee
    const allFees = await poolViewProxy.getAccumulatedFee(ballsToken.getAddress());
    console.log("All BallsToken Fees: ", allFees);

    const ballerCreateFees = await poolViewProxy.createFee(oneGrand);
    const ballerStakeFees = await poolViewProxy.stakeFee(oneGrand);
    const strikerStakeFees = await poolViewProxy.stakeFee(oneGrand);
    const totalAccuFees = ballerCreateFees[0] + ballerStakeFees[0] + strikerStakeFees[0];
    console.log("Total Accumulated Fees: ", totalAccuFees);
    expect(allFees).to.equals(totalAccuFees);
  });
});

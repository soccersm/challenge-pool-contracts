import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { expect } from "chai";
import { ethers } from "hardhat";
import { deploySoccersm } from "./SoccersmDeployFixture";

import { btcEvent, ghanaElectionEvent } from "./mock";
import { coder, encodeMultiOptionByTopic, prepareCreateChallenge } from "./lib";
import {
  getChallengeState,
  getOptionSupply,
  getPlayerOptionSupply,
  getPlayerSupply,
  getPoolSupply,
} from "./test_helpers";

describe("ChallengePool - Stake Challenge", function () {
  it("Should [Stake]", async function () {
    const {
      oneGrand,
      oneMil,
      baller,
      striker,
      ballsToken,
      poolHandlerProxy,
      registryProxy,
      poolViewProxy,
      poolManagerProxy,
      paymaster,
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

    expect(await paymaster.balance(ballsToken, baller)).to.equal(BigInt(0));

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

    expect(await paymaster.balance(ballsToken, baller)).to.equal(BigInt(0));

    await ballsToken.transfer(paymaster, oneMil);

    expect(await paymaster.balance(ballsToken, baller)).to.equal(BigInt(5e18));

    //_incrementSupply after stake
    // baller created and staked challenge
    const ballerPlayerSupply = await getPlayerSupply(
      poolViewProxy,
      0,
      await baller.getAddress()
    );
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
    const noPrediction = ethers.AbiCoder.defaultAbiCoder().encode(
      ["string"],
      ["no"]
    );
    const quantity = 2;

    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(striker) as any).stake(
      0,
      noPrediction,
      quantity,
      stakeParams._paymaster
    );
    expect(await paymaster.balance(ballsToken, striker)).to.equal(BigInt(5e18));

    //_incrementSupply after stake
    //player Supply
    const strikerPlayerSupply = await getPlayerSupply(
      poolViewProxy,
      0,
      await striker.getAddress()
    );

    expect(strikerPlayerSupply.stakes).to.equals(quantity);

    const strikerTotalAmount = oneGrand * BigInt(quantity);
    expect(strikerPlayerSupply.tokens).to.equals(strikerTotalAmount);

    //playerOptionSupply
    //Create challenge with Option
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

    //striker can stake
    //encoded predictions
    const bPrediction = coder.encode(["string"], ["Bawumia"]);
    const mPrediction = coder.encode(["string"], ["Mahama"]);
    const cPrediction = coder.encode(["string"], ["Cheddar"]);

    //encoded options
    const mahamaOption = ethers.keccak256(mPrediction);
    const bawumiaOption = ethers.keccak256(bPrediction);
    const cheddarOption = ethers.keccak256(cPrediction);
    await time.increase(60 * 60 * 12);

    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    await (poolHandlerProxy.connect(striker) as any).stake(
      1,
      bPrediction,
      1,
      ethers.ZeroAddress
    );

    expect(await paymaster.balance(ballsToken, striker)).to.equal(BigInt(5e18));

    //get states
    const strikerOptionSupply = await getPlayerOptionSupply(
      poolViewProxy,
      1,
      await striker.getAddress(),
      bawumiaOption
    );
    console.log("striker options: ", strikerOptionSupply);
    const mahamaOptionSupply = await getOptionSupply(
      poolViewProxy,
      1,
      mahamaOption
    );
    console.log("mahamaOptionsSupply: ", mahamaOptionSupply);
    const bawumiaOptionSupply = await getOptionSupply(
      poolViewProxy,
      1,
      bawumiaOption
    );
    console.log("BawumiaOptionSupply: ", bawumiaOptionSupply);
    const allGhPoolSupply = await getPoolSupply(poolViewProxy, 1);
    console.log("All gh Pool Supply: ", allGhPoolSupply);

    //compare states
    const challengeState_bawumiaOption = await getChallengeState(
      poolViewProxy,
      1,
      await striker.getAddress(),
      bawumiaOption
    );
    const challengeState_mahamaOption = await getChallengeState(
      poolViewProxy,
      1,
      await striker.getAddress(),
      mahamaOption
    );
    console.log(
      "Challenge State: BawumiaOption ",
      challengeState_bawumiaOption
    );

    expect(strikerOptionSupply.withdraw).to.be.equal(
      challengeState_bawumiaOption.playerOptionSupply.withdraw
    );
    expect(strikerOptionSupply.rewards).to.be.equal(
      challengeState_bawumiaOption.playerOptionSupply.rewards
    );
    expect(strikerOptionSupply.tokens).to.be.equal(
      challengeState_bawumiaOption.playerOptionSupply.tokens
    );
    expect(strikerOptionSupply.stakes).to.be.equal(
      challengeState_bawumiaOption.playerOptionSupply.stakes
    );

    //compare state with Bawumia option
    expect(bawumiaOptionSupply.exists).to.be.equal(
      challengeState_bawumiaOption.optionSupply.exists
    );
    expect(bawumiaOptionSupply.rewards).to.be.equal(
      challengeState_bawumiaOption.optionSupply.rewards
    );
    expect(bawumiaOptionSupply.stakes).to.be.equal(
      challengeState_bawumiaOption.optionSupply.stakes
    );
    expect(bawumiaOptionSupply.tokens).to.be.equal(
      challengeState_bawumiaOption.optionSupply.tokens
    );

    //compare state with Mahama option
    console.log("challenge state: MahamaOption: ", challengeState_mahamaOption);
    const ballerOptionSupply = await getPlayerOptionSupply(
      poolViewProxy,
      1,
      await striker.getAddress(),
      mahamaOption
    );

    expect(ballerOptionSupply.withdraw).to.be.equal(
      challengeState_mahamaOption.playerOptionSupply.withdraw
    );
    expect(ballerOptionSupply.rewards).to.be.equal(
      challengeState_mahamaOption.playerOptionSupply.rewards
    );
    expect(ballerOptionSupply.tokens).to.be.equal(
      challengeState_mahamaOption.playerOptionSupply.tokens
    );
    expect(ballerOptionSupply.stakes).to.be.equal(
      challengeState_mahamaOption.playerOptionSupply.stakes
    );

    expect(allGhPoolSupply.stakes).to.be.equal(
      challengeState_bawumiaOption.poolSupply.stakes
    );
    expect(allGhPoolSupply.tokens).to.be.equal(
      challengeState_bawumiaOption.poolSupply.tokens
    );

    //Create and Stake: _recordFee
    const allFees = await poolViewProxy.getAccumulatedFee(
      ballsToken.getAddress()
    );
    console.log("All BallsToken Fees: ", allFees);

    const ballerCreateFees = await poolViewProxy.createFee(oneGrand);
    const ballerGhCreateFees = await poolViewProxy.createFee(oneGrand);
    const ballerGhStakeFees = await poolViewProxy.stakeFee(oneGrand);
    const ballerStakeFees = await poolViewProxy.stakeFee(oneGrand);
    const strikerStakeFees = await poolViewProxy.stakeFee(oneGrand);
    const totalAccuFees =
      ballerCreateFees[0] +
      ballerGhCreateFees[0] +
      ballerGhStakeFees[0] +
      ballerStakeFees[0] * BigInt(2) +
      strikerStakeFees[0];
    console.log("Total Accumulated Fees: ", totalAccuFees);
    expect(allFees).to.equals(totalAccuFees);
  });
});

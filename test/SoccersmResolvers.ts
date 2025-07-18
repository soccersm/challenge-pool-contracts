import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { expect } from "chai";
import { ethers } from "hardhat";
import { deploySoccersm } from "./SoccersmDeployFixture";

import {
  footBallCorrectScore,
  footballOutcomeEvent,
  footballOverUnderEvent,
  multiTotalScoreRange,
  targetEvent,
} from "./mock";
import {
  prepareCreateChallenge,
  coder,
  ASSET_PRICES_MULTIPLIER,
  yesNo,
  prepareAssetPriceTargetProvision,
  prepareMultiFootballScoreRangeProvision,
  encodeMultiOptionByTopic,
  TopicId,
  prepareFootballOutcomeProvision,
  prepareFootballOverUnderProvision,
  prepareFootballScoreProvision,
} from "./lib";
import {
  computeWinnerShare,
  getChallenge,
  getChallengeState,
} from "./test_helpers";

describe("Resolvers", function () {
  it("Should resolve AssetPriceTarget", async function () {
    const {
      registryProxy,
      oneGrand,
      oneMil,
      baller,
      striker,
      keeper,
      ballsToken,
      poolHandlerProxy,
      poolViewProxy,
    } = await loadFixture(deploySoccersm);
    //Setup: Create and Stake a challenge
    const ch = targetEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );
    const createArgs = prepareCreateChallenge(ch.challenge);

    const [, , , prediction] = prepareCreateChallenge(ch.challenge);
    const outcome = coder.decode(["string"], prediction);
    console.log("decodedOutcome:", outcome);

    const winningPrediction = yesNo.yes;
    const loosingPrediction = yesNo.no;
    const quaterMature = ch.maturity - 60 * 60 * 16;
    const halfMature = ch.maturity - 60 * 60 * 12;
    // 3) create the challenge
    await ballsToken
      .connect(baller)
      .approve(
        await poolHandlerProxy.getAddress(),
        (
          await poolViewProxy.createFee(oneGrand)
        )[1]
      );

    await (poolHandlerProxy.connect(baller) as any).createChallenge(
      ...createArgs
    );

    //striker can stake
    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(striker) as any).stake(
      0,
      loosingPrediction,
      2,
      ethers.ZeroAddress
    );

    await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);
    await poolHandlerProxy.stake(0, loosingPrediction, 3, ethers.ZeroAddress);

    //baller can stake again
    await time.increaseTo(BigInt(quaterMature));

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(baller) as any).stake(
      0,
      winningPrediction,
      1,
      ethers.ZeroAddress
    );

    await time.increaseTo(halfMature);
    await ballsToken.transfer(keeper, oneMil);
    await ballsToken
      .connect(keeper)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    await (poolHandlerProxy.connect(keeper) as any).stake(
      0,
      winningPrediction,
      2,
      ethers.ZeroAddress
    );

    await time.increaseTo(ch.maturity);
    const assetPrice = 90_000 * ASSET_PRICES_MULTIPLIER;
    const provideDataParams = prepareAssetPriceTargetProvision(
      ch.assetSymbol,
      ch.maturity,
      assetPrice
    );
    await registryProxy.provideData(...provideDataParams);

    // evaluate & close
    await poolHandlerProxy.evaluate(0);
    await expect(poolHandlerProxy.close(0)).revertedWithCustomError(
      poolHandlerProxy,
      "DisputePeriod"
    );
    await time.increase(60 * 60); // dispute window
    await poolHandlerProxy.close(0);
    const challenge = await getChallenge(poolViewProxy, 0);
    expect(challenge.outcome).to.equal(winningPrediction);

    await expect((poolHandlerProxy.connect(baller) as any).withdraw(0)).to.emit(
      poolHandlerProxy,
      "WinningsWithdrawn"
    );

    await expect(
      (poolHandlerProxy.connect(baller) as any).withdraw(0)
    ).to.be.revertedWithCustomError(poolHandlerProxy, "PlayerAlreadyWithdrawn");

    await expect(
      (poolHandlerProxy.connect(striker) as any).withdraw(0)
    ).to.be.revertedWithCustomError(poolHandlerProxy, "PlayerDidNotWinPool");
  });

  it("should resolve AssetPriceTarget: No", async function () {
    const {
      registryProxy,
      oneGrand,
      baller,
      ballsToken,
      poolHandlerProxy,
      poolViewProxy,
    } = await loadFixture(deploySoccersm);

    // Setup
    const ch = targetEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );
    const createArgs = prepareCreateChallenge(ch.challenge);

    // Create the challenge
    await ballsToken
      .connect(baller)
      .approve(
        await poolHandlerProxy.getAddress(),
        (
          await poolViewProxy.createFee(oneGrand)
        )[1]
      );

    await (poolHandlerProxy.connect(baller) as any).createChallenge(
      ...createArgs
    );

    // Move time to maturity
    await time.increaseTo(ch.maturity);
    const actualPriceBelow = 70_000 * ASSET_PRICES_MULTIPLIER;
    const provideDataParams = prepareAssetPriceTargetProvision(
      ch.assetSymbol,
      ch.maturity,
      actualPriceBelow
    );
    await registryProxy.provideData(...provideDataParams);

    // Evaluate
    await poolHandlerProxy.evaluate(0);
    await time.increase(3600); // pass dispute window
    await poolHandlerProxy.close(0);

    //outcome no
    const resolved = await getChallenge(poolViewProxy, 0);
    expect(resolved.outcome).to.equal(yesNo.no);
    console.log("decodedOutcome: ", coder.decode(["string"], resolved.outcome));
  });

  it("Should resolve multiFootballTotalScoreRange", async function () {
    const {
      registryProxy,
      oneGrand,
      oneMil,
      baller,
      keeper,
      striker,
      ballsToken,
      poolHandlerProxy,
      poolViewProxy,
    } = await loadFixture(deploySoccersm);
    //Setup: Create and Stake a challenge
    const ch = multiTotalScoreRange(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );
    console.log("Challenge", ch);
    const winningPrediction = encodeMultiOptionByTopic(
      TopicId.MultiFootBallTotalScoreRange,
      [2, 4]
    );
    const loosingPrediction1 = encodeMultiOptionByTopic(
      TopicId.MultiFootBallTotalScoreRange,
      [6, 8]
    );

    const footballScore = [1, 2];
    const quaterMature = ch.maturity - 60 * 60 * 16;
    const halfMature = ch.maturity - 60 * 60 * 12;

    const prepareTotalScoreRangeChallenge = prepareCreateChallenge(
      ch.challenge
    );

    await ballsToken
      .connect(baller)
      .approve(
        await poolHandlerProxy.getAddress(),
        (
          await poolViewProxy.createFee(oneGrand)
        )[1]
      );
    await (poolHandlerProxy.connect(baller) as any).createChallenge(
      ...(prepareTotalScoreRangeChallenge as any)
    );

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    //stake
    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(baller) as any).stake(
      0,
      winningPrediction,
      2,
      ethers.ZeroAddress
    );

    await time.increaseTo(quaterMature);
    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(striker) as any).stake(
      0,
      loosingPrediction1,
      2,
      ethers.ZeroAddress
    );

    await time.increaseTo(halfMature);
    await ballsToken.transfer(keeper, oneMil);
    await ballsToken
      .connect(keeper)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    await (poolHandlerProxy.connect(keeper) as any).stake(
      0,
      winningPrediction,
      2,
      ethers.ZeroAddress
    );

    await time.increaseTo(ch.maturity);
    const provideDataParams = prepareMultiFootballScoreRangeProvision(
      ch.matchId,
      footballScore[0],
      footballScore[1]
    );
    await registryProxy.provideData(...provideDataParams);

    await poolHandlerProxy.evaluate(0);
    await expect(poolHandlerProxy.close(0)).revertedWithCustomError(
      poolHandlerProxy,
      "DisputePeriod"
    );
    await time.increase(60 * 60); // dispute period
    await poolHandlerProxy.close(0);
    const challenge = await getChallenge(poolViewProxy, 0);
    expect(challenge.outcome).to.equal(winningPrediction);
    console.log(
      "DecodeOutcome: ",
      coder.decode(["uint256", "uint256"], challenge.outcome)
    );

    const challengeBallerWinningState = await getChallengeState(
      poolViewProxy,
      0,
      baller.address,
      ethers.keccak256(winningPrediction)
    );
    console.log("challengeBallerWinningState", challengeBallerWinningState);

    const ballerShare = computeWinnerShare(
      challengeBallerWinningState.optionSupply.rewards,
      challengeBallerWinningState.optionSupply.tokens,
      challengeBallerWinningState.poolSupply.tokens,
      challengeBallerWinningState.playerOptionSupply.rewards
    );
    const ballerShareView = await poolViewProxy.winnerShare(0, baller.address);
    const ballerShareViewFloor = Math.floor(
      parseFloat(ethers.formatUnits(ballerShareView.toString()))
    );
    const ballerShareFloor = Math.floor(
      parseFloat(ethers.formatUnits(ballerShare.toString()))
    );
    expect(ballerShareViewFloor).to.equal(ballerShareFloor);
    const ballerWithdrawal =
      ballerShareView + challengeBallerWinningState.playerOptionSupply.tokens;
    await expect((poolHandlerProxy.connect(baller) as any).withdraw(0))
      .to.emit(poolHandlerProxy, "WinningsWithdrawn")
      .withArgs(0, baller.address, ballerShareView, ballerWithdrawal)
      .emit(ballsToken, "Transfer")
      .withArgs(
        await poolHandlerProxy.getAddress(),
        baller.address,
        ballerWithdrawal
      );

    await expect(
      (poolHandlerProxy.connect(baller) as any).withdraw(0)
    ).revertedWithCustomError(poolHandlerProxy, "PlayerAlreadyWithdrawn");

    const challengeKeeperWinningState = await getChallengeState(
      poolViewProxy,
      0,
      keeper.address,
      ethers.keccak256(winningPrediction)
    );
    console.log("challengeKeeperWinningState", challengeKeeperWinningState);
    const keeperShare = computeWinnerShare(
      challengeKeeperWinningState.optionSupply.rewards,
      challengeKeeperWinningState.optionSupply.tokens,
      challengeKeeperWinningState.poolSupply.tokens,
      challengeKeeperWinningState.playerOptionSupply.rewards
    );
    const keeperShareView = await poolViewProxy.winnerShare(0, keeper.address);
    const keeperShareViewFloor = Math.floor(
      parseFloat(ethers.formatUnits(keeperShareView.toString()))
    );
    const keeperShareFloor = Math.floor(
      parseFloat(ethers.formatUnits(keeperShare.toString()))
    );
    expect(keeperShareViewFloor).to.equal(keeperShareFloor);

    const keeperWithdrawal =
      keeperShareView + challengeKeeperWinningState.playerOptionSupply.tokens;

    await expect((poolHandlerProxy.connect(keeper) as any).withdraw(0))
      .to.emit(poolHandlerProxy, "WinningsWithdrawn")
      .withArgs(0, keeper.address, keeperShareView, keeperWithdrawal)
      .emit(ballsToken, "Transfer")
      .withArgs(
        await poolHandlerProxy.getAddress(),
        keeper.address,
        keeperWithdrawal
      );

    expect(ballerShareFloor).to.be.greaterThan(keeperShareFloor);

    await expect(
      (poolHandlerProxy.connect(keeper) as any).withdraw(0)
    ).revertedWithCustomError(poolHandlerProxy, "PlayerAlreadyWithdrawn");

    await expect(
      (poolHandlerProxy.connect(keeper) as any).withdraw(0)
    ).revertedWithCustomError(poolHandlerProxy, "PlayerAlreadyWithdrawn");

    await expect(
      (poolHandlerProxy.connect(striker) as any).withdraw(0)
    ).revertedWithCustomError(poolHandlerProxy, "PlayerDidNotWinPool");
  });

  it("Should resolve footballOutcome", async function () {
    const {
      registryProxy,
      oneGrand,
      oneMil,
      baller,
      keeper,
      striker,
      ballsToken,
      poolHandlerProxy,
      poolViewProxy,
    } = await loadFixture(deploySoccersm);
    //Setup: Create and Stake a challenge
    const ch = footballOutcomeEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress,
      "home"
    );
    console.log("Challenge", ch);

    const winningPrediction1 = yesNo.yes;
    const winningPrediction2 = yesNo.yes;
    const loosingPrediction1 = yesNo.no;
    const loosingPrediction2 = yesNo.no;

    const footballScore = [3, 1];
    const quaterMature = ch.maturity - 60 * 60 * 16;
    const halfMature = ch.maturity - 60 * 60 * 12;

    const prepareFootballOutcome = prepareCreateChallenge(ch.challenge);
    console.log("Outcome", prepareFootballOutcome);
    await ballsToken
      .connect(baller)
      .approve(
        await poolHandlerProxy.getAddress(),
        (
          await poolViewProxy.createFee(oneGrand)
        )[1]
      );
    await (poolHandlerProxy.connect(baller) as any).createChallenge(
      ...(prepareFootballOutcome as any)
    );

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    //stake
    await (poolHandlerProxy.connect(baller) as any).stake(
      0,
      winningPrediction1,
      2,
      ethers.ZeroAddress
    );

    await time.increaseTo(quaterMature);
    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(striker) as any).stake(
      0,
      loosingPrediction1,
      2,
      ethers.ZeroAddress
    );

    await time.increaseTo(halfMature);
    await ballsToken.transfer(keeper, oneMil);
    await ballsToken
      .connect(keeper)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    await (poolHandlerProxy.connect(keeper) as any).stake(
      0,
      winningPrediction2,
      2,
      ethers.ZeroAddress
    );

    await (poolHandlerProxy.connect(striker) as any).stake(
      0,
      loosingPrediction2,
      1,
      ethers.ZeroAddress
    );

    await time.increaseTo(ch.maturity);
    const provideDataParams = prepareFootballOutcomeProvision(
      ch.matchId,
      footballScore[0],
      footballScore[1]
    );
    await registryProxy.provideData(...provideDataParams);

    await poolHandlerProxy.evaluate(0);
    await expect(poolHandlerProxy.close(0)).revertedWithCustomError(
      poolHandlerProxy,
      "DisputePeriod"
    );
    await time.increase(60 * 60); // dispute period
    await poolHandlerProxy.close(0);
    const challenge = await getChallenge(poolViewProxy, 0);
    console.log(
      "DecodeOutcome: ",
      coder.decode(["string"], challenge.outcome),
      "prediction: ",
      coder.decode(["string"], winningPrediction1)
    );

    //withdraw
    await expect((poolHandlerProxy.connect(baller) as any).withdraw(0))
      .to.emit(poolHandlerProxy, "WinningsWithdrawn")
      .emit(ballsToken, "Transfer");

    await expect(
      (poolHandlerProxy.connect(baller) as any).withdraw(0)
    ).revertedWithCustomError(poolHandlerProxy, "PlayerAlreadyWithdrawn");

    await expect((poolHandlerProxy.connect(keeper) as any).withdraw(0))
      .to.emit(poolHandlerProxy, "WinningsWithdrawn")
      .emit(ballsToken, "Transfer");

    await expect(
      (poolHandlerProxy.connect(keeper) as any).withdraw(0)
    ).revertedWithCustomError(poolHandlerProxy, "PlayerAlreadyWithdrawn");

    await expect(
      (poolHandlerProxy.connect(striker) as any).withdraw(0)
    ).revertedWithCustomError(poolHandlerProxy, "PlayerDidNotWinPool");
  });

  it("Should resolve footballOverUnder", async function () {
    const {
      registryProxy,
      oneGrand,
      oneMil,
      baller,
      keeper,
      striker,
      ballsToken,
      poolHandlerProxy,
      poolViewProxy,
    } = await loadFixture(deploySoccersm);
    //Setup: Create and Stake a challenge
    const ch = footballOverUnderEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress,
      "over",
      "match_001"
    );
    const ch2 = footballOverUnderEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress,
      "under",
      "match_002"
    );

    const winningPrediction1 = yesNo.yes;
    const winningPrediction2 = yesNo.yes;
    const loosingPrediction1 = yesNo.no;
    const loosingPrediction2 = yesNo.no;

    const footballScore = [5, 1];
    const footballScore2 = [1, 2];

    const quaterMature = ch.maturity - 60 * 60 * 16;
    const halfMature = ch.maturity - 60 * 60 * 12;

    const prepareFootballOverUnder = prepareCreateChallenge(ch.challenge);
    console.log("Outcome", prepareFootballOverUnder);
    await ballsToken
      .connect(baller)
      .approve(
        await poolHandlerProxy.getAddress(),
        (
          await poolViewProxy.createFee(oneGrand)
        )[1]
      );
    await (poolHandlerProxy.connect(baller) as any).createChallenge(
      ...(prepareFootballOverUnder as any)
    );

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    const prepareFootballOverUnder2 = prepareCreateChallenge(ch2.challenge);
    await ballsToken
      .connect(baller)
      .approve(
        await poolHandlerProxy.getAddress(),
        (
          await poolViewProxy.createFee(oneGrand)
        )[1]
      );
    await (poolHandlerProxy.connect(baller) as any).createChallenge(
      ...(prepareFootballOverUnder2 as any)
    );

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    //stake
    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(baller) as any).stake(
      0,
      winningPrediction1,
      2,
      ethers.ZeroAddress
    );

    await time.increaseTo(quaterMature);
    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(striker) as any).stake(
      0,
      loosingPrediction1,
      2,
      ethers.ZeroAddress
    );

    await time.increaseTo(halfMature);
    await ballsToken.transfer(keeper, oneMil);
    await ballsToken
      .connect(keeper)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    await (poolHandlerProxy.connect(keeper) as any).stake(
      0,
      winningPrediction2,
      2,
      ethers.ZeroAddress
    );

    await (poolHandlerProxy.connect(striker) as any).stake(
      0,
      loosingPrediction2,
      1,
      ethers.ZeroAddress
    );

    await time.increaseTo(ch.maturity);
    const provideDataParams = prepareFootballOverUnderProvision(
      ch.matchId,
      footballScore[0],
      footballScore[1]
    );
    await registryProxy.provideData(...provideDataParams);

    const provideDataParams2 = prepareFootballOverUnderProvision(
      ch2.matchId,
      footballScore2[0],
      footballScore2[1]
    );
    await time.increaseTo(ch2.maturity + 3600);
    await registryProxy.provideData(...provideDataParams2);

    await poolHandlerProxy.evaluate(0);
    await poolHandlerProxy.evaluate(1);
    await expect(poolHandlerProxy.close(0)).revertedWithCustomError(
      poolHandlerProxy,
      "DisputePeriod"
    );
    await time.increase(60 * 60); // dispute period
    await poolHandlerProxy.close(0);
    await poolHandlerProxy.close(1);
    const challenge = await getChallenge(poolViewProxy, 0);
    const challenge2 = await getChallenge(poolViewProxy, 1);
    console.log(
      "DecodeOutcome: ",
      coder.decode(["string"], challenge.outcome),
      "prediction: ",
      coder.decode(["string"], winningPrediction1)
    );
    console.log(
      "DecodeOutcome2: ",
      coder.decode(["string"], challenge2.outcome),
      "prediction: ",
      coder.decode(["string"], winningPrediction2)
    );

    //withdraw
    await expect((poolHandlerProxy.connect(baller) as any).withdraw(0))
      .to.emit(poolHandlerProxy, "WinningsWithdrawn")
      .emit(ballsToken, "Transfer");

    await expect(
      (poolHandlerProxy.connect(baller) as any).withdraw(0)
    ).revertedWithCustomError(poolHandlerProxy, "PlayerAlreadyWithdrawn");

    await expect((poolHandlerProxy.connect(keeper) as any).withdraw(0))
      .to.emit(poolHandlerProxy, "WinningsWithdrawn")
      .emit(ballsToken, "Transfer");

    await expect(
      (poolHandlerProxy.connect(keeper) as any).withdraw(0)
    ).revertedWithCustomError(poolHandlerProxy, "PlayerAlreadyWithdrawn");

    await expect(
      (poolHandlerProxy.connect(striker) as any).withdraw(0)
    ).revertedWithCustomError(poolHandlerProxy, "PlayerDidNotWinPool");
  });

  it("Resolve footballCorrectScore: yes prediction", async function () {
    const {
      registryProxy,
      oneGrand,
      oneMil,
      baller,
      ballsToken,
      poolHandlerProxy,
      poolViewProxy,
    } = await loadFixture(deploySoccersm);

    const ch = footBallCorrectScore(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );
    const winningPrediction = yesNo.yes;
    const footballScore = [4, 2];


    const prepareFootballCorrectScore = prepareCreateChallenge(ch.challenge);
    await ballsToken
      .connect(baller)
      .approve(
        await poolHandlerProxy.getAddress(),
        (
          await poolViewProxy.createFee(oneGrand)
        )[1]
      );

    await (poolHandlerProxy.connect(baller) as any).createChallenge(
      ...prepareFootballCorrectScore
    );

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    //stakes
    await (poolHandlerProxy.connect(baller) as any).stake(
      0,
      winningPrediction,
      2,
      ethers.ZeroAddress
    );

    await time.increaseTo(ch.maturity);
    const provideDataParams = prepareFootballScoreProvision(
      ch.matchId,
      footballScore[0],
      footballScore[1]
    );
    await registryProxy.provideData(...provideDataParams);

    await poolHandlerProxy.evaluate(0);
    await time.increase(60 * 60);
    await poolHandlerProxy.close(0);
    const challenge = await getChallenge(poolViewProxy, 0);
    console.log(
      "DecodeOutcome: ",
      coder.decode(["string"], challenge.outcome),
      "prediction: ",
      coder.decode(["string"], winningPrediction)
    );
  });
});

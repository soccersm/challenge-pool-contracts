import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deploySoccersm } from "./SoccersmDeployFixture";

import {
  assetMatchComboEvent,
  btcEvent,
  ethPriceRange,
  ghanaElectionEvent,
  matchEvent,
  multiCorrectScore,
  multiOutcome,
  multiTotalExact,
  soccersmEvent,
} from "./mock";
import {
  prepareCreateChallenge,
  coder,
  encodeMultiOptionByTopic,
  prepareStatementProvision,
  TopicId,
  prepareAssetPriceProvision,
  ASSET_PRICES_MULTIPLIER,
  prepareFootballScoreProvision,
  yesNo,
} from "./lib";
import {
  computeWinnerShare,
  getChallenge,
  getChallengeState,
} from "./test_helpers";

describe("ChallengePool - Withdraw", function () {
  it("Statement", async function () {
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

    const ch = ghanaElectionEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );

    const winningPrediction = encodeMultiOptionByTopic(
      TopicId.Statement,
      "Mahama"
    );
    const loosingPrediction1 = encodeMultiOptionByTopic(
      TopicId.Statement,
      "Bawumia"
    );
    const loosingPrediction2 = encodeMultiOptionByTopic(
      TopicId.Statement,
      "Cheddar"
    );

    const quaterMature = ch.maturity - 60 * 60 * 16;
    const halfMature = ch.maturity - 60 * 60 * 12;

    await registryProxy.registerEvent(
      ch.topicId,
      coder.encode(
        ["string", "string", "uint256", "bytes[]"],
        [
          ch.statementId,
          ch.statement,
          ch.maturity,
          ch.options.map((o) => encodeMultiOptionByTopic(ch.topicId, o)),
        ]
      )
    );

    const preparedMultiStementChallenge = prepareCreateChallenge(ch.challenge);

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

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    //striker can stake
    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(striker) as any).stake(
      0,
      loosingPrediction1,
      2,
      ethers.ZeroAddress
    );

    await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);
    await poolHandlerProxy.stake(0, loosingPrediction2, 3, ethers.ZeroAddress);
    //baller can stake again
    await time.increaseTo(BigInt(quaterMature));
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
    const provideDataParams = prepareStatementProvision(
      ch.statementId,
      ch.statement,
      ch.maturity,
      winningPrediction
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

  it("MultiAssetRange", async function () {
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

    const ch = ethPriceRange(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );

    const winningPrediction = encodeMultiOptionByTopic(
      TopicId.MultiAssetRange,
      [6000, 7000]
    );
    const loosingPrediction1 = encodeMultiOptionByTopic(
      TopicId.MultiAssetRange,
      [4000, 5000]
    );
    const loosingPrediction2 = encodeMultiOptionByTopic(
      TopicId.MultiAssetRange,
      [2000, 3000]
    );
    const assetPrice = 6500 * ASSET_PRICES_MULTIPLIER;

    const quaterMature = ch.maturity - 60 * 60 * 16;
    const halfMature = ch.maturity - 60 * 60 * 12;

    const preparedMultiStementChallenge = prepareCreateChallenge(ch.challenge);

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

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    //striker can stake
    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(striker) as any).stake(
      0,
      loosingPrediction1,
      2,
      ethers.ZeroAddress
    );

    await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);
    await poolHandlerProxy.stake(0, loosingPrediction2, 3, ethers.ZeroAddress);
    //baller can stake again
    await time.increaseTo(BigInt(quaterMature));
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
    const provideDataParams = prepareAssetPriceProvision(
      ch.assetSymbol,
      ch.maturity,
      assetPrice
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

  it("MultiFootBallCorrectScore", async function () {
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

    const ch = multiCorrectScore(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );

    const winningPrediction = encodeMultiOptionByTopic(
      TopicId.MultiFootBallCorrectScore,
      [5, 6]
    );
    const loosingPrediction1 = encodeMultiOptionByTopic(
      TopicId.MultiFootBallCorrectScore,
      [1, 2]
    );
    const loosingPrediction2 = encodeMultiOptionByTopic(
      TopicId.MultiFootBallCorrectScore,
      [3, 4]
    );
    const footballScore = [5, 6];

    const quaterMature = ch.maturity - 60 * 60 * 16;
    const halfMature = ch.maturity - 60 * 60 * 12;

    const preparedMultiStementChallenge = prepareCreateChallenge(ch.challenge);

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

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    //striker can stake
    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(striker) as any).stake(
      0,
      loosingPrediction1,
      2,
      ethers.ZeroAddress
    );

    await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);
    await poolHandlerProxy.stake(0, loosingPrediction2, 3, ethers.ZeroAddress);
    //baller can stake again
    await time.increaseTo(BigInt(quaterMature));
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
    const provideDataParams = prepareFootballScoreProvision(
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
  it("MultiFootBallTotalScoreRange", async function () {
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

    const ch = multiCorrectScore(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );

    const winningPrediction = encodeMultiOptionByTopic(
      TopicId.MultiFootBallTotalScoreRange,
      [5, 6]
    );
    const loosingPrediction1 = encodeMultiOptionByTopic(
      TopicId.MultiFootBallTotalScoreRange,
      [1, 2]
    );
    const loosingPrediction2 = encodeMultiOptionByTopic(
      TopicId.MultiFootBallTotalScoreRange,
      [3, 4]
    );
    const footballScore = [5, 6];

    const quaterMature = ch.maturity - 60 * 60 * 16;
    const halfMature = ch.maturity - 60 * 60 * 12;

    const preparedMultiStementChallenge = prepareCreateChallenge(ch.challenge);

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

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    //striker can stake
    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(striker) as any).stake(
      0,
      loosingPrediction1,
      2,
      ethers.ZeroAddress
    );

    await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);
    await poolHandlerProxy.stake(0, loosingPrediction2, 3, ethers.ZeroAddress);
    //baller can stake again
    await time.increaseTo(BigInt(quaterMature));
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
    const provideDataParams = prepareFootballScoreProvision(
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
  it("MultiFootBallOutcome", async function () {
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

    const ch = multiOutcome(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );

    const winningPrediction = encodeMultiOptionByTopic(
      TopicId.MultiFootBallOutcome,
      "away"
    );
    const loosingPrediction1 = encodeMultiOptionByTopic(
      TopicId.MultiFootBallOutcome,
      "home"
    );
    const loosingPrediction2 = encodeMultiOptionByTopic(
      TopicId.MultiFootBallOutcome,
      "draw"
    );
    const footballScore = [5, 6];

    const quaterMature = ch.maturity - 60 * 60 * 16;
    const halfMature = ch.maturity - 60 * 60 * 12;

    const preparedMultiStementChallenge = prepareCreateChallenge(ch.challenge);

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

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    //striker can stake
    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(striker) as any).stake(
      0,
      loosingPrediction1,
      2,
      ethers.ZeroAddress
    );

    await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);
    await poolHandlerProxy.stake(0, loosingPrediction2, 3, ethers.ZeroAddress);
    //baller can stake again
    await time.increaseTo(BigInt(quaterMature));
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
    const provideDataParams = prepareFootballScoreProvision(
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

  it("MultiFootBallTotalExact", async function () {
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

    const ch = multiTotalExact(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );

    const winningPrediction = encodeMultiOptionByTopic(
      TopicId.MultiFootBallTotalExact,
      5
    );
    const loosingPrediction1 = encodeMultiOptionByTopic(
      TopicId.MultiFootBallTotalExact,
      2
    );
    const loosingPrediction2 = encodeMultiOptionByTopic(
      TopicId.MultiFootBallTotalExact,
      7
    );
    const footballScore = [3, 2];

    const quaterMature = ch.maturity - 60 * 60 * 16;
    const halfMature = ch.maturity - 60 * 60 * 12;

    const preparedMultiStementChallenge = prepareCreateChallenge(ch.challenge);

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

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    //striker can stake
    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(striker) as any).stake(
      0,
      loosingPrediction1,
      2,
      ethers.ZeroAddress
    );

    await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);
    await poolHandlerProxy.stake(0, loosingPrediction2, 3, ethers.ZeroAddress);
    //baller can stake again
    await time.increaseTo(BigInt(quaterMature));
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
    const provideDataParams = prepareFootballScoreProvision(
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

  it("FootBallYesNo", async function () {
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

    const ch = matchEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );

    const winningPrediction = yesNo.no;
    const loosingPrediction1 = yesNo.yes;
    const loosingPrediction2 = yesNo.yes;
    const footballScore = [3, 2];

    const quaterMature = ch.maturity - 60 * 60 * 16;
    const halfMature = ch.maturity - 60 * 60 * 12;

    const preparedMultiStementChallenge = prepareCreateChallenge(ch.challenge);

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

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    //striker can stake
    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(striker) as any).stake(
      0,
      loosingPrediction1,
      2,
      ethers.ZeroAddress
    );

    await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);
    await poolHandlerProxy.stake(0, loosingPrediction2, 3, ethers.ZeroAddress);
    //baller can stake again
    await time.increaseTo(BigInt(quaterMature));
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
    const provideDataParams = prepareFootballScoreProvision(
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

  it("AssetsYesNo", async function () {
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

    const ch = btcEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );

    const winningPrediction = yesNo.no;
    const loosingPrediction1 = yesNo.yes;
    const loosingPrediction2 = yesNo.yes;
    const assetPrice = 110000 * ASSET_PRICES_MULTIPLIER;

    const quaterMature = ch.maturity - 60 * 60 * 16;
    const halfMature = ch.maturity - 60 * 60 * 12;

    const preparedMultiStementChallenge = prepareCreateChallenge(ch.challenge);

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

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    //striker can stake
    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(striker) as any).stake(
      0,
      loosingPrediction1,
      2,
      ethers.ZeroAddress
    );

    await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);
    await poolHandlerProxy.stake(0, loosingPrediction2, 3, ethers.ZeroAddress);
    //baller can stake again
    await time.increaseTo(BigInt(quaterMature));
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
    const provideDataParams = prepareAssetPriceProvision(
      ch.assetSymbol,
      ch.maturity,
      assetPrice
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

  it("No Winner", async function () {
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
      poolDisputeProxy,
    } = await loadFixture(deploySoccersm);
    //Setup: Create and Stake a challenge

    const ch = soccersmEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );

    const winningPrediction = yesNo.no;
    const loosingPrediction = yesNo.yes;

    const quaterMature = ch.maturity - 60 * 60 * 16;
    const halfMature = ch.maturity - 60 * 60 * 12;

    await registryProxy.registerEvent(
      ch.topicId,
      coder.encode(
        ["string", "string", "uint256", "bytes[]"],
        [
          ch.statementId,
          ch.statement,
          ch.maturity,
          ch.options.map((o) => encodeMultiOptionByTopic(ch.topicId, o)),
        ]
      )
    );

    const preparedMultiStementChallenge = prepareCreateChallenge(ch.challenge);

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

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    //striker can stake
    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(striker) as any).stake(
      0,
      winningPrediction,
      2,
      ethers.ZeroAddress
    );

    await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);
    await poolHandlerProxy.stake(0, winningPrediction, 3, ethers.ZeroAddress);
    //baller can stake again
    await time.increaseTo(BigInt(quaterMature));
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
    const statementDataParams = prepareStatementProvision(
      ch.statementId,
      ch.statement,
      ch.maturity,
      loosingPrediction
    );
    await registryProxy.provideData(...statementDataParams);

    await poolHandlerProxy.evaluate(0);
    await expect(poolHandlerProxy.close(0)).revertedWithCustomError(
      poolHandlerProxy,
      "DisputePeriod"
    );
    await time.increase(60 * 60); // dispute period
    await poolDisputeProxy.cancel(0);
    const challenge = await getChallenge(poolViewProxy, 0);
    expect(challenge.outcome).to.equal(loosingPrediction);
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
      challengeBallerWinningState.playerOptionSupply.rewards,
      true
    );
    const ballerShareView = await poolViewProxy.winnerShare(0, baller.address);
    console.log(ballerShare);
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
      challengeKeeperWinningState.playerOptionSupply.rewards,
      true
    );
    expect(keeperShare).to.equal(0);
    const keeperShareView = await poolViewProxy.winnerShare(0, keeper.address);
    console.log(keeperShareView);

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
    expect(keeperWithdrawal).to.equal(oneGrand * BigInt(2));
    expect(keeperShareFloor).to.equal(ballerShareFloor);

    await expect(
      (poolHandlerProxy.connect(keeper) as any).withdraw(0)
    ).revertedWithCustomError(poolHandlerProxy, "PlayerAlreadyWithdrawn");

    await expect((poolHandlerProxy.connect(striker) as any).withdraw(0))
      .to.emit(ballsToken, "Transfer")
      .withArgs(
        await poolHandlerProxy.getAddress(),
        striker.address,
        oneGrand * BigInt(2)
      );
    await expect(
      (poolHandlerProxy.connect(striker) as any).withdraw(0)
    ).revertedWithCustomError(poolHandlerProxy, "PlayerAlreadyWithdrawn");
  });

  it("Cancel", async function () {
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
      poolDisputeProxy,
    } = await loadFixture(deploySoccersm);
    //Setup: Create and Stake a challenge

    const ch = assetMatchComboEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );

    const winningPrediction = yesNo.no;
    const loosingPrediction1 = yesNo.yes;
    const loosingPrediction2 = yesNo.yes;
    const assetPrice = 110000 * ASSET_PRICES_MULTIPLIER;
    const footballScore = [3, 2];

    const quaterMature = ch.maturity - 60 * 60 * 16;
    const halfMature = ch.maturity - 60 * 60 * 12;

    const preparedMultiStementChallenge = prepareCreateChallenge(ch.challenge);

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

    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), oneMil);

    //striker can stake
    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    await (poolHandlerProxy.connect(striker) as any).stake(
      0,
      loosingPrediction1,
      2,
      ethers.ZeroAddress
    );

    await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);
    await poolHandlerProxy.stake(0, loosingPrediction2, 3, ethers.ZeroAddress);
    //baller can stake again
    await time.increaseTo(BigInt(quaterMature));
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
    const assetDataParams = prepareAssetPriceProvision(
      ch.assetSymbol,
      ch.maturity,
      assetPrice
    );
    const footballDataParams = prepareFootballScoreProvision(
      ch.matchId,
      footballScore[0],
      footballScore[1]
    );
    await registryProxy.provideData(...assetDataParams);
    await registryProxy.provideData(...footballDataParams);

    await poolHandlerProxy.evaluate(0);
    await expect(poolHandlerProxy.close(0)).revertedWithCustomError(
      poolHandlerProxy,
      "DisputePeriod"
    );
    await time.increase(60 * 60); // dispute period
    await poolDisputeProxy.cancel(0);
    const challenge = await getChallenge(poolViewProxy, 0);
    expect(challenge.outcome).to.equal(winningPrediction);
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
      challengeBallerWinningState.playerOptionSupply.rewards,
      true
    );
    const ballerShareView = await poolViewProxy.winnerShare(0, baller.address);
    console.log(ballerShare);
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
      challengeKeeperWinningState.playerOptionSupply.rewards,
      true
    );
    const keeperShareView = await poolViewProxy.winnerShare(0, keeper.address);
    console.log(keeperShareView);

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

    expect(keeperShareFloor).to.equal(ballerShareFloor);

    await expect(
      (poolHandlerProxy.connect(keeper) as any).withdraw(0)
    ).revertedWithCustomError(poolHandlerProxy, "PlayerAlreadyWithdrawn");
    await (poolHandlerProxy.connect(striker) as any).withdraw(0);
    await expect(
      (poolHandlerProxy.connect(striker) as any).withdraw(0)
    ).revertedWithCustomError(poolHandlerProxy, "PlayerAlreadyWithdrawn");
  });
});

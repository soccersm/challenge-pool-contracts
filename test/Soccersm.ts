import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, ignition } from "hardhat";

import SoccersmModule from "../ignition/modules/Soccersm";
import ChallengePoolModule from "../ignition/modules/ChallengePool";
import DataProvidersModule from "../ignition/modules/DataProviders";
import PoolResolversModule from "../ignition/modules/PoolResolvers";
import AirdropPaymasterModule from "../ignition/modules/AirdropPaymaster";
import CreateTopicsModule from "../ignition/modules/CreateTopics";

describe("Soccersm", function () {
  async function deploySoccersm() {
    const [
      owner,
      oracle,
      council,
      poolManager,
      topicRegistrar,
      baller,
      striker,
      keeper,
    ] = await ethers.getSigners();
    const { soccersm, cutProxy, acProxy } = await ignition.deploy(
      SoccersmModule
    );
    const {
      registryProxy,
      poolHandlerProxy,
      poolDisputeProxy,
      poolManagerProxy,
    } = await ignition.deploy(ChallengePoolModule);
    const {
      assetPriceDataProvider,
      footBallScoresProvider,
      statementDataProvider,
    } = await ignition.deploy(DataProvidersModule);
    const {
      assetPriceBoundedResolver,
      assetPriceTargetResolver,
      multiAssetRangeResolver,
      footBallCorrectScoreResolver,
      footBallOutcomeResolver,
      footballOverUnderResolver,
      multiFootBallCorrectScoreResolver,
      multiFootBallOutcomeResolver,
      multiFootBallTotalExactResolver,
      multiFootBallTotalScoreRangeResolver,
      statementResolver,
    } = await ignition.deploy(PoolResolversModule);
    const { paymaster } = await ignition.deploy(AirdropPaymasterModule);
    await ignition.deploy(CreateTopicsModule);
    const BallsToken = await ethers.getContractFactory("BallsToken");
    const ballsToken = await BallsToken.deploy();

    await poolManagerProxy.addStakeToken(ballsToken);

    const minStakeAmount = BigInt(1 * 1e18);
    const oneMil = BigInt(minStakeAmount * BigInt(1e6));
    const oneGrand = BigInt(minStakeAmount * BigInt(1e3));

    await ballsToken.transfer(baller, oneMil);
    await ballsToken.transfer(striker, oneMil);
    await ballsToken.transfer(keeper, oneMil);
    return {
      soccersm,
      cutProxy,
      acProxy,
      registryProxy,
      poolHandlerProxy,
      poolDisputeProxy,
      poolManagerProxy,
      assetPriceDataProvider,
      footBallScoresProvider,
      statementDataProvider,
      assetPriceBoundedResolver,
      assetPriceTargetResolver,
      multiAssetRangeResolver,
      footBallCorrectScoreResolver,
      footBallOutcomeResolver,
      footballOverUnderResolver,
      multiFootBallCorrectScoreResolver,
      multiFootBallOutcomeResolver,
      multiFootBallTotalExactResolver,
      multiFootBallTotalScoreRangeResolver,
      statementResolver,
      paymaster,
      ballsToken,
      owner,
      oracle,
      council,
      poolManager,
      topicRegistrar,
      baller,
      striker,
      keeper,
      oneMil,
      oneGrand,
    };
  }
  it("Should Deploy", async function () {
    await loadFixture(deploySoccersm);
  });

  describe("ChallengePool", async function () {
    it("Should Create Chalenge", async function () {
      const { owner, baller, ballsToken, poolHandlerProxy } = await loadFixture(deploySoccersm);
    });
    it("Should Stake Chalenge", async function () {});
    it("Should Early Withdraw", async function () {});
    it("Should Create Chalenge", async function () {});
  });
});

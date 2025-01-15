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
import {
  btcEvent,
  ethPriceRange,
  ghanaElectionEvent,
  matchEvent,
  multiCorrectScore,
  multiOutcome,
  multiTotalExact,
  multiTotalScoreRange,
  soccersmEvent,
} from "./mock";
import {
  coder,
  encodeMultiOptionByTopic,
  prepareCreateChallenge,
  TopicId,
} from "./lib";

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
    const soccersm = await ignition.deploy(SoccersmModule);
    const pool = await ignition.deploy(ChallengePoolModule);
    const providers = await ignition.deploy(DataProvidersModule);
    const resolvers = await ignition.deploy(PoolResolversModule);
    const air = await ignition.deploy(AirdropPaymasterModule);
    await ignition.deploy(CreateTopicsModule);
    const BallsToken = await ethers.getContractFactory("BallsToken");
    const ballsToken = await BallsToken.deploy();
    await pool.poolManagerProxy.addStakeToken(await ballsToken.getAddress());
    const minStakeAmount = BigInt(1 * 1e18);
    const oneMil = BigInt(minStakeAmount * BigInt(1e6));
    const oneGrand = BigInt(minStakeAmount * BigInt(1e3));

    await ballsToken.transfer(baller, oneMil);
    await ballsToken.transfer(striker, oneMil);
    await ballsToken.approve(air.paymaster, oneMil);
    await air.paymaster.depositFor(ballsToken, keeper, oneMil);
    return {
      soccersm,
      air,
      ballsToken,
      providers,
      resolvers,
      pool,
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
    it("Should [Create, Stake, EarlyWithdraw]", async function () {
      const {
        oneGrand,
        baller,
        ballsToken,
        pool,
        keeper,
        air,
      } = await loadFixture(deploySoccersm);
      const btcChallenge = btcEvent(
        await ballsToken.getAddress(),
        1,
        oneGrand,
        ethers.ZeroAddress
      );
      const preparedBTCChallenge = prepareCreateChallenge(
        btcChallenge.challenge
      );
      await ballsToken
        .connect(baller)
        .approve(
          await pool.poolHandlerProxy.getAddress(),
          (
            await pool.poolHandlerProxy.createFee(oneGrand)
          )[1]
        );
      await (pool.poolHandlerProxy.connect(baller) as any).createChallenge(
        ...(preparedBTCChallenge as any)
      );
      const matchChallenge = matchEvent(
        await ballsToken.getAddress(),
        1,
        oneGrand,
        ethers.ZeroAddress
      );
      const preparedMatchChallenge = prepareCreateChallenge(
        matchChallenge.challenge
      );
      await ballsToken
        .connect(baller)
        .approve(
          await pool.poolHandlerProxy.getAddress(),
          (
            await pool.poolHandlerProxy.createFee(oneGrand)
          )[1]
        );
      await (pool.poolHandlerProxy.connect(baller) as any).createChallenge(
        ...(preparedMatchChallenge as any)
      );
      const ethPriceRangeChallenge = ethPriceRange(
        await ballsToken.getAddress(),
        1,
        oneGrand,
        ethers.ZeroAddress
      );
      const preparedETHChallenge = prepareCreateChallenge(
        ethPriceRangeChallenge.challenge
      );
      await ballsToken
        .connect(baller)
        .approve(
          await pool.poolHandlerProxy.getAddress(),
          (
            await pool.poolHandlerProxy.createFee(oneGrand)
          )[1]
        );
      await (pool.poolHandlerProxy.connect(baller) as any).createChallenge(
        ...(preparedETHChallenge as any)
      );

      const multiCorrectScoreChallenge = multiCorrectScore(
        await ballsToken.getAddress(),
        1,
        oneGrand,
        ethers.ZeroAddress
      );
      const preparedMultiCorrectScoreChallenge = prepareCreateChallenge(
        multiCorrectScoreChallenge.challenge
      );
      await ballsToken
        .connect(baller)
        .approve(
          await pool.poolHandlerProxy.getAddress(),
          (
            await pool.poolHandlerProxy.createFee(oneGrand)
          )[1]
        );
      await (pool.poolHandlerProxy.connect(baller) as any).createChallenge(
        ...(preparedMultiCorrectScoreChallenge as any)
      );

      const multiOutcomeChallenge = multiOutcome(
        await ballsToken.getAddress(),
        1,
        oneGrand,
        ethers.ZeroAddress
      );
      const preparedMultiOutcomeChallenge = prepareCreateChallenge(
        multiOutcomeChallenge.challenge
      );
      await ballsToken
        .connect(baller)
        .approve(
          await pool.poolHandlerProxy.getAddress(),
          (
            await pool.poolHandlerProxy.createFee(oneGrand)
          )[1]
        );
      await (pool.poolHandlerProxy.connect(baller) as any).createChallenge(
        ...(preparedMultiOutcomeChallenge as any)
      );

      const multiTotalExactChallenge = multiTotalExact(
        await ballsToken.getAddress(),
        1,
        oneGrand,
        ethers.ZeroAddress
      );
      const preparedMultiTotalExactChallenge = prepareCreateChallenge(
        multiTotalExactChallenge.challenge
      );
      await ballsToken
        .connect(baller)
        .approve(
          await pool.poolHandlerProxy.getAddress(),
          (
            await pool.poolHandlerProxy.createFee(oneGrand)
          )[1]
        );
      await (pool.poolHandlerProxy.connect(baller) as any).createChallenge(
        ...(preparedMultiTotalExactChallenge as any)
      );

      const multiTotalScoreRangeChallenge = multiTotalExact(
        await ballsToken.getAddress(),
        1,
        oneGrand,
        ethers.ZeroAddress
      );
      const preparedMultiTotalScoreRangeChallenge = prepareCreateChallenge(
        multiTotalScoreRangeChallenge.challenge
      );
      await ballsToken
        .connect(baller)
        .approve(
          await pool.poolHandlerProxy.getAddress(),
          (
            await pool.poolHandlerProxy.createFee(oneGrand)
          )[1]
        );
      await (pool.poolHandlerProxy.connect(baller) as any).createChallenge(
        ...(preparedMultiTotalScoreRangeChallenge as any)
      );

      const gh = ghanaElectionEvent(
        await ballsToken.getAddress(),
        1,
        oneGrand,
        ethers.ZeroAddress
      );

      await pool.registryProxy.registerEvent(
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

      const preparedMultiStementChallenge = prepareCreateChallenge(
        gh.challenge
      );

      await ballsToken
        .connect(baller)
        .approve(
          await pool.poolHandlerProxy.getAddress(),
          (
            await pool.poolHandlerProxy.createFee(oneGrand)
          )[1]
        );
      await (pool.poolHandlerProxy.connect(baller) as any).createChallenge(
        ...(preparedMultiStementChallenge as any)
      );

      const sc = soccersmEvent(
        await ballsToken.getAddress(),
        1,
        oneGrand,
        await air.paymaster.getAddress()
      );

      await pool.registryProxy.registerEvent(
        sc.topicId,
        coder.encode(
          ["string", "string", "uint256", "bytes[]"],
          [
            sc.statementId,
            sc.statement,
            sc.maturity,
            sc.options.map((o) => encodeMultiOptionByTopic(sc.topicId, o)),
          ]
        )
      );

      const preparedStementChallenge = prepareCreateChallenge(
        sc.challenge
      );

      await (pool.poolHandlerProxy.connect(keeper) as any).createChallenge(
        ...(preparedStementChallenge as any)
      );

      expect(await pool.poolManagerProxy.challengeId()).to.equals(9);
    });
    it("Should [Evaluate, Close, Withdraw, Cancel]", async function () {});

    it("Should [Dispute, Settle, ReleaseDispute]", async function () {});
  });

  describe("TopicRegistry", async function () {
    it("Should [Enable, Disable]", async function () {});
  });
});

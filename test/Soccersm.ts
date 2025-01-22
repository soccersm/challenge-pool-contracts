import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, ignition } from "hardhat";

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
  yesNo,
} from "./lib";
import IgniteTestModule from "../ignition/modules/IgniteTest";

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

  const {
    soccersm,
    cutProxy,
    acProxy,
    registryProxy,
    poolHandlerProxy,
    poolDisputeProxy,
    poolManagerProxy,
    paymaster,
  } = await ignition.deploy(IgniteTestModule, { displayUi: true });
  const BallsToken = await ethers.getContractFactory("BallsToken");
  const ballsToken = await BallsToken.deploy();
  await poolManagerProxy.addStakeToken(await ballsToken.getAddress());
  const minStakeAmount = BigInt(1 * 1e18);
  const oneMil = BigInt(minStakeAmount * BigInt(1e6));
  const oneGrand = BigInt(minStakeAmount * BigInt(1e3));

  await ballsToken.transfer(baller, oneMil);
  await ballsToken.transfer(striker, oneMil);
  await ballsToken.approve(paymaster, oneMil);
  await paymaster.depositFor(ballsToken, keeper, oneMil);
  return {
    soccersm,
    ballsToken,
    cutProxy,
    acProxy,
    registryProxy,
    poolHandlerProxy,
    poolDisputeProxy,
    poolManagerProxy,
    paymaster,
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

describe("Soccersm", function () {
  it("Should Deploy", async function () {
    const { registryProxy } = await loadFixture(deploySoccersm);
    console.log(await registryProxy.getTopic("Statement"));
  });

  describe("ChallengePool", async function () {
    it("Should [Create]", async function () {
      const {
        oneGrand,
        baller,
        ballsToken,
        poolHandlerProxy,
        registryProxy,
        poolManagerProxy,
        keeper,
        paymaster,
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
          await poolHandlerProxy.getAddress(),
          (
            await poolHandlerProxy.createFee(oneGrand)
          )[1]
        );
      await (poolHandlerProxy.connect(baller) as any).createChallenge(
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
          await poolHandlerProxy.getAddress(),
          (
            await poolHandlerProxy.createFee(oneGrand)
          )[1]
        );
      await (poolHandlerProxy.connect(baller) as any).createChallenge(
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
          await poolHandlerProxy.getAddress(),
          (
            await poolHandlerProxy.createFee(oneGrand)
          )[1]
        );
      await (poolHandlerProxy.connect(baller) as any).createChallenge(
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
          await poolHandlerProxy.getAddress(),
          (
            await poolHandlerProxy.createFee(oneGrand)
          )[1]
        );
      await (poolHandlerProxy.connect(baller) as any).createChallenge(
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
          await poolHandlerProxy.getAddress(),
          (
            await poolHandlerProxy.createFee(oneGrand)
          )[1]
        );
      await (poolHandlerProxy.connect(baller) as any).createChallenge(
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
          await poolHandlerProxy.getAddress(),
          (
            await poolHandlerProxy.createFee(oneGrand)
          )[1]
        );
      await (poolHandlerProxy.connect(baller) as any).createChallenge(
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
          await poolHandlerProxy.getAddress(),
          (
            await poolHandlerProxy.createFee(oneGrand)
          )[1]
        );
      await (poolHandlerProxy.connect(baller) as any).createChallenge(
        ...(preparedMultiTotalScoreRangeChallenge as any)
      );

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

      const preparedMultiStementChallenge = prepareCreateChallenge(
        gh.challenge
      );

      await ballsToken
        .connect(baller)
        .approve(
          await poolHandlerProxy.getAddress(),
          (
            await poolHandlerProxy.createFee(oneGrand)
          )[1]
        );
      await (poolHandlerProxy.connect(baller) as any).createChallenge(
        ...(preparedMultiStementChallenge as any)
      );

      const sc = soccersmEvent(
        await ballsToken.getAddress(),
        1,
        oneGrand,
        await paymaster.getAddress()
      );

      await registryProxy.registerEvent(
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

      const preparedStementChallenge = prepareCreateChallenge(sc.challenge);

      await (poolHandlerProxy.connect(keeper) as any).createChallenge(
        ...(preparedStementChallenge as any)
      );
      expect(await poolManagerProxy.challengeId()).to.equals(9);
    });
    it("Should [Stake]", async function () {
      const {
        oneGrand,
        baller,
        ballsToken,
        poolHandlerProxy,
        keeper,
        paymaster,
        striker,
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
      const feeP = (await poolHandlerProxy.createFee(oneGrand))[1];

      await ballsToken
        .connect(baller)
        .approve(await poolHandlerProxy.getAddress(), feeP);
      await (poolHandlerProxy.connect(baller) as any).createChallenge(
        ...(preparedBTCChallenge as any)
      );
      await ballsToken
        .connect(striker)
        .approve(
          await poolHandlerProxy.getAddress(),
          (
            await poolHandlerProxy.createFee(BigInt(oneGrand * BigInt(2)))
          )[1]
        );
      await (poolHandlerProxy.connect(striker) as any).stake(
        BigInt(0),
        yesNo.yes,
        BigInt(2),
        oneGrand,
        btcChallenge.maturity,
        ethers.ZeroAddress
      );
    });
    it("Should [Evaluate, Close, Withdraw, Cancel]", async function () {});

    it("Should [Dispute, Settle, ReleaseDispute]", async function () {});
  });

  describe("TopicRegistry", async function () {
    it("Should [Enable, Disable]", async function () {});
  });
});

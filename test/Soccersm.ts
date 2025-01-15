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
import { btcEvent, ghanaElectionEvent, matchEvent } from "./mock";
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
    const paymaster = await ignition.deploy(AirdropPaymasterModule);
    await ignition.deploy(CreateTopicsModule);
    const BallsToken = await ethers.getContractFactory("BallsToken");
    const ballsToken = await BallsToken.deploy();
    await pool.poolManagerProxy.addStakeToken(await ballsToken.getAddress());
    const minStakeAmount = BigInt(1 * 1e18);
    const oneMil = BigInt(minStakeAmount * BigInt(1e6));
    const oneGrand = BigInt(minStakeAmount * BigInt(1e3));

    await ballsToken.transfer(baller, oneMil);
    await ballsToken.transfer(striker, oneMil);
    await ballsToken.transfer(keeper, oneMil);
    return {
      soccersm,
      paymaster,
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
    it("Should Create Challenge", async function () {
      const { owner, baller, ballsToken, soccersm, pool } = await loadFixture(
        deploySoccersm
      );
      const btcChallenge = btcEvent(
        await ballsToken.getAddress(),
        1,
        1000,
        ethers.ZeroAddress
      );
      const preparedBTCChallenge = prepareCreateChallenge(
        btcChallenge.challenge
      );
      await ballsToken
        .connect(baller)
        .approve(await pool.poolHandlerProxy.getAddress(), BigInt(2000 * 1e18));
      await (pool.poolHandlerProxy.connect(baller) as any).createChallenge(
        ...(preparedBTCChallenge as any)
      );
      const matchChallenge = matchEvent(
        await ballsToken.getAddress(),
        1,
        1000,
        ethers.ZeroAddress
      );
      const preparedMatchChallenge = prepareCreateChallenge(
        matchChallenge.challenge
      );
      await ballsToken
        .connect(baller)
        .approve(await pool.poolHandlerProxy.getAddress(), BigInt(2000 * 1e18));
      await (pool.poolHandlerProxy.connect(baller) as any).createChallenge(
        ...(preparedMatchChallenge as any)
      );
    });
    it("Should Stake Challenge", async function () {});
    it("Should Early Withdraw", async function () {});
    it("Should Close Challenge", async function () {});
    it("Should Withdraw Challenge", async function () {});
    it("Should Cancel Challenge", async function () {});
    it("Should Dispute Challenge", async function () {});
    it("Should Settle Challenge", async function () {});
    it("Should Evaluate Challenge", async function () {});
    it("Should Release Challenge", async function () {});
  });

  describe("TopicRegistry", async function () {
    it("Should Enable Topic", async function () {});
    it("Should Disable Topic", async function () {});
  });
});

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
import { btcEvent, ghanaElectionEvent } from "../scripts/mock";
import {
  coder,
  encodeMultiOptionByTopic,
  prepareCreateChallenge,
  TopicId,
} from "../scripts/lib";

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
    it("Should Create Chalenge", async function () {
      const { owner, baller, ballsToken, soccersm, pool } = await loadFixture(
        deploySoccersm
      );
      const { challenge, ...others } = btcEvent(
        await ballsToken.getAddress(),
        1,
        1000,
        ethers.ZeroAddress
      );
      const preparedChallenge = prepareCreateChallenge(challenge);
      await ballsToken.approve(
        await pool.poolHandlerProxy.getAddress(),
        BigInt(2000 * 1e18)
      );
      await pool.poolHandlerProxy.createChallenge(...preparedChallenge as any);
    });
    it("Should Stake Chalenge", async function () {});
    it("Should Early Withdraw", async function () {});
    it("Should Create Chalenge", async function () {});
  });
});

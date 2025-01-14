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
import { ghanaElectionEvent } from "../scripts/mock";
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
    const s = await ignition.deploy(SoccersmModule);
    await ignition.deploy(ChallengePoolModule);
    await ignition.deploy(DataProvidersModule);
    await ignition.deploy(PoolResolversModule);
    await ignition.deploy(AirdropPaymasterModule);
    await ignition.deploy(CreateTopicsModule);
    const BallsToken = await ethers.getContractFactory("BallsToken");
    const ballsToken = await BallsToken.deploy();
    const soccersm = await ethers.getContractAt("ISoccersm", await s.soccersm.getAddress())

    await soccersm.addStakeToken(await ballsToken.getAddress());
  
    const minStakeAmount = BigInt(1 * 1e18);
    const oneMil = BigInt(minStakeAmount * BigInt(1e6));
    const oneGrand = BigInt(minStakeAmount * BigInt(1e3));

    await ballsToken.transfer(baller, oneMil);
    await ballsToken.transfer(striker, oneMil);
    await ballsToken.transfer(keeper, oneMil);
    return {
      soccersm,
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
      const { owner, baller, ballsToken, soccersm } = await loadFixture(
        deploySoccersm
      );
      const { challenge, ...others } = ghanaElectionEvent(
        await ballsToken.getAddress(),
        1,
        1000,
        ethers.ZeroAddress
      );
      await expect(
        soccersm.registerEvent(
          others.topicId,
          coder.encode(
            ["string", "string", "uint256", "bytes[]"],
            [
              others.statementId,
              others.statement,
              others.maturity,
              challenge.options.map((o) =>
                encodeMultiOptionByTopic(others.topicId, o)
              ),
            ]
          )
        )
      ).to.emit(soccersm, "DataRegistered");
      const preparedChallenge = prepareCreateChallenge(challenge);
      await soccersm.createChallenge(...preparedChallenge);
    });
    it("Should Stake Chalenge", async function () {});
    it("Should Early Withdraw", async function () {});
    it("Should Create Chalenge", async function () {});
  });
});

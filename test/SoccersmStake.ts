import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { expect } from "chai";
import { ethers, ignition } from "hardhat";
import { deploySoccersm } from "./SoccersmDeployFixture";

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

describe("ChallengePool - Stake Challenge", function () {
    it("Should [Stake]", async function () {
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
    });
})
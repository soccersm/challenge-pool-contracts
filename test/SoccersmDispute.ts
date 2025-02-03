import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { expect } from "chai";
import { ethers } from "hardhat";
import { deploySoccersm } from "./SoccersmDeployFixture";

import {
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
  coder,
  encodeMultiOptionByTopic,
  prepareCreateChallenge,
  yesNo,
} from "./lib";
import {
  getChallenge,
  getChallengeState,
  getPlayerOptionSupply,
} from "./test_helpers";
import { keccak256 } from "thirdweb";
import { bigint } from "hardhat/internal/core/params/argumentTypes";

describe("ChallengePool - Dispute", function () {
  it("Should [Dispute]", async function () {
    const {
      oneGrand,
      baller,
      ballsToken,
      poolHandlerProxy,
      registryProxy,
      poolViewProxy,
      poolManagerProxy,
      keeper,
      paymaster,
    } = await loadFixture(deploySoccersm);

    // Dispute: Setup
    
  });
});

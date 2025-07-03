// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {
  functionSelectors,
  FacetCutAction,
} from "../../lib";
import { ethers } from "hardhat";

const ChallengePoolHandler_CommunityChallengeEventUpdateModule = buildModule(
  "ChallengePoolHandler_CommunityChallengeEventUpdateModule",
  (m) => {
    const soccersm = "0x56d3719CcB48124d7CeE71F70B3e0bAa860E7FB6";
    const cutProxy = m.contractAt("DiamondCutFacet", soccersm);

    const cphS = functionSelectors("ChallengePoolHandler");
    const cph = m.contract("ChallengePoolHandler");
    const cphC = [cph, FacetCutAction.Replace, cphS];

    m.call(
      cutProxy,
      "diamondCut",
      [[cphC], ethers.ZeroAddress, ethers.ZeroHash],
      { id: "ChallengePoolDiamondCut" }
    );

    const poolHandlerProxy = m.contractAt("ChallengePoolHandler", soccersm, {
      id: "SoccersmChallengePoolHandler",
    });

    return {
      poolHandlerProxy,
    };
  }
);

export default ChallengePoolHandler_CommunityChallengeEventUpdateModule;

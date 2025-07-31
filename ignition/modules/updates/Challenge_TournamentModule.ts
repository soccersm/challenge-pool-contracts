// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { functionSelectors, FacetCutAction } from "../../lib";
import { ethers } from "hardhat";

const Challenge_TournamentModule = buildModule(
  "Challenge_TournamentModule",
  (m) => {
    const soccersm = "0x56d3719CcB48124d7CeE71F70B3e0bAa860E7FB6";
    const cutProxy = m.contractAt("DiamondCutFacet", soccersm);

    const tommS = functionSelectors("Tournament");
    const tomm = m.contract("Tournament");
    const tommC = [tomm, FacetCutAction.Add, tommS];

    m.call(
      cutProxy,
      "diamondCut",
      [[tommC,], ethers.ZeroAddress, ethers.ZeroHash],
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

export default Challenge_TournamentModule;

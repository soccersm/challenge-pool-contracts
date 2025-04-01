// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { functionSelectors, FacetCutAction } from "../../lib";
import { ethers } from "hardhat";

const ChallengePoolHandler_GelatoModule = buildModule(
  "ChallengePoolHandler_GelatoModule",
  (m) => {
    const soccersm = "0x56d3719CcB48124d7CeE71F70B3e0bAa860E7FB6";
    const cutProxy = m.contractAt("DiamondCutFacet", soccersm);
    
    const cpmS = functionSelectors("ChallengePoolManager");
    const cpm = m.contract("ChallengePoolManager");
    const cpmC = [cpm, FacetCutAction.Add, cpmS];

    const cphS = functionSelectors("ChallengePoolHandler");
    const cph = m.contract("ChallengePoolHandler");
    const cphC = [cph, FacetCutAction.Replace, cphS];

    const cpdS = functionSelectors("ChallengePoolDispute");
    const cpd = m.contract("ChallengePoolDispute");
    const cpdC = [cpd, FacetCutAction.Replace, cpdS];

    const cpvS = functionSelectors("ChallengePoolView");
    const cpv = m.contract("ChallengePoolView");
    const cpvC = [cpv, FacetCutAction.Add, cpvS];

    m.call(
      cutProxy,
      "diamondCut",
      [[cpmC, cpvC, cphC, cpdC], ethers.ZeroAddress, ethers.ZeroHash],
      { id: "ChallengePoolDiamondCut", after: [] }
    );

    return {};
  }
);

export default ChallengePoolHandler_GelatoModule;

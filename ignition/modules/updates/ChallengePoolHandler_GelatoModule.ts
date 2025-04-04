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
    const ncpm = ["0x9258d505"];

    const rcpmC = [
      ethers.ZeroAddress,
      FacetCutAction.Remove,
      cpmS.filter((c) => !ncpm.includes(c)),
    ];

    const cpvS = functionSelectors("ChallengePoolView");
    const ncpv = ["0x3699fbdf"];

    const rcpvC = [
      ethers.ZeroAddress,
      FacetCutAction.Remove,
      cpvS.filter((c) => !ncpv.includes(c)),
    ];

    const cpm = m.contract("ChallengePoolManager");
    const cpmC = [cpm, FacetCutAction.Add, cpmS];

    const cphS = functionSelectors("ChallengePoolHandler");
    const cph = m.contract("ChallengePoolHandler");
    const cphC = [cph, FacetCutAction.Replace, cphS];

    const ghS = functionSelectors("GelatoHandler");
    const gh = m.contract("GelatoHandler");
    const ghC = [gh, FacetCutAction.Add, ghS];

    const cpdS = functionSelectors("ChallengePoolDispute");
    const cpd = m.contract("ChallengePoolDispute");
    const cpdC = [cpd, FacetCutAction.Replace, cpdS];

    const cpv = m.contract("ChallengePoolView");
    const cpvC = [cpv, FacetCutAction.Add, cpvS];

    m.call(
      cutProxy,
      "diamondCut",
      [
        [rcpmC, rcpvC, cpmC, cpvC, cphC, ghC, cpdC],
        ethers.ZeroAddress,
        ethers.ZeroHash,
      ],
      { id: "ChallengePoolDiamondCut", after: [] }
    );

    return {};
  }
);

export default ChallengePoolHandler_GelatoModule;

// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {
  functionSelectors,
  FacetCutAction,
  encodeFunctionData,
  INIT,
} from "../../lib";

const ChallengePoolHandler_StakeAirDropModule = buildModule(
  "ChallengePoolHandler_StakeAirDropModule",
  (m) => {
    const soccersm = "0x56d3719CcB48124d7CeE71F70B3e0bAa860E7FB6";
    const paymaster = "";
    const cutProxy = m.contractAt("DiamondCutFacet", soccersm);

    const cpi = m.contract("StakeAirDropInit");
    const cpiInit = {
      contract: cpi,
      selector: encodeFunctionData("StakeAirDropInit", INIT, [paymaster]),
    };

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
      [[cpmC, cpvC, cphC, cpdC], cpiInit.contract, cpiInit.selector],
      { id: "ChallengePoolDiamondCut" }
    );

    const poolHandlerProxy = m.contractAt("ChallengePoolHandler", soccersm, {
      id: "SoccersmChallengePoolHandler",
    });

    const poolDisputeProxy = m.contractAt("ChallengePoolDispute", soccersm, {
      id: "SoccersmChallengePoolDispute",
    });

    const poolManagerProxy = m.contractAt("ChallengePoolManager", soccersm, {
      id: "SoccersmChallengePoolManager",
    });

    const poolViewProxy = m.contractAt("ChallengePoolView", soccersm, {
      id: "SoccersmChallengePoolView",
    });

    return {
      poolHandlerProxy,
      poolManagerProxy,
      poolViewProxy,
      poolDisputeProxy,
    };
  }
);

export default ChallengePoolHandler_StakeAirDropModule;

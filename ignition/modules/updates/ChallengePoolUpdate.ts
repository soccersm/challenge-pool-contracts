// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {
  functionSigsSelectors,
  functionSelectors,
  FacetCutAction,
  INIT_SIG,
} from "../lib";
import Soccersm from "../Soccersm";

const ChallengePoolUpdateModule = buildModule(
  "ChallengePoolUpdateModule",
  (m) => {
    const soccersm = m.useModule(Soccersm);

    const cpiS = functionSigsSelectors("ChallengePoolUpdateInit");
    const cpi = m.contract("ChallengePoolUpdateInit");
    const cpiInit = { contract: cpi, selector: cpiS[INIT_SIG] };

    const trS = functionSelectors("TopicRegistry");
    const tr = m.contract("TopicRegistry");
    const trC = [tr, FacetCutAction.Replace, trS];

    const cpmS = functionSelectors("ChallengePoolManager");
    const cpm = m.contract("ChallengePoolManager");
    const cpmC = [cpm, FacetCutAction.Replace, cpmS];

    const cphS = functionSelectors("ChallengePoolHandler");
    const cph = m.contract("ChallengePoolHandler");
    const cphC = [cph, FacetCutAction.Replace, cphS];

    const cpdS = functionSelectors("ChallengePoolDispute");
    const cpd = m.contract("ChallengePoolDispute");
    const cpdC = [cpd, FacetCutAction.Replace, cpdS];

    m.call(
      soccersm.cutProxy,
      "diamondCut",
      [[trC, cphC, cpdC, cpmC], cpiInit.contract, cpiInit.selector],
      { id: "ChallengePoolDiamondCut" }
    );

    const registryProxy = m.contractAt("TopicRegistry", soccersm.soccersm, {
      id: "SoccersmTopicRegistry",
    });

    const poolHandlerProxy = m.contractAt(
      "ChallengePoolHandler",
      soccersm.soccersm,
      {
        id: "SoccersmChallengePoolHandler",
      }
    );

    const poolDisputeProxy = m.contractAt(
      "ChallengePoolDispute",
      soccersm.soccersm,
      {
        id: "SoccersmChallengePoolDispute",
      }
    );

    const poolManagerProxy = m.contractAt(
      "ChallengePoolManager",
      soccersm.soccersm,
      {
        id: "SoccersmChallengePoolManager",
      }
    );

    return {
      registryProxy,
      poolHandlerProxy,
      poolDisputeProxy,
      poolManagerProxy,
    };
  }
);

export default ChallengePoolUpdateModule;

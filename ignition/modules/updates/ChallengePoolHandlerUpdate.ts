// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {
  functionSigsSelectors,
  functionSelectors,
  FacetCutAction,
  INIT_SIG,
} from "../../lib";
import Soccersm from "../Soccersm";

const ChallengePoolHandlerUpdateModule = buildModule(
  "ChallengePoolHandlerUpdateModule",
  (m) => {
    const soccersm = m.useModule(Soccersm);

    const cpiS = functionSigsSelectors("ChallengePoolUpdateInit");
    const cpi = m.contract("ChallengePoolUpdateInit");
    const cpiInit = { contract: cpi, selector: cpiS[INIT_SIG] };


    const cphS = functionSelectors("ChallengePoolHandler");
    const cph = m.contract("ChallengePoolHandler");
    const cphC = [cph, FacetCutAction.Replace, cphS];

    m.call(
      soccersm.cutProxy,
      "diamondCut",
      [[cphC], cpiInit.contract, cpiInit.selector],
      { id: "ChallengePoolDiamondCut" }
    );

    const poolHandlerProxy = m.contractAt(
      "ChallengePoolHandler",
      soccersm.soccersm,
      {
        id: "SoccersmChallengePoolHandler",
      }
    );

    return {
      poolHandlerProxy,
    };
  }
);

export default ChallengePoolHandlerUpdateModule;

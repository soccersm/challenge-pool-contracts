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

const ChallengePoolViewModule = buildModule("ChallengePoolViewModule", (m) => {
  const soccersm = m.useModule(Soccersm);

  const cpiS = functionSigsSelectors("ChallengePoolUpdateInit");
  const cpi = m.contract("ChallengePoolUpdateInit");
  const cpiInit = { contract: cpi, selector: cpiS[INIT_SIG] };

  const cpvS = functionSelectors("ChallengePoolView");
  const cpv = m.contract("ChallengePoolView");
  const cpvC = [cpv, FacetCutAction.Add, cpvS];

  m.call(
    soccersm.cutProxy,
    "diamondCut",
    [[cpvC], cpiInit.contract, cpiInit.selector],
    { id: "ChallengePoolDiamondCut" }
  );

  const poolView = m.contractAt("ChallengePoolView", soccersm.soccersm, {
    id: "SoccersmChallengePoolView",
  });

  return {
    poolView,
  };
});

export default ChallengePoolViewModule;

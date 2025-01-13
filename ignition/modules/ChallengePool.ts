// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {
  functionSigsSelectors,
  functionSelectors,
  FacetCutAction,
  INIT_SIG,
} from "./lib";
import Soccersm from "./Soccersm";

const ChallengePoolModule = buildModule("ChallengePoolModule", (m) => {
  const soccersm = m.useModule(Soccersm);

  const trS = functionSelectors("TopicRegistry");
  const tr = m.contract("TopicRegistry");
  const trC = [tr, FacetCutAction.Add, trS];

  const cpiS = functionSigsSelectors("ChallengePoolInit");
  const cpi = m.contract("ChallengePoolInit");
  const cpiInit = { contract: cpi, selector: cpiS[INIT_SIG] };

  const cpmS = functionSelectors("ChallengePoolManager");
  const cpm = m.contract("ChallengePoolManager");
  const cpmC = [cpm, FacetCutAction.Add, cpmS];

  const cS = functionSelectors("ChallengePool");
  const c = m.contract("ChallengePool");
  const cC = [c, FacetCutAction.Add, cS];

  m.call(
    soccersm.cutProxy,
    "diamondCut",
    [[trC, cC, cpmC], cpiInit.contract, cpiInit.selector],
    { id: "ChallengePoolDiamondCut" }
  );

  const registryProxy = m.contractAt("TopicRegistry", soccersm.soccersm, {
    id: "SoccersmTopicRegistry",
  });

  const poolProxy = m.contractAt("ChallengePool", soccersm.soccersm, {
    id: "SoccersmChallengePool",
  });

  const poolManagerProxy = m.contractAt(
    "ChallengePoolManager",
    soccersm.soccersm,
    {
      id: "SoccersmChallengePoolManager",
    }
  );

  return { registryProxy, poolProxy, poolManagerProxy };
});

export default ChallengePoolModule;

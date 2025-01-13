// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { functionSelectors, FacetCutAction } from "./lib";
import Soccersm from "./Soccersm";

const ChallengePoolModule = buildModule("ChallengePoolModule", (m) => {
  const soccersm = m.useModule(Soccersm);

  const triS = functionSelectors("TopicRegistryInit");
  const tri = m.contract("TopicRegistryInit");
  const triInit = { contract: tri, selector: triS[0] };

  const trS = functionSelectors("TopicRegistry");
  const tr = m.contract("TopicRegistry");
  const trC = [tr, FacetCutAction.Add, trS];

  m.call(
    soccersm.cutProxy,
    "diamondCut",
    [[trC], triInit.contract, triInit.selector],
    { id: "TopicRegistryDiamondCut" }
  );

  const cpiS = functionSelectors("ChallengePoolInit");
  const cpi = m.contract("ChallengePoolInit");
  const cpiInit = { contract: cpi, selector: cpiS[0] };

  const cS = functionSelectors("ChallengePool");
  const c = m.contract("ChallengePool");
  const cC = [c, FacetCutAction.Add, cS];

  const cpmS = functionSelectors("ChallengePoolManager");
  const cpm = m.contract("ChallengePoolManager");
  const cpmC = [cpm, FacetCutAction.Add, cpmS];

  m.call(
    soccersm.cutProxy,
    "diamondCut",
    [[cC, cpmC], cpiInit.contract, cpiInit.selector],
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

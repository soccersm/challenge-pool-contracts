// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { functionSelectors, FacetCutAction } from "./lib";

const SoccersmModule = buildModule("SoccersmModule", (m) => {
  const owner = m.getAccount(0);
  const dc = m.contract("DiamondCutFacet");
  const soccersm = m.contract("Soccersm", [owner, dc]);

  const diS = functionSelectors("DiamondInit");
  const di = m.contract("DiamondInit");
  const init = { contract: di, selector: diS[0] };

  const oS = functionSelectors("OwnershipFacet");
  const o = m.contract("OwnershipFacet");
  const oC = [o, FacetCutAction.Add, oS];
  const dlS = functionSelectors("DiamondLoupeFacet");
  const dl = m.contract("DiamondLoupeFacet");
  const dlC = [dl, FacetCutAction.Add, dlS];
  const cutProxy = m.contractAt("DiamondCutFacet", soccersm, {
    id: "SoccersmDiamondCut",
  });
  m.call(cutProxy, "diamondCut", [[oC, dlC], init.contract, init.selector]);

  return { soccersm, cutProxy };
});

export default SoccersmModule;

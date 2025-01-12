// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DiamondCutFacetModule = buildModule("DiamondCutFacetModule", (m) => {
  const ap = m.contract("DiamondCutFacet");

  return { ap };
});

export default DiamondCutFacetModule;

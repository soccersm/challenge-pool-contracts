// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DiamondLoupeFacetModule = buildModule("DiamondLoupeFacetModule", (m) => {
  const ap = m.contract("DiamondLoupeFacet");

  return { ap };
});

export default DiamondLoupeFacetModule;

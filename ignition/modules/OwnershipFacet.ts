// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const OwnershipFacetModule = buildModule("OwnershipFacetModule", (m) => {
  const ap = m.contract("OwnershipFacet");

  return { ap };
});

export default OwnershipFacetModule;

// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import Soccersm from "./Soccersm";

const AirdropPaymasterModule = buildModule("AirdropPaymasterModule", (m) => {
  const soccersm = m.useModule(Soccersm);
  const ap = m.contract("AirdropPaymaster", [soccersm.soccersm]);

  return { ap };
});

export default AirdropPaymasterModule;

// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AirdropPaymasterModule = buildModule("AirdropPaymasterModule", (m) => {
  const paymaster = m.contract("AirdropPaymaster", [
    "0xDE5c8eAFEBEC017D9d26F757B9d7F04A0C1eb177",
  ]);

  return { paymaster };
});

export default AirdropPaymasterModule;

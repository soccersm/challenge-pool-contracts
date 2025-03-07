// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StakePaymasterModule = buildModule("StakePaymasterModule", (m) => {
  const paymaster = m.contract("StakePaymaster", [
    m.getParameter("soccersm", "0x56d3719CcB48124d7CeE71F70B3e0bAa860E7FB6"),
  ]);

  return { paymaster };
});

export default StakePaymasterModule;

// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DataProvidersModule = buildModule("DataProvidersrModule", (m) => {
  const assetPriceDataProvider = m.contract("AssetPriceDataProvider");
  const footBallScoresProvider = m.contract("FootBallScoresProvider");
  const statementDataProvider = m.contract("StatementDataProvider");

  return {
    assetPriceDataProvider,
    footBallScoresProvider,
    statementDataProvider,
  };
});

export default DataProvidersModule;

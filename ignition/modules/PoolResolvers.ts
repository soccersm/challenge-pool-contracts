// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PoolResolversModule = buildModule("PoolResolversModule", (m) => {
  const assetPriceBoundedResolver = m.contract("AssetPriceBoundedResolver");
  const assetPriceTargetResolver = m.contract("AssetPriceTargetResolver");
  const multiAssetRangeResolver = m.contract("MultiAssetRangeResolver");
  const footBallCorrectScoreResolver = m.contract(
    "FootBallCorrectScoreResolver"
  );
  const footBallOutcomeResolver = m.contract("FootBallOutcomeResolver");
  const footballOverUnderResolver = m.contract("FootballOverUnderResolver");
  const multiFootBallCorrectScoreResolver = m.contract(
    "MultiFootBallCorrectScoreResolver"
  );
  const multiFootBallOutcomeResolver = m.contract(
    "MultiFootBallOutcomeResolver"
  );
  const multiFootBallTotalExactResolver = m.contract(
    "MultiFootBallTotalExactResolver"
  );
  const multiFootBallTotalScoreRangeResolver = m.contract(
    "MultiFootBallTotalScoreRangeResolver"
  );
  const statementResolver = m.contract("StatementResolver");

  return {
    assetPriceBoundedResolver,
    assetPriceTargetResolver,
    multiAssetRangeResolver,
    footBallCorrectScoreResolver,
    footBallOutcomeResolver,
    footballOverUnderResolver,
    multiFootBallCorrectScoreResolver,
    multiFootBallOutcomeResolver,
    multiFootBallTotalExactResolver,
    multiFootBallTotalScoreRangeResolver,
    statementResolver,
  };
});

export default PoolResolversModule;

// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import PoolResolvers from "../PoolResolvers";

const UpdateTopicsModule = buildModule("UpdateTopicsModule", (m) => {
  const registryProxy = m.contractAt("TopicRegistry", "0x5e367FF2BEBB8559cF3A3117c62b41a2BA3463B8", {
    id: "SoccersmTopicRegistry",
  });

  const resolvers = m.useModule(PoolResolvers);
  const assetPriceDataProvider = m.contract("AssetPriceDataProvider");
  const footBallScoresProvider = m.contract("FootBallScoresProvider");
  const statementDataProvider = m.contract("StatementDataProvider");

  const topics = [
    [
      "AssetPriceBounded",
      resolvers.assetPriceBoundedResolver,
      assetPriceDataProvider,
    ],
    [
      "AssetPriceTarget",
      resolvers.assetPriceTargetResolver,
      assetPriceDataProvider,
    ],
    [
      "MultiAssetRange",
      resolvers.multiAssetRangeResolver,
      assetPriceDataProvider,
    ],
    [
      "FootBallCorrectScore",
      resolvers.footBallCorrectScoreResolver,
      footBallScoresProvider,
    ],
    [
      "FootBallOutcome",
      resolvers.footBallOutcomeResolver,
      footBallScoresProvider,
    ],
    [
      "FootballOverUnder",
      resolvers.footballOverUnderResolver,
      footBallScoresProvider,
    ],
    [
      "MultiFootBallCorrectScore",
      resolvers.multiFootBallCorrectScoreResolver,
      footBallScoresProvider,
    ],
    [
      "MultiFootBallOutcome",
      resolvers.multiFootBallOutcomeResolver,
      footBallScoresProvider,
    ],
    [
      "MultiFootBallTotalExact",
      resolvers.multiFootBallTotalExactResolver,
      footBallScoresProvider,
    ],
    [
      "MultiFootBallTotalScoreRange",
      resolvers.multiFootBallTotalScoreRangeResolver,
      footBallScoresProvider,
    ],
    ["Statement", resolvers.statementResolver, statementDataProvider],
  ];
  for (const topic of topics) {
    m.call(registryProxy, "updateTopic", topic, {
      id: `updateTopic_${topic[0]}`,
    });
  }
  return {};
});

export default UpdateTopicsModule;

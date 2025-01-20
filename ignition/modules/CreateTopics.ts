// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import ChallengePool from "./ChallengePool";
import DataProviders from "./DataProviders";
import PoolResolvers from "./PoolResolvers";

const CreateTopicsModule = buildModule("CreateTopicsModule", (m) => {
  const cp = m.useModule(ChallengePool);
  const providers = m.useModule(DataProviders);
  const resolvers = m.useModule(PoolResolvers);

  const topics = [
    [
      "AssetPriceBounded",
      resolvers.assetPriceBoundedResolver,
      providers.assetPriceDataProvider,
    ],
    [
      "AssetPriceTarget",
      resolvers.assetPriceTargetResolver,
      providers.assetPriceDataProvider,
    ],
    [
      "MultiAssetRange",
      resolvers.multiAssetRangeResolver,
      providers.assetPriceDataProvider,
    ],
    [
      "FootBallCorrectScore",
      resolvers.footBallCorrectScoreResolver,
      providers.footBallScoresProvider,
    ],
    [
      "FootBallOutcome",
      resolvers.footBallOutcomeResolver,
      providers.footBallScoresProvider,
    ],
    [
      "FootballOverUnder",
      resolvers.footballOverUnderResolver,
      providers.footBallScoresProvider,
    ],
    [
      "MultiFootBallCorrectScore",
      resolvers.multiFootBallCorrectScoreResolver,
      providers.footBallScoresProvider,
    ],
    [
      "MultiFootBallOutcome",
      resolvers.multiFootBallOutcomeResolver,
      providers.footBallScoresProvider,
    ],
    [
      "MultiFootBallTotalExact",
      resolvers.multiFootBallTotalExactResolver,
      providers.footBallScoresProvider,
    ],
    [
      "MultiFootBallTotalScoreRange",
      resolvers.multiFootBallTotalScoreRangeResolver,
      providers.footBallScoresProvider,
    ],
    ["Statement", resolvers.statementResolver, providers.statementDataProvider],
  ];
  for (const topic of topics) {
    m.call(cp.registryProxy, "createTopic", topic, {
      id: `createTopic_${topic[0]}`,
    });
  }
  return {};
});

export default CreateTopicsModule;

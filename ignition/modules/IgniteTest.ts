// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {
  functionSigsSelectors,
  functionSelectors,
  FacetCutAction,
  INIT_SIG,
} from "../lib";

const IgniteTestModule = buildModule("IgniteTestModule", (m) => {
  const owner = m.getAccount(0);
  const dc = m.contract("DiamondCutFacet");
  const soccersm = m.contract("Soccersm", [owner, dc]);

  const diS = functionSigsSelectors("DiamondInit");
  const di = m.contract("DiamondInit");
  const diInit = { contract: di, selector: diS[INIT_SIG] };

  const oS = functionSelectors("OwnershipFacet");
  const o = m.contract("OwnershipFacet");
  const oC = [o, FacetCutAction.Add, Object.values(oS)];

  const dlS = functionSelectors("DiamondLoupeFacet");
  const dl = m.contract("DiamondLoupeFacet");
  const dlC = [dl, FacetCutAction.Add, Object.values(dlS)];

  const cutProxy = m.contractAt("DiamondCutFacet", soccersm, {
    id: "SoccersmDiamondCutFacet",
  });

  m.call(cutProxy, "diamondCut", [[oC, dlC], diInit.contract, diInit.selector]);

  const aciS = functionSigsSelectors("AccessControlInit");
  const aci = m.contract("AccessControlInit");
  const aciInit = { contract: aci, selector: aciS[INIT_SIG] };

  const acS = functionSelectors("AccessControlFacet");
  const ac = m.contract("AccessControlFacet");
  const acC = [ac, FacetCutAction.Add, Object.values(acS)];

  const psS = functionSelectors("PausableFacet");
  const ps = m.contract("PausableFacet");
  const psC = [ps, FacetCutAction.Add, Object.values(psS)];

  m.call(cutProxy, "diamondCut", [[acC, psC], aciInit.contract, aciInit.selector], {
    id: "AccessControlDiamondCut",
  });

  const acProxy = m.contractAt("AccessControlFacet", soccersm, {
    id: "SoccersmAccessControl",
  });

  const psProxy = m.contractAt("PausableFacet", soccersm, {
    id: "SoccersmPausable",
  });

  const trS = functionSelectors("TopicRegistry");
  const tr = m.contract("TopicRegistry");
  const trC = [tr, FacetCutAction.Add, trS];

  const cpiS = functionSigsSelectors("ChallengePoolInit");
  const cpi = m.contract("ChallengePoolInit");
  const cpiInit = { contract: cpi, selector: cpiS[INIT_SIG] };

  const cpmS = functionSelectors("ChallengePoolManager");
  const cpm = m.contract("ChallengePoolManager");
  const cpmC = [cpm, FacetCutAction.Add, cpmS];

  const cphS = functionSelectors("ChallengePoolHandler");
  const cph = m.contract("ChallengePoolHandler");
  const cphC = [cph, FacetCutAction.Add, cphS];

  const cpdS = functionSelectors("ChallengePoolDispute");
  const cpd = m.contract("ChallengePoolDispute");
  const cpdC = [cpd, FacetCutAction.Add, cpdS];

  const cpvS = functionSelectors("ChallengePoolView");
  const cpv = m.contract("ChallengePoolView");
  const cpvC = [cpv, FacetCutAction.Add, cpvS];

  m.call(
    cutProxy,
    "diamondCut",
    [[trC, cphC, cpdC, cpmC, cpvC], cpiInit.contract, cpiInit.selector],
    { id: "ChallengePoolDiamondCut" }
  );

  const registryProxy = m.contractAt("TopicRegistry", soccersm, {
    id: "SoccersmTopicRegistry",
  });

  const poolHandlerProxy = m.contractAt("ChallengePoolHandler", soccersm, {
    id: "SoccersmChallengePoolHandler",
  });

  const poolDisputeProxy = m.contractAt("ChallengePoolDispute", soccersm, {
    id: "SoccersmChallengePoolDispute",
  });

  const poolManagerProxy = m.contractAt("ChallengePoolManager", soccersm, {
    id: "SoccersmChallengePoolManager",
  });

  const poolViewProxy = m.contractAt("ChallengePoolView", soccersm, {
    id: "SoccersmChallengePoolView",
  });

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

  const assetPriceDataProvider = m.contract("AssetPriceDataProvider");
  const footBallScoresProvider = m.contract("FootBallScoresProvider");
  const statementDataProvider = m.contract("StatementDataProvider");

  const topics = [
    ["AssetPriceBounded", assetPriceBoundedResolver, assetPriceDataProvider],
    ["AssetPriceTarget", assetPriceTargetResolver, assetPriceDataProvider],
    ["MultiAssetRange", multiAssetRangeResolver, assetPriceDataProvider],
    [
      "FootBallCorrectScore",
      footBallCorrectScoreResolver,
      footBallScoresProvider,
    ],
    ["FootBallOutcome", footBallOutcomeResolver, footBallScoresProvider],
    ["FootballOverUnder", footballOverUnderResolver, footBallScoresProvider],
    [
      "MultiFootBallCorrectScore",
      multiFootBallCorrectScoreResolver,
      footBallScoresProvider,
    ],
    [
      "MultiFootBallOutcome",
      multiFootBallOutcomeResolver,
      footBallScoresProvider,
    ],
    [
      "MultiFootBallTotalExact",
      multiFootBallTotalExactResolver,
      footBallScoresProvider,
    ],
    [
      "MultiFootBallTotalScoreRange",
      multiFootBallTotalScoreRangeResolver,
      footBallScoresProvider,
    ],
    ["Statement", statementResolver, statementDataProvider],
  ];
  for (const topic of topics) {
    m.call(registryProxy, "createTopic", topic, {
      id: `createTopic_${topic[0]}`,
    });
  }

  const paymaster = m.contract("AirdropPaymaster", [soccersm]);

  return {
    soccersm,
    cutProxy,
    acProxy,
    psProxy,
    registryProxy,
    poolViewProxy,
    poolHandlerProxy,
    poolDisputeProxy,
    poolManagerProxy,
    paymaster,
  };
});

export default IgniteTestModule;

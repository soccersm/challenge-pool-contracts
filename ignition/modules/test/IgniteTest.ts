// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {
  functionSigsSelectors,
  functionSelectors,
  FacetCutAction,
  INIT_SIG,
  INIT,
} from "../../lib";

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

  m.call(
    cutProxy,
    "diamondCut",
    [[acC, psC], aciInit.contract, aciInit.selector],
    {
      id: "AccessControlDiamondCut",
    }
  );

  const acProxy = m.contractAt("AccessControlFacet", soccersm, {
    id: "SoccersmAccessControl",
  });

  //OwnershipFacet
  const oProxy = m.contractAt("OwnershipFacet", soccersm, {
    id: "SoccersmOwnership",
  });

  const psProxy = m.contractAt("PausableFacet", soccersm, {
    id: "SoccersmPausable",
  });

  const paymaster = m.contract("StakePaymaster", [soccersm]);

  const cpiS = functionSigsSelectors("ChallengePoolInit");
  const cpi = m.contract("ChallengePoolInit");
  const cpiInit = {
    contract: cpi,
    selector: cpiS[INIT_SIG],
  };

  const trS = functionSelectors("TopicRegistry");
  const tr = m.contract("TopicRegistry");
  const trC = [tr, FacetCutAction.Add, trS];

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

  const commS = functionSelectors("Community");
  const comm = m.contract("Community");
  const commC = [comm, FacetCutAction.Add, commS];

  const commvS = functionSelectors("CommunityView");
  const commV = m.contract("CommunityView");
  const commvC = [commV, FacetCutAction.Add, commvS];

  const touS = functionSelectors("Tournament");
  const tou = m.contract("Tournament");
  const touC = [tou, FacetCutAction.Add, touS];

  m.call(
    cutProxy,
    "diamondCut",
    [
      [trC, cphC, cpdC, cpmC, cpvC, commC, commvC, touC],
      cpiInit.contract,
      cpiInit.selector,
    ],
    { id: "ChallengePoolDiamondCut" }
  );

  const tournamentProxy = m.contractAt("Tournament", soccersm, {
    id: "SoccersmTournament",
  });

  const communityProxy = m.contractAt("Community", soccersm, {
    id: "SoccersmCommunity",
  });

  const communityViewProxy = m.contractAt("CommunityView", soccersm, {
    id: "SoccersmCommunityView",
  });

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

  return {
    soccersm,
    cutProxy,
    oProxy,
    acProxy,
    psProxy,
    registryProxy,
    poolViewProxy,
    poolHandlerProxy,
    poolDisputeProxy,
    poolManagerProxy,
    communityProxy,
    communityViewProxy,
    paymaster,
    tournamentProxy,
  };
});

export default IgniteTestModule;

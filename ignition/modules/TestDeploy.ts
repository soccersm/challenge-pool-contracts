// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import AirdropPaymasterModule from "./AirdropPaymaster";
import ChallengePoolModule from "./ChallengePool";
import DataProvidersModule from "./DataProviders";
import PoolResolversModule from "./PoolResolvers";
import SoccersmModule from "./Soccersm";
import { ethers } from "hardhat";
import {
  prepareCreateChallenge,
  coder,
  encodeMultiOptionByTopic,
} from "../../test/lib";
import {
  btcEvent,
  matchEvent,
  ethPriceRange,
  multiCorrectScore,
  multiOutcome,
  multiTotalExact,
  ghanaElectionEvent,
  soccersmEvent,
} from "../../test/mock";
import CreateTopicsModule from "./CreateTopics";

const TestDeployModule = buildModule("TestDeployModule", (m) => {
  m.useModule(SoccersmModule);
  const pool = m.useModule(ChallengePoolModule);
  m.useModule(DataProvidersModule);
  m.useModule(PoolResolversModule);
  const { paymaster } = m.useModule(AirdropPaymasterModule);
  m.useModule(CreateTopicsModule);
  const balls = "0x935E49458145B917a0EaEE279652F724EA78d8F0";
  const ballsToken = m.contractAt("BallsToken", balls);
  const minStakeAmount = BigInt(1 * 1e18);
  const oneMil = BigInt(minStakeAmount * BigInt(1e6));
  const oneGrand = BigInt(minStakeAmount * BigInt(1e3));
  m.call(pool.poolManagerProxy, "addStakeToken", [balls]);
  m.call(ballsToken, "approve", [paymaster, oneMil]);
  m.call(paymaster, "depositFor", [balls, m.getAccount(0), oneMil]);
  const btcChallenge = btcEvent(balls, 1, oneGrand, ethers.ZeroAddress);
  const preparedBTCChallenge = prepareCreateChallenge(btcChallenge.challenge);
  m.call(ballsToken, "approve", [pool.poolHandlerProxy, oneMil], {
    id: "poolHandlerProxyApprove",
  });

  m.call(pool.poolHandlerProxy, "createChallenge", preparedBTCChallenge as any);
  const matchChallenge = matchEvent(balls, 1, oneGrand, ethers.ZeroAddress);
  const preparedMatchChallenge = prepareCreateChallenge(
    matchChallenge.challenge
  );

  m.call(
    pool.poolHandlerProxy,
    "createChallenge",
    preparedMatchChallenge as any,
    { id: "matchChallenge" + "_gepoolHandlerProxyApprove" }
  );
  const ethPriceRangeChallenge = ethPriceRange(
    balls,
    1,
    oneGrand,
    ethers.ZeroAddress
  );
  const preparedETHChallenge = prepareCreateChallenge(
    ethPriceRangeChallenge.challenge
  );

  m.call(
    pool.poolHandlerProxy,
    "createChallenge",
    preparedETHChallenge as any,
    { id: "preparedETHChallenge" + "_gepoolHandlerProxyApprove" }
  );
  const multiCorrectScoreChallenge = multiCorrectScore(
    balls,
    1,
    oneGrand,
    ethers.ZeroAddress
  );
  const preparedMultiCorrectScoreChallenge = prepareCreateChallenge(
    multiCorrectScoreChallenge.challenge
  );

  m.call(
    pool.poolHandlerProxy,
    "createChallenge",
    preparedMultiCorrectScoreChallenge as any,
    { id: "preparedMultiCorrectScoreChallenge" + "_gepoolHandlerProxyApprove" }
  );
  const multiOutcomeChallenge = multiOutcome(
    balls,
    1,
    oneGrand,
    ethers.ZeroAddress
  );
  const preparedMultiOutcomeChallenge = prepareCreateChallenge(
    multiOutcomeChallenge.challenge
  );

  m.call(
    pool.poolHandlerProxy,
    "createChallenge",
    preparedMultiOutcomeChallenge as any,
    { id: "preparedMultiOutcomeChallenge" + "_gepoolHandlerProxyApprove" }
  );
  const multiTotalExactChallenge = multiTotalExact(
    balls,
    1,
    oneGrand,
    ethers.ZeroAddress
  );
  const preparedMultiTotalExactChallenge = prepareCreateChallenge(
    multiTotalExactChallenge.challenge
  );

  m.call(
    pool.poolHandlerProxy,
    "createChallenge",
    preparedMultiTotalExactChallenge as any,
    { id: "preparedMultiTotalExactChallenge" + "_gepoolHandlerProxyApprove" }
  );
  const multiTotalScoreRangeChallenge = multiTotalExact(
    balls,
    1,
    oneGrand,
    ethers.ZeroAddress
  );
  const preparedMultiTotalScoreRangeChallenge = prepareCreateChallenge(
    multiTotalScoreRangeChallenge.challenge
  );

  m.call(
    pool.poolHandlerProxy,
    "createChallenge",
    preparedMultiTotalScoreRangeChallenge as any,
    {
      id:
        "preparedMultiTotalScoreRangeChallenge" + "_gepoolHandlerProxyApprove",
    }
  );
  const gh = ghanaElectionEvent(balls, 1, oneGrand, ethers.ZeroAddress);

  m.call(pool.registryProxy, "registerEvent", [
    gh.topicId,
    coder.encode(
      ["string", "string", "uint256", "bytes[]"],
      [
        gh.statementId,
        gh.statement,
        gh.maturity,
        gh.options.map((o) => encodeMultiOptionByTopic(gh.topicId, o)),
      ]
    ),
  ]);

  const preparedMultiStementChallenge = prepareCreateChallenge(gh.challenge);

  m.call(
    pool.poolHandlerProxy,
    "createChallenge",
    preparedMultiStementChallenge as any,
    { id: "preparedMultiStementChallenge" + "_gepoolHandlerProxyApprove" }
  );
  const sc = soccersmEvent(balls, 1, oneGrand, paymaster.id);

  m.call(
    pool.registryProxy,
    "registerEvent",
    [
      sc.topicId,
      coder.encode(
        ["string", "string", "uint256", "bytes[]"],
        [
          sc.statementId,
          sc.statement,
          sc.maturity,
          sc.options.map((o) => encodeMultiOptionByTopic(sc.topicId, o)),
        ]
      ),
    ],
    { id: "preparedMultiStementChallenge_registerEvent" }
  );

  const preparedStementChallenge = prepareCreateChallenge(sc.challenge) as any;
  preparedStementChallenge[preparedStementChallenge.length - 1] = paymaster;
  m.call(pool.poolHandlerProxy, "createChallenge", preparedStementChallenge, {
    id: "preparedStementChallenge" + "_gepoolHandlerProxyApprove",
  });
  return {};
});

export default TestDeployModule;

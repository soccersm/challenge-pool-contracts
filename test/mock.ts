import { ChallengePoolDispute } from "../typechain-types";
import {
  AssetPriceBoundedEvent,
  AssetPriceTargetEvent,
  ChallengeType,
  CreateChallenge,
  EventOption,
  FootballCorrectScoreEvent,
  FootballOutcomeEvent,
  FootballOverUnderEvent,
  MultiAssetRangeEvent,
  MultiFootBallCorrectScoreEvent,
  MultiFootBallOutcomeEvent,
  MultiFootBallTotalExactEvent,
  MultiFootBallTotalScoreRangeEvent,
  StatementEvent,
  TopicId,
} from "./lib";
import { ethers } from "hardhat";

export function btcEvent(
  stakeToken: string,
  quantity: number,
  basePrice: BigInt,
  paymaster: string,
  deadline?: number,
  communityId?: string,
  challengeType?: ChallengeType
): {
  challenge: CreateChallenge;
  maturity: number;
  assetSymbol: string;
} {
  const maturity = deadline ?? Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  const assetPriceBound: AssetPriceBoundedEvent = {
    maturity,
    topicId: TopicId.AssetPriceBounded,
    outcome: "in",
    priceUpperBound: 150000,
    priceLowerBound: 120000,
    assetSymbol: "BTC",
  };

  const assetPriceTarget: AssetPriceTargetEvent = {
    maturity,
    topicId: TopicId.AssetPriceTarget,
    price: 100000,
    outcome: "above",
    assetSymbol: "BTC",
  };

  const btcChallenge: CreateChallenge = {
    events: [assetPriceBound, assetPriceTarget],
    options: [],
    stakeToken,
    prediction: "no",
    quantity,
    basePrice,
    paymaster,
    communityId: communityId ?? ethers.ZeroHash,
    challengeType: challengeType ?? ChallengeType.standard,
  };

  return {
    challenge: btcChallenge,
    maturity,
    assetSymbol: "BTC",
  };
}

export function matchEvent(
  stakeToken: string,
  quantity: number,
  basePrice: BigInt,
  paymaster: string,
  deadline?: number,
  communityId?: string,
  challengeType?: ChallengeType
): {
  challenge: CreateChallenge;
  maturity: number;
  matchId: string;
} {
  const maturity = deadline ?? Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  const footBallCorrectScore: FootballCorrectScoreEvent = {
    maturity,
    topicId: TopicId.FootBallCorrectScore,
    matchId: "abc",
    homeScore: 4,
    awayScore: 2,
  };

  const footBallOutcome: FootballOutcomeEvent = {
    maturity,
    topicId: TopicId.FootBallOutcome,
    matchId: "abc",
    outcome: "draw",
  };
  const footballOverUnder: FootballOverUnderEvent = {
    maturity,
    topicId: TopicId.FootballOverUnder,
    matchId: "abc",
    outcome: "over",
    totalGoals: 3,
  };

  const matchChallenge: CreateChallenge = {
    events: [footBallCorrectScore, footBallOutcome, footballOverUnder],
    options: [],
    stakeToken,
    prediction: "no",
    quantity,
    basePrice,
    paymaster,
    communityId: communityId ?? ethers.ZeroHash,
    challengeType: challengeType ?? ChallengeType.standard,
  };

  return {
    challenge: matchChallenge,
    maturity,
    matchId: "abc",
  };
}

export function footBallCorrectScore(
  stakeToken: string,
  quantity: number,
  basePrice: BigInt,
  paymaster: string,
  deadline?: number,
  communityId?: string,
  challengeType?: ChallengeType
): {
  challenge: CreateChallenge;
  maturity: number;
  matchId: string;
} {
  const maturity = deadline ?? Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  const footBallCorrectScore: FootballCorrectScoreEvent = {
    maturity,
    topicId: TopicId.FootBallCorrectScore,
    matchId: "def",
    homeScore: 4,
    awayScore: 2,
  };

  const matchChallenge: CreateChallenge = {
    events: [footBallCorrectScore],
    options: [],
    stakeToken,
    prediction: "yes",
    quantity,
    basePrice,
    paymaster,
    communityId: communityId ?? ethers.ZeroHash,
    challengeType: challengeType ?? ChallengeType.standard,
  };

  return {
    challenge: matchChallenge,
    maturity,
    matchId: "def",
  };
}

export function assetMatchComboEvent(
  stakeToken: string,
  quantity: number,
  basePrice: BigInt,
  paymaster: string,
  deadline?: number,
  communityId?: string,
  challengeType?: ChallengeType
): {
  challenge: CreateChallenge;
  maturity: number;
  assetSymbol: string;
  matchId: string;
} {
  const maturity = deadline ?? Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  const assetPriceBound: AssetPriceBoundedEvent = {
    maturity,
    topicId: TopicId.AssetPriceBounded,
    outcome: "in",
    priceUpperBound: 150000,
    priceLowerBound: 120000,
    assetSymbol: "BTC",
  };

  const assetPriceTarget: AssetPriceTargetEvent = {
    maturity,
    topicId: TopicId.AssetPriceTarget,
    price: 100000,
    outcome: "above",
    assetSymbol: "BTC",
  };

  const footBallCorrectScore: FootballCorrectScoreEvent = {
    maturity,
    topicId: TopicId.FootBallCorrectScore,
    matchId: "abc",
    homeScore: 4,
    awayScore: 2,
  };

  const footBallOutcome: FootballOutcomeEvent = {
    maturity,
    topicId: TopicId.FootBallOutcome,
    matchId: "abc",
    outcome: "draw",
  };
  const footballOverUnder: FootballOverUnderEvent = {
    maturity,
    topicId: TopicId.FootballOverUnder,
    matchId: "abc",
    outcome: "over",
    totalGoals: 3,
  };

  const assetMatchCombo: CreateChallenge = {
    events: [
      assetPriceBound,
      assetPriceTarget,
      footBallCorrectScore,
      footBallOutcome,
      footballOverUnder,
    ],
    options: [],
    stakeToken,
    prediction: "no",
    quantity,
    basePrice,
    paymaster,
    communityId: communityId ?? ethers.ZeroHash,
    challengeType: challengeType ?? ChallengeType.standard,
  };

  return {
    challenge: assetMatchCombo,
    maturity,
    assetSymbol: "BTC",
    matchId: "abc",
  };
}

export function ethPriceRange(
  stakeToken: string,
  quantity: number,
  basePrice: BigInt,
  paymaster: string,
  deadline?: number,
  communityId?: string,
  challengeType?: ChallengeType
): {
  challenge: CreateChallenge;
  maturity: number;
  options: EventOption[];
  assetSymbol: string;
} {
  const maturity = deadline ?? Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  const assetRange: MultiAssetRangeEvent = {
    maturity,
    topicId: TopicId.MultiAssetRange,
    assetSymbol: "ETH",
  };

  const opts: EventOption[] = [
    [2000, 3000],
    [4000, 5000],
    [6000, 7000],
  ];

  const ethPriceRangeChallenge: CreateChallenge = {
    events: [assetRange],
    options: opts,
    stakeToken,
    prediction: [6000, 7000],
    quantity,
    basePrice,
    paymaster,
    communityId: communityId ?? ethers.ZeroHash,
    challengeType: challengeType ?? ChallengeType.standard,
  };

  return {
    challenge: ethPriceRangeChallenge,
    maturity,
    options: opts,
    assetSymbol: "ETH",
  };
}

export function multiCorrectScore(
  stakeToken: string,
  quantity: number,
  basePrice: BigInt,
  paymaster: string,
  deadline?: number,
  communityId?: string,
  challengeType?: ChallengeType
): {
  challenge: CreateChallenge;
  maturity: number;
  options: EventOption[];
  matchId: string;
} {
  const maturity = deadline ?? Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  const multiFootBallCorrectScore: MultiFootBallCorrectScoreEvent = {
    maturity,
    topicId: TopicId.MultiFootBallCorrectScore,
    matchId: "xyz",
  };

  const opts: EventOption[] = [
    [1, 2],
    [3, 4],
    [5, 6],
  ];

  const multiCorrectScoreChallenge: CreateChallenge = {
    events: [multiFootBallCorrectScore],
    options: opts,
    stakeToken,
    prediction: [5, 6],
    quantity,
    basePrice,
    paymaster,
    communityId: communityId ?? ethers.ZeroHash,
    challengeType: challengeType ?? ChallengeType.standard,
  };

  return {
    challenge: multiCorrectScoreChallenge,
    maturity,
    options: opts,
    matchId: "xyz",
  };
}

export function multiOutcome(
  stakeToken: string,
  quantity: number,
  basePrice: BigInt,
  paymaster: string,
  deadline?: number,
  communityId?: string,
  challengeType?: ChallengeType
): {
  challenge: CreateChallenge;
  maturity: number;
  options: EventOption[];
  matchId: string;
} {
  const maturity = deadline ?? Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  const multiFootBallOutcome: MultiFootBallOutcomeEvent = {
    maturity,
    topicId: TopicId.MultiFootBallOutcome,
    matchId: "mno",
  };

  const opts: EventOption[] = ["home", "away", "draw"];

  const multiFootBallOutcomeChallenge: CreateChallenge = {
    events: [multiFootBallOutcome],
    options: opts,
    stakeToken,
    prediction: "away",
    quantity,
    basePrice,
    paymaster,
    communityId: communityId ?? ethers.ZeroHash,
    challengeType: challengeType ?? ChallengeType.standard,
  };

  return {
    challenge: multiFootBallOutcomeChallenge,
    maturity,
    options: opts,
    matchId: "mno",
  };
}

export function multiTotalExact(
  stakeToken: string,
  quantity: number,
  basePrice: BigInt,
  paymaster: string,
  deadline?: number,
  communityId?: string,
  challengeType?: ChallengeType
): {
  challenge: CreateChallenge;
  maturity: number;
  options: EventOption[];
  matchId: string;
} {
  const maturity = deadline ?? Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  const multiFootBallTotalExact: MultiFootBallTotalExactEvent = {
    maturity,
    topicId: TopicId.MultiFootBallTotalExact,
    matchId: "mno",
  };

  const opts: EventOption[] = [2, 5, 7];

  const multiFootBallTotalExactChallenge: CreateChallenge = {
    events: [multiFootBallTotalExact],
    options: opts,
    stakeToken,
    prediction: 5,
    quantity,
    basePrice,
    paymaster,
    communityId: communityId ?? ethers.ZeroHash,
    challengeType: challengeType ?? ChallengeType.standard,
  };

  return {
    challenge: multiFootBallTotalExactChallenge,
    maturity,
    options: opts,
    matchId: "mno",
  };
}

export function multiTotalScoreRange(
  stakeToken: string,
  quantity: number,
  basePrice: BigInt,
  paymaster: string,
  deadline?: number,
  communityId?: string,
  challengeType?: ChallengeType
): {
  challenge: CreateChallenge;
  maturity: number;
  options: EventOption[];
  matchId: string;
} {
  const maturity = deadline ?? Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  const multiFootBallTotalScoreRange: MultiFootBallTotalScoreRangeEvent = {
    maturity,
    topicId: TopicId.MultiFootBallTotalScoreRange,
    matchId: "mno",
  };

  const opts: EventOption[] = [
    [2, 4],
    [6, 8],
    [10, 15],
  ];

  const multiFootBallTotalScoreRangeChallenge: CreateChallenge = {
    events: [multiFootBallTotalScoreRange],
    options: opts,
    stakeToken,
    prediction: [2, 4],
    quantity,
    basePrice,
    paymaster,
    communityId: communityId ?? ethers.ZeroHash,
    challengeType: challengeType ?? ChallengeType.standard,
  };

  return {
    challenge: multiFootBallTotalScoreRangeChallenge,
    maturity,
    options: opts,
    matchId: "mno",
  };
}

export function ghanaElectionEvent(
  stakeToken: string,
  quantity: number,
  basePrice: BigInt,
  paymaster: string,
  communityId?: string,
  challengeType?: ChallengeType
): {
  challenge: CreateChallenge;
  statement: string;
  statementId: string;
  maturity: number;
  topicId: TopicId.Statement;
  options: EventOption[];
} {
  const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  const statement: StatementEvent = {
    maturity,
    topicId: TopicId.Statement,
    statement: "Ghana Presidential Election winner 2024.",
    statementId: "abcdefgh",
  };

  const opts: EventOption[] = ["Mahama", "Bawumia", "Cheddar"];

  const ghanaElectionsChallenge: CreateChallenge = {
    events: [statement],
    options: opts,
    stakeToken,
    prediction: "Mahama",
    quantity,
    basePrice,
    paymaster,
    communityId: communityId ?? ethers.ZeroHash,
    challengeType: challengeType ?? ChallengeType.standard,
  };

  return {
    challenge: ghanaElectionsChallenge,
    statement: statement.statement,
    statementId: statement.statementId,
    maturity,
    topicId: TopicId.Statement,
    options: opts,
  };
}

export function soccersmEvent(
  stakeToken: string,
  quantity: number,
  basePrice: BigInt,
  paymaster: string,
  communityId?: string,
  challengeType?: ChallengeType
): {
  challenge: CreateChallenge;
  statement: string;
  statementId: string;
  maturity: number;
  topicId: TopicId.Statement;
  options: EventOption[];
} {
  const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  const statement: StatementEvent = {
    maturity,
    topicId: TopicId.Statement,
    statement: "Soccresm will launch token in Q3.",
    statementId: "soccersm",
  };

  const opts: EventOption[] = [];

  const soccersmChallenge: CreateChallenge = {
    events: [statement],
    options: opts,
    stakeToken,
    prediction: "no",
    quantity,
    basePrice,
    paymaster,
    communityId: communityId ?? ethers.ZeroHash,
    challengeType: challengeType ?? ChallengeType.standard,
  };

  return {
    challenge: soccersmChallenge,
    statement: statement.statement,
    statementId: statement.statementId,
    maturity,
    topicId: TopicId.Statement,
    options: ["yes", "no"],
  };
}

export function targetEvent(
  stakeToken: string,
  quantity: number,
  basePrice: bigint,
  paymaster: string,
  deadline?: number,
  communityId?: string,
  challengeType?: ChallengeType
): {
  challenge: CreateChallenge;
  maturity: number;
  assetSymbol: string;
} {
  const maturity = deadline ?? Math.floor(Date.now() / 1_000) + 60 * 60 * 24;

  const assetPriceTarget: AssetPriceTargetEvent = {
    maturity,
    topicId: TopicId.AssetPriceTarget,
    price: 80_000,
    outcome: "above",
    assetSymbol: "BTC",
  };

  const challenge: CreateChallenge = {
    events: [assetPriceTarget],
    options: [],
    stakeToken,
    prediction: "above",
    quantity,
    basePrice,
    paymaster,
    communityId: communityId ?? ethers.ZeroHash,
    challengeType: challengeType ?? ChallengeType.standard,
  };

  return {
    challenge: challenge,
    maturity,
    assetSymbol: "BTC",
  };
}

export function footballOutcomeEvent(
  stakeToken: string,
  quantity: number,
  basePrice: bigint,
  paymaster: string,
  outcome: "draw" | "home" | "away" | "home-away" | "home-draw" | "away-draw",
  deadline?: number,
  communityId?: string,
  challengeType?: ChallengeType
): {
  challenge: CreateChallenge;
  maturity: number;
  matchId: string;
} {
  const maturity = deadline ?? Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  const footballOutcome: FootballOutcomeEvent = {
    maturity,
    topicId: TopicId.FootBallOutcome,
    matchId: "qrs",
    outcome: outcome,
  };

  const challenge: CreateChallenge = {
    events: [footballOutcome],
    options: [],
    stakeToken,
    prediction: "no",
    quantity,
    basePrice,
    paymaster,
    communityId: communityId ?? ethers.ZeroHash,
    challengeType: challengeType ?? ChallengeType.standard,
  };

  return {
    challenge: challenge,
    maturity,
    matchId: "qrs",
  };
}

export function footballOverUnderEvent(
  stakeToken: string,
  quantity: number,
  basePrice: bigint,
  paymaster: string,
  outcome: "over" | "under",
  matchId: string,
  deadline?: number,
  communityId?: string,
  challengeType?: ChallengeType
): {
  challenge: CreateChallenge;
  maturity: number;
  matchId: string;
} {
  const maturity = deadline ?? Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  const ev: FootballOverUnderEvent = {
    maturity,
    topicId: TopicId.FootballOverUnder,
    matchId: matchId,
    outcome,
    totalGoals: 4,
  };

  const challenge: CreateChallenge = {
    events: [ev],
    options: [],
    stakeToken,
    prediction: "no",
    quantity,
    basePrice,
    paymaster,
    communityId: communityId ?? ethers.ZeroHash,
    challengeType: challengeType ?? ChallengeType.standard,
  };

  return {
    challenge,
    maturity,
    matchId: matchId,
  };
}

import { ethers } from "hardhat";
import {
  AssetPriceBoundedEvent,
  AssetPriceTargetEvent,
  CreateChallenge,
  FootballCorrectScoreEvent,
  FootballOutcomeEvent,
  FootballOverUnderEvent,
  StatementEvent,
  TopicId,
  yesNo,
} from "./lib";

export function ghanaElectionEvent(
  stakeToken: string,
  quantity: number,
  basePrice: number, //
  paymaster: string
): {
  challenge: CreateChallenge;
  statement: string;
  statementId: string;
  maturity: number;
  topicId: TopicId.Statement;
} {
  const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  const statement: StatementEvent = {
    maturity,
    topicId: TopicId.Statement,
    statement: "Ghana Presidential Election winner 2024.",
    statementId: "abcdefgh",
  };

  const ghanaElectionsChallenge: CreateChallenge = {
    events: [statement],
    options: ["Mahama", "Bawumia", "Cheddar"],
    stakeToken,
    prediction: "Mahama",
    quantity,
    basePrice: ethers.parseEther(basePrice.toString()),
    paymaster,
  };

  return {
    challenge: ghanaElectionsChallenge,
    statement: statement.statement,
    statementId: statement.statementId,
    maturity,
    topicId: TopicId.Statement,
  };
}

export function btcEvent(
  stakeToken: string,
  quantity: number,
  basePrice: number, //
  paymaster: string
): {
  challenge: CreateChallenge;
  maturity: number;
} {
  const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

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
    prediction: "yes",
    quantity,
    basePrice: ethers.parseEther(basePrice.toString()),
    paymaster,
  };

  return {
    challenge: btcChallenge,
    maturity,
  };
}

export function matchEvent(
  stakeToken: string,
  quantity: number,
  basePrice: number, //
  paymaster: string,
  deadline?: number
): {
  challenge: CreateChallenge;
  maturity: number;
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
    prediction: "yes",
    quantity,
    basePrice: ethers.parseEther(basePrice.toString()),
    paymaster,
  };

  return {
    challenge: matchChallenge,
    maturity,
  };
}

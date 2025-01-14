import { ethers } from "hardhat";
import { AssetPriceBoundedEvent, AssetPriceTargetEvent, CreateChallenge, StatementEvent, TopicId, yesNo } from "./lib";

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
  topicId: TopicId.Statement;
} {
  const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  const assetPriceBound: AssetPriceBoundedEvent = {
    maturity,
    topicId: TopicId.AssetPriceBounded,
    outcome: "in",
    priceUpperBound: 150000,
    priceLowerBound: 120000,
    assetSymbol: "BTC"
  };

  const assetPriceTarget: AssetPriceTargetEvent = {
    maturity,
    topicId: TopicId.AssetPriceBounded,
    price: 100000,
    outcome: "above",
    assetSymbol: "BTC"
  };

  const ghanaElectionsChallenge: CreateChallenge = {
    events: [assetPriceBound, assetPriceTarget],
    options: [],
    stakeToken,
    prediction: "yes",
    quantity,
    basePrice: ethers.parseEther(basePrice.toString()),
    paymaster,
  };

  return {
    challenge: ghanaElectionsChallenge,
    maturity,
    topicId: TopicId.Statement,
  };
}
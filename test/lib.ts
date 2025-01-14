import { ethers } from "hardhat";

export enum TopicId {
  AssetPriceBounded = "AssetPriceBounded",
  AssetPriceTarget = "AssetPriceTarget",
  MultiAssetRange = "MultiAssetRange",
  FootBallCorrectScore = "FootBallCorrectScore",
  FootBallOutcome = "FootBallOutcome",
  FootballOverUnder = "FootballOverUnder",
  MultiFootBallCorrectScore = "MultiFootBallCorrectScore",
  MultiFootBallOutcome = "MultiFootBallOutcome",
  MultiFootBallTotalExact = "MultiFootBallTotalExact",
  MultiFootBallTotalScoreRange = "MultiFootBallTotalScoreRange",
  Statement = "Statement",
}

export type BaseEvent = {
  maturity: number; // timestamp in seconds at which this event is supposed to be evaluated, maximum 3 months into the future
  topicId: TopicId; // Id of event topic since every event has a topic
};
export type AssetPriceBoundedEvent = BaseEvent & {
  assetSymbol: string;
  priceLowerBound: number;
  priceUpperBound: number;
  outcome: "in" | "out";
};
export type AssetPriceTargetEvent = BaseEvent & {
  assetSymbol: string;
  price: number;
  outcome: "above" | "below";
};
// For football events maturity is determined automatically by the smart contract
export type FootballOutcomeEvent = BaseEvent & {
  matchId: string;
  outcome: "home" | "away" | "draw" | "home-away" | "home-draw" | "away-draw";
};
export type FootballCorrectScoreEvent = BaseEvent & {
  matchId: string;
  homeScore: number;
  awayScore: number;
};
export type FootballOverUnderEvent = BaseEvent & {
  matchId: string;
  totalGoals: number;
  outcome: "over" | "under";
};
export type StatementEvent = BaseEvent & {
  statementId: string;
  statement: string;
};

export type MultiAssetRangeEvent = BaseEvent & {
  assetSymbol: string;
};

export type MultiFootBall = BaseEvent & {
  matchId: string;
};

export type MultiFootBallTotalScoreRangeEvent = MultiFootBall;

export type MultiFootBallTotalExactEvent = MultiFootBall;
export type MultiFootBallOutcomeEvent = MultiFootBall;
export type MultiFootBallCorrectScoreEvent = MultiFootBall;

export type EventParam =
  | AssetPriceTargetEvent
  | AssetPriceBoundedEvent
  | FootballOutcomeEvent
  | FootballCorrectScoreEvent
  | FootballOverUnderEvent
  | StatementEvent
  | MultiAssetRangeEvent
  | MultiFootBallTotalScoreRangeEvent
  | MultiFootBallTotalExactEvent
  | MultiFootBallOutcomeEvent
  | MultiFootBallCorrectScoreEvent;

export type StringOption = string;
export type IntOption = number;
export type RangeOption = [number, number];

export type EventOption = StringOption | IntOption | RangeOption;

export type EventChallenge = {
  params: string;
  topicId: TopicId;
  maturity: BigInt;
};

export type YesNo = "yes" | "no";

export type CreateChallenge = {
  events: EventChallenge[];
  options: EventOption[];
  stakeToken: string;
  prediction: string | YesNo;
  quantity: number;
  basePrice: number;
  paymaster: string;
};

export type PrepareCreateChallenge = [
  string[],
  string[],
  string,
  string,
  BigInt,
  BigInt,
  string
];
const coder = new ethers.AbiCoder();

export const yesNo = {
  yes: coder.encode(["string"], ["yes"]),
  no: coder.encode(["string"], ["no"]),
};

export function prepareCreateChallenge(
  create: CreateChallenge
): PrepareCreateChallenge {
  let isMulti = create.options.length > 0;
  const events = [];
  let options: string[] = [];
  let prediction = "";
  for (const e of create.events) {
    events.push(encodeEventByTopic(e));
  }
  if (isMulti) {
    const topicId = create.events[0].topicId;
    prediction = encodeMultiOptionByTopic(topicId, create.prediction);
    options = create.options.map((o) => encodeMultiOptionByTopic(topicId, o));
  } else {
    prediction = yesNo[create.prediction as YesNo];
  }
  return [
    events,
    options,
    create.stakeToken,
    prediction,
    BigInt(create.quantity),
    BigInt(create.basePrice),
    create.paymaster,
  ];
}

export function encodeMultiOptionByTopic(
  topicId: TopicId,
  option: EventOption
): string {
  switch (topicId) {
    case TopicId.MultiFootBallCorrectScore:
      return coder.encode(["uint256", "uint256"], option as RangeOption);
    case TopicId.MultiFootBallOutcome:
      return coder.encode(["string"], [option as StringOption]);
    case TopicId.MultiFootBallTotalExact:
      return coder.encode(["uint256"], [option as IntOption]);
    case TopicId.MultiFootBallTotalScoreRange:
      return coder.encode(["uint256", "uint256"], option as RangeOption);
    case TopicId.Statement:
      return coder.encode(["string"], [option as StringOption]);
    case TopicId.MultiAssetRange:
      return coder.encode(["uint256", "uint256"], option as RangeOption);
    case TopicId.AssetPriceBounded:
    case TopicId.AssetPriceTarget:
    case TopicId.FootBallCorrectScore:
    case TopicId.FootBallOutcome:
    case TopicId.FootballOverUnder:
    default:
      throw new Error("Invalid Event Topic, must be a multi event");
  }
}

export function encodeEventByTopic(e: EventChallenge): string {
  switch (e.topicId) {
    case TopicId.AssetPriceBounded:
      return prepareAssetPriceBoundedEvent(e as any as AssetPriceBoundedEvent);
    case TopicId.AssetPriceTarget:
      return prepareAssetPriceTargetEvent(e as any as AssetPriceTargetEvent);
    case TopicId.FootBallCorrectScore:
      return prepareFootballCorrectScoreEvent(
        e as any as FootballCorrectScoreEvent
      );
    case TopicId.FootBallOutcome:
      return prepareFootballOutcomeEvent(e as any as FootballOutcomeEvent);
    case TopicId.FootballOverUnder:
      return prepareFootballOverUnderEvent(e as any as FootballOverUnderEvent);
    case TopicId.Statement:
      return prepareStatementEvent(e as any as StatementEvent);
    case TopicId.MultiFootBallCorrectScore:
      return prepareMultiFootBallCorrectScoreEvent(
        e as any as MultiFootBallCorrectScoreEvent
      );
    case TopicId.MultiFootBallOutcome:
      return prepareMultiFootBallOutcomeEvent(
        e as any as MultiFootBallOutcomeEvent
      );
    case TopicId.MultiFootBallTotalExact:
      return prepareMultiFootBallTotalExactEvent(
        e as any as MultiFootBallTotalExactEvent
      );
    case TopicId.MultiFootBallTotalScoreRange:
      return prepareMultiFootBallTotalScoreRangeEvent(
        e as any as MultiFootBallTotalScoreRangeEvent
      );
    case TopicId.MultiAssetRange:
      return prepareMultiAssetRangeEvent(e as any as MultiAssetRangeEvent);
    default:
      throw new Error("Invalid Event Topic", e.topicId);
  }
}

export function encodeEvent(event: EventChallenge): string {
  return coder.encode(
    ["tuple(bytes params, string topicId, uint256 maturity)"],
    [event]
  );
}

export function prepareAssetPriceBoundedEvent(
  ev: AssetPriceBoundedEvent
): string {
  const params = coder.encode(
    ["string", "uint256", "uint256", "string"],
    [ev.assetSymbol, ev.priceLowerBound, ev.priceUpperBound, ev.outcome]
  );
  return encodeEvent({
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  });
}

export function prepareAssetPriceTargetEvent(
  ev: AssetPriceTargetEvent
): string {
  const params = coder.encode(
    ["string", "uint256", "string"],
    [ev.assetSymbol, ev.price, ev.outcome]
  );
  return encodeEvent({
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  });
}

export function prepareFootballCorrectScoreEvent(
  ev: FootballCorrectScoreEvent
): string {
  const params = coder.encode(
    ["string", "uint256", "uint256"],
    [ev.matchId, ev.homeScore, ev.awayScore]
  );
  return encodeEvent({
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  });
}

export function prepareFootballOutcomeEvent(ev: FootballOutcomeEvent): string {
  const params = coder.encode(["string", "string"], [ev.matchId, ev.outcome]);
  return encodeEvent({
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  });
}

export function prepareFootballOverUnderEvent(
  ev: FootballOverUnderEvent
): string {
  const params = coder.encode(
    ["string", "uint256", "string"],
    [ev.matchId, ev.totalGoals, ev.outcome]
  );
  return encodeEvent({
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  });
}

export function prepareStatementEvent(ev: StatementEvent): string {
  const params = coder.encode(["string"], [ev.statementId]);
  return encodeEvent({
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  });
}

export function prepareMultiAssetRangeEvent(ev: MultiAssetRangeEvent): string {
  const params = coder.encode(["string"], [ev.assetSymbol]);
  return encodeEvent({
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  });
}

export function prepareMultiFootBallCorrectScoreEvent(
  ev: MultiFootBallCorrectScoreEvent
): string {
  const params = coder.encode(["string"], [ev.matchId]);
  return encodeEvent({
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  });
}

export function prepareMultiFootBallOutcomeEvent(
  ev: MultiFootBallOutcomeEvent
): string {
  const params = coder.encode(["string"], [ev.matchId]);
  return encodeEvent({
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  });
}

export function prepareMultiFootBallTotalExactEvent(
  ev: MultiFootBallTotalExactEvent
): string {
  const params = coder.encode(["string"], [ev.matchId]);
  return encodeEvent({
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  });
}

export function prepareMultiFootBallTotalScoreRangeEvent(
  ev: MultiFootBallTotalScoreRangeEvent
): string {
  const params = coder.encode(["string"], [ev.matchId]);
  return encodeEvent({
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  });
}

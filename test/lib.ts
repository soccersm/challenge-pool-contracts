import { ethers } from "hardhat";

export enum TopicId {
  AssetPriceBounded = "AssetPriceBounded",
  AssetPriceTarget = "AssetPriceTarget",
  FootBallCorrectScore = "FootBallCorrectScore",
  FootBallOutcome = "FootBallOutcome",
  FootballOverUnder = "FootballOverUnder",
  MultiAssetRange = "MultiAssetRange",
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

export type EventChallenge = EventParam;

export type ParamEncodedEventChallenge = {
  params: string;
  topicId: TopicId;
  maturity: BigInt;
};

export type YesNo = "yes" | "no";
export type AboveBelow = "above" | "below";

export type CreateChallenge = {
  events: EventChallenge[];
  options: EventOption[];
  stakeToken: string;
  prediction: EventOption | YesNo;
  quantity: number;
  basePrice: BigInt;
  paymaster: string;
  communityId: string;
  challengeType: ChallengeType;
};

export enum ChallengeType {
  standard,
  custom,
}
export enum ChallengeState {
  open,
  closed,
  cancelled,
  matured,
  evaluated,
  settled,
  disputed,
}
export type PrepareCreateChallenge = [
  ParamEncodedEventChallenge[],
  string[],
  string,
  string,
  BigInt,
  BigInt,
  string,
  string,
  ChallengeType
];
export const coder = new ethers.AbiCoder();

export const yesNo = {
  yes: coder.encode(["string"], ["yes"]),
  no: coder.encode(["string"], ["no"]),
};

export const aboveBelow = {
  above: coder.encode(["string"], ["above"]),
  below: coder.encode(["string"], ["below"]),
};

export const ASSET_PRICES_MULTIPLIER = 100; // multiply all prices by 100

export function prepareCreateChallenge(
  create: CreateChallenge
): PrepareCreateChallenge {
  let isMulti = create.options.length > 0;
  const events = [];
  let options: string[] = [];
  let prediction = "";
  for (let e of create.events) {
    events.push(encodeEventByTopic(e));
  }
  if (isMulti) {
    const topicId = create.events[0].topicId;
    prediction = encodeMultiOptionByTopic(topicId, create.prediction);
    options = create.options.map((o) => encodeMultiOptionByTopic(topicId, o));
  } else if (
    create.events.length === 1 &&
    create.events[0].topicId === TopicId.AssetPriceTarget
  ) {
    prediction = create.prediction === "above" ? yesNo.yes : yesNo.no;
  } else {
    prediction = yesNo[create.prediction as YesNo];
  }
  console.log('options',options);
  
  return [
    events,
    options,
    create.stakeToken,
    prediction,
    BigInt(create.quantity),
    create.basePrice,
    create.paymaster,
    create.communityId,
    create.challengeType,
  ];
}

export function encodeMultiOptionByTopic(
  topicId: TopicId,
  option: EventOption
): string {
  switch (topicId) {
    case TopicId.MultiFootBallCorrectScore:
      const correctScore = option as RangeOption;
      return coder.encode(
        ["uint256", "uint256"],
        [BigInt(correctScore[0]), BigInt(correctScore[1])]
      );
    case TopicId.MultiFootBallOutcome:
      return coder.encode(["string"], [option as StringOption]);
    case TopicId.MultiFootBallTotalExact:
      return coder.encode(["uint256"], [BigInt(option as IntOption)]);
    case TopicId.MultiFootBallTotalScoreRange:
      const scoreRange = option as RangeOption;
      return coder.encode(
        ["uint256", "uint256"],
        [BigInt(scoreRange[0]), BigInt(scoreRange[1])]
      );
    case TopicId.Statement:
      return coder.encode(["string"], [option as StringOption]);
    case TopicId.MultiAssetRange:
      const priceRage = option as RangeOption;
      return coder.encode(
        ["uint256", "uint256"],
        [
          BigInt(priceRage[0] * ASSET_PRICES_MULTIPLIER),
          BigInt(priceRage[1] * ASSET_PRICES_MULTIPLIER),
        ]
      );
    case TopicId.AssetPriceBounded:
    case TopicId.AssetPriceTarget:
    case TopicId.FootBallCorrectScore:
    case TopicId.FootBallOutcome:
      // return coder.encode(["string"], [option as StringOption]);
    case TopicId.FootballOverUnder:
    default:
      throw new Error("Invalid Event Topic, must be a multi event");
  }
}

export function encodeEventByTopic(e: EventParam): ParamEncodedEventChallenge {
  switch (e.topicId) {
    case TopicId.AssetPriceBounded:
      return prepareAssetPriceBoundedEventParam(e as AssetPriceBoundedEvent);
    case TopicId.AssetPriceTarget:
      return prepareAssetPriceTargetEventParam(e as AssetPriceTargetEvent);
    case TopicId.FootBallCorrectScore:
      return prepareFootballCorrectScoreEventParam(
        e as FootballCorrectScoreEvent
      );
    case TopicId.FootBallOutcome:
      return prepareFootballOutcomeEventParam(e as FootballOutcomeEvent);
    case TopicId.FootballOverUnder:
      return prepareFootballOverUnderEventParam(e as FootballOverUnderEvent);
    case TopicId.Statement:
      return prepareStatementEventParam(e as StatementEvent);
    case TopicId.MultiFootBallCorrectScore:
      return prepareMultiFootBallCorrectScoreEventParam(
        e as MultiFootBallCorrectScoreEvent
      );
    case TopicId.MultiFootBallOutcome:
      return prepareMultiFootBallOutcomeEventParam(
        e as MultiFootBallOutcomeEvent
      );
    case TopicId.MultiFootBallTotalExact:
      return prepareMultiFootBallTotalExactEventParam(
        e as MultiFootBallTotalExactEvent
      );
    case TopicId.MultiFootBallTotalScoreRange:
      return prepareMultiFootBallTotalScoreRangeEventParam(
        e as MultiFootBallTotalScoreRangeEvent
      );
    case TopicId.MultiAssetRange:
      return prepareMultiAssetRangeEventParam(e as MultiAssetRangeEvent);
    default:
      throw new Error("Invalid Event Topic", e.topicId);
  }
}

export function encodeEventList(events: ParamEncodedEventChallenge[]): string {
  return coder.encode(
    ["tuple(bytes,string,uint256)[]"],
    [
      events.map((event) => [
        event.params,
        event.topicId.toString(),
        event.maturity,
      ]),
    ]
  );
}

export function prepareFootballOutcomeEventParam(
  ev: FootballOutcomeEvent
): ParamEncodedEventChallenge {
  const params = coder.encode(["string", "string"], [ev.matchId, ev.outcome]);
  return {
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  };
}

export function prepareFootballOverUnderEventParam(
  ev: FootballOverUnderEvent
): ParamEncodedEventChallenge {
  const params = coder.encode(
    ["string", "uint256", "string"],
    [ev.matchId, BigInt(ev.totalGoals), ev.outcome]
  );
  return {
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  };
}

export function prepareStatementEventParam(
  ev: StatementEvent
): ParamEncodedEventChallenge {
  const params = coder.encode(
    ["string", "string", "uint256"],
    [ev.statementId, ev.statement, BigInt(ev.maturity)]
  );
  return {
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  };
}

export function prepareMultiAssetRangeEventParam(
  ev: MultiAssetRangeEvent
): ParamEncodedEventChallenge {
  const params = coder.encode(["string"], [ev.assetSymbol]);
  return {
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  };
}

export function prepareMultiFootBallCorrectScoreEventParam(
  ev: MultiFootBallCorrectScoreEvent
): ParamEncodedEventChallenge {
  const params = coder.encode(["string"], [ev.matchId]);
  return {
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  };
}

export function prepareMultiFootBallOutcomeEventParam(
  ev: MultiFootBallOutcomeEvent
): ParamEncodedEventChallenge {
  const params = coder.encode(["string"], [ev.matchId]);
  return {
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  };
}

export function prepareMultiFootBallTotalExactEventParam(
  ev: MultiFootBallTotalExactEvent
): ParamEncodedEventChallenge {
  const params = coder.encode(["string"], [ev.matchId]);
  return {
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  };
}

export function prepareMultiFootBallTotalScoreRangeEventParam(
  ev: MultiFootBallTotalScoreRangeEvent
): ParamEncodedEventChallenge {
  const params = coder.encode(["string"], [ev.matchId]);
  return {
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  };
}

export function prepareAssetPriceBoundedEventParam(
  ev: AssetPriceBoundedEvent
): ParamEncodedEventChallenge {
  const params = coder.encode(
    ["string", "uint256", "uint256", "string"],
    [
      ev.assetSymbol,
      BigInt(ev.priceLowerBound * ASSET_PRICES_MULTIPLIER),
      BigInt(ev.priceUpperBound * ASSET_PRICES_MULTIPLIER),
      ev.outcome,
    ]
  );
  return {
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  };
}

export function prepareAssetPriceTargetEventParam(
  ev: AssetPriceTargetEvent
): ParamEncodedEventChallenge {
  const params = coder.encode(
    ["string", "uint256", "string"],
    [ev.assetSymbol, BigInt(ev.price * ASSET_PRICES_MULTIPLIER), ev.outcome]
  );
  return {
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  };
}

export function prepareAssetPriceTargetProvision(
  assetSymbol: string,
  maturity: number,
  price: number
): [string, string] {
  const params = coder.encode(
    ["string", "uint256", "uint256"],
    [assetSymbol, BigInt(maturity), BigInt(price)]
  );
  return ["AssetPriceTarget", params];
}

export function prepareFootballCorrectScoreEventParam(
  ev: FootballCorrectScoreEvent
): ParamEncodedEventChallenge {
  const params = coder.encode(
    ["string", "uint256", "uint256"],
    [ev.matchId, BigInt(ev.homeScore), BigInt(ev.awayScore)]
  );
  return {
    params,
    topicId: ev.topicId,
    maturity: BigInt(ev.maturity),
  };
}

export function prepareFootballScoreProvision(
  matchId: string,
  homeScore: number,
  awayScore: number
): [string, string] {
  const footballParams = coder.encode(
    ["string", "uint256", "uint256"],
    [matchId, BigInt(homeScore), BigInt(awayScore)]
  );
  return ["FootBallCorrectScore", footballParams];
}

export function prepareFootballOutcomeProvision(
  matchId: string,
  homeScore: number,
  awayScore: number
): [string, string] {
  const params = coder.encode(
    ["string", "uint256", "uint256"],
    [matchId, BigInt(homeScore), BigInt(awayScore)]
  );
  return ["FootBallOutcome", params];
}

export function prepareMultiFootballScoreRangeProvision(
  matchId: string,
  homeScore: number,
  awayScore: number
): [string, string] {
  const params = coder.encode(
    ["string", "uint256", "uint256"],
    [matchId, homeScore, awayScore]
  );

  return ["MultiFootBallTotalScoreRange", params];
}

export function prepareAssetPriceProvision(
  assetSymbol: string,
  maturity: number,
  price: number
): [string, string] {
  const assetParams = coder.encode(
    ["string", "uint256", "uint256"],
    [assetSymbol, BigInt(maturity), BigInt(price)]
  );
  return ["AssetPriceBounded", assetParams];
}

export function prepareStatementProvision(
  statementId: string,
  statement: string,
  maturity: number,
  answer: string
): [string, string] {
  const statementParams = coder.encode(
    ["string", "string", "uint256", "bytes"],
    [statementId, statement, BigInt(maturity), answer]
  );
  return ["Statement", statementParams];
}

export function prepareFootballOverUnderProvision(
  matchId: string,
  homeScore: number,
  awayScore: number
): [string, string] {
  const params = coder.encode(
    ["string", "uint256", "uint256"],
    [matchId, BigInt(homeScore), BigInt(awayScore)]
  );
  return ["FootballOverUnder", params];
}

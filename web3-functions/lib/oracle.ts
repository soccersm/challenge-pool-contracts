import ky from "ky";
import { AbiCoder } from "ethers";
import { FootballRequests, AssetRequests, CallParams } from "./types";
import * as TopicRegistry from "./abis/TopicRegistry.json";
import { getAssetPriceAt, getMatchesScore } from "./sources";

const PROVIDE_DATA_METHOD = "provideData(string,bytes)";
const coder = new AbiCoder();

export function isNumeric(str: string) {
  if (typeof str != "string") return false; // we only process strings!
  return !isNaN(parseFloat(str)); // ...and ensure strings of whitespace fail
}

export async function getAssetRequests(
  oracelApi: string
): Promise<AssetRequests[]> {
  const assetRequests = await ky
    .get(`${oracelApi}/oracle/assets?matured=yes&provided=no`, {
      timeout: 5_000,
      retry: 0,
    })
    .json();
  return assetRequests as AssetRequests[];
}

export async function getFootballRequests(
  oracelApi: string
): Promise<FootballRequests[]> {
  const footballRequests = await ky
    .get(`${oracelApi}/oracle/football?matured=yes&provided=no`, {
      timeout: 5_000,
      retry: 0,
    })
    .json();
  return footballRequests as FootballRequests[];
}

export async function prepareAssetParams(
  contract: string,
  requests: AssetRequests[],
  dataUrl: string,
  apiKey: string
): Promise<CallParams[]> {
  const call: CallParams[] = [];
  for (const r of requests) {
    const price = await getAssetPriceAt(
      dataUrl,
      apiKey,
      r.asset_symbol,
      parseInt(r.maturity)
    );
    if (!price) {
      continue;
    }
    const assetParams = coder.encode(
      ["string", "uint256", "uint256"],
      [r.asset_symbol, parseInt(r.maturity), price]
    );
    const params = ["AssetPriceBounded", assetParams];

    call.push({
      target: contract,
      abi: TopicRegistry,
      method: PROVIDE_DATA_METHOD,
      params,
    });
  }
  return call;
}

export async function prepareFootballParams(
  contract: string,
  requests: FootballRequests[],
  dataUrl: string
): Promise<CallParams[]> {
  const call: CallParams[] = [];
  const matchIds: number[] = [];
  for (const r of requests) {
    if (isNumeric(r.match_id)) {
      matchIds.push(parseInt(r.match_id));
    }
  }
  const scorelines = await getMatchesScore(dataUrl, matchIds);
  for (const s of scorelines) {
    const footballParams = coder.encode(
      ["string", "uint256", "uint256"],
      [s.matchId.toString(), s.homeScore, s.awayScore]
    );
    const params = ["FootBallCorrectScore", footballParams];
    call.push({
      target: contract,
      abi: TopicRegistry,
      method: PROVIDE_DATA_METHOD,
      params,
    });
  }
  return call;
}

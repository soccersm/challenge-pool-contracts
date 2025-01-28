import ky from "ky";
import { AbiCoder } from "ethers";
import { FootballRequests, AssetRequests, CallParams } from "./types";
import * as TopicRegistry from "./abis/TopicRegistry.json";
import { getAssetPriceAt, getMatchesScore } from "./sources";

const PROVIDE_DATA_METHOD = "provideData(string,bytes)";

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
  const coder = new AbiCoder();
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
  dataUrl: string,
  apiKey: string
): Promise<CallParams[]> {
  const call: CallParams[] = [];
  const matchIds: number[] = [];
  for (const r of requests) {
  }
  const scorelines = await getMatchesScore(dataUrl, matchIds);
  for (const s of scorelines) {
    const params = ["FootBallCorrectScore"];
    call.push({
      target: contract,
      abi: TopicRegistry,
      method: PROVIDE_DATA_METHOD,
      params,
    });
  }
  return call;
}

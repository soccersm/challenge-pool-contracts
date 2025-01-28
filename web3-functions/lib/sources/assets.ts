import ky from "ky";
import { CCDATAResp } from "../types";

export const ASSET_PRICES_MULTIPLIER = 100; // multiply all prices by 100

export async function getAssetPriceAt(
  dataUrl: string,
  apiKey: string,
  assetSymbol: string,
  date: number
): Promise<number | undefined> {
  const hourUrl = `${dataUrl}/data/v2/histohour?fsym=${assetSymbol}&tsym=USD&limit=1&toTs=${date}&api_key=${apiKey}`;
  const minuteUrl = `${dataUrl}/data/v2/histominute?fsym=${assetSymbol}&tsym=USD&limit=1&toTs=${date}&api_key=${apiKey}`;
  const now = Math.floor(Date.now() / 1000);
  const sixDaysAgo = now - 60 * 60 * 24 * 6;
  const url = date >= sixDaysAgo ? minuteUrl : hourUrl;
  const resp = await ky.get(url).json();
  if (!resp) {
    return;
  }
  const data = resp as CCDATAResp;
  if (data.Response != "Success") {
    return;
  }
  if (!data.Data) {
    return;
  }
  if (!data.Data.TimeFrom) {
    return;
  }
  if (!data.Data.TimeTo) {
    return;
  }
  if (!data.Data.Data) {
    return;
  }
  const timeFromDiff = Math.abs(date - data.Data.TimeFrom);
  const timeToDiff = Math.abs(date - data.Data.TimeTo);
  let timeToUse = data.Data.TimeFrom;
  if (timeFromDiff > timeToDiff) {
    timeToUse = data.Data.TimeTo;
  }

  for (const ohlcv of data.Data.Data) {
    if (ohlcv.time == timeToUse) {
      return Math.round(ohlcv.close * ASSET_PRICES_MULTIPLIER);
    }
  }

  return;
}

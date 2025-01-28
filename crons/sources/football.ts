import ky from "ky";
import { MatchScoreLine } from "../types";

export async function getMatchesScore(
  dataUrl: string,
  matchIds: number[]
): Promise<MatchScoreLine[]> {
  const url = `${dataUrl}/matches/scores?matchIds=${matchIds.join(",")}`;

  const resp = await ky
    .get(url, {
      timeout: 5_000,
      retry: 0,
    })
    .json();
  if (resp) {
    return resp as MatchScoreLine[];
  }
  return [];
}

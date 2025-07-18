export async function getChallenge(poolViewProxy: any, challengeId: number) {
  const [
    state,
    multi,
    outcome,
    createdAt,
    maturity,
    basePrice,
    stakeToken,
    events,
    options,
    disputed,
    lastOutcomeSet,
    communityId,
    challengeType,
  ] = await poolViewProxy.challenges(BigInt(challengeId));
  return {
    state,
    multi,
    outcome,
    createdAt,
    maturity,
    basePrice,
    stakeToken,
    events,
    options,
    disputed,
    lastOutcomeSet,
    communityId,
    challengeType
  };
}

export async function getPlayerOptionSupply(
  poolViewProxy: any,
  challengeId: number,
  player: string,
  option: string
) {
  const [withdraw, stakes, tokens, rewards] =
    await poolViewProxy.playerOptionSupply(BigInt(challengeId), player, option);
  return {
    withdraw,
    stakes,
    tokens,
    rewards,
  };
}

export async function getPlayerSupply(
  poolViewProxy: any,
  challengeId: number,
  player: string
) {
  const [withdraw, stakes, tokens, rewards] = await poolViewProxy.playerSupply(
    BigInt(challengeId),
    player
  );
  return {
    withdraw,
    stakes,
    tokens,
    rewards,
  };
}

export async function getOptionSupply(
  poolViewProxy: any,
  challengeId: number,
  option: string
) {
  const [exists, stakes, tokens, rewards] = await poolViewProxy.optionSupply(
    BigInt(challengeId),
    option
  );
  return {
    exists,
    stakes,
    tokens,
    rewards,
  };
}

export async function getPoolSupply(poolViewProxy: any, challengeId: number) {
  const [stakes, tokens] = await poolViewProxy.poolSupply(BigInt(challengeId));
  return {
    stakes,
    tokens,
  };
}

export async function getPlayerDisputes(
  poolViewProxy: any,
  challengeId: number,
  player: string
) {
  const [dispute, stakes, released] = await poolViewProxy.playerDisputes(
    BigInt(challengeId),
    player
  );
  return {
    dispute,
    stakes,
    released,
  };
}

export async function getOptionDisputes(
  poolViewProxy: any,
  challengeId: number,
  option: string
) {
  const dispute = await poolViewProxy.optionDisputes(
    BigInt(challengeId),
    option
  );
  return dispute;
}

export async function getPoolDisputes(poolViewProxy: any, challengeId: number) {
  const dispute = await poolViewProxy.poolDisputes(BigInt(challengeId));
  return dispute;
}

export async function  getChallengeState(
  poolViewProxy: any,
  challengeId: number,
  player: string,
  option: string
) {
  const challenge = await getChallenge(poolViewProxy, challengeId);
  const playerOptionSupply = await getPlayerOptionSupply(
    poolViewProxy,
    challengeId,
    player,
    option
  );
  const playerSupply = await getPlayerSupply(
    poolViewProxy,
    challengeId,
    player
  );
  const optionSupply = await getOptionSupply(
    poolViewProxy,
    challengeId,
    option
  );
  const poolSupply = await getPoolSupply(poolViewProxy, challengeId);
  const playerDispute = await getPlayerDisputes(
    poolViewProxy,
    challengeId,
    player
  );
  const optionDispute = await getOptionDisputes(
    poolViewProxy,
    challengeId,
    option
  );
  const poolDispute = await getPoolDisputes(poolViewProxy, challengeId);
  return {
    challenge,
    playerOptionSupply,
    playerSupply,
    optionSupply,
    poolSupply,
    playerDispute,
    optionDispute,
    poolDispute,
  };
}

export function computeWinnerShare(
  winningOptionRewards: any,
  winningOptionTokens: any,
  totalPoolTokens: any,
  winnerRewards: any,
  cancelled = false
): BigInt {
  if (cancelled) return BigInt(0);
  if (winningOptionRewards == 0) return BigInt(0);
  const totalLoosersTokens: any = totalPoolTokens - winningOptionTokens;
  const tokensPerReward: any = totalLoosersTokens / winningOptionRewards;
  return (winnerRewards * tokensPerReward) as any as BigInt;
}

export enum TopicState {
  disabled = 0,
  active = 1,
}
export async function getChallengeState(
  poolViewProxy: any,
  challengeId: number
) {
  const [
    state,
    multi,
    outcome,
    createdAt,
    maturity,
    basePrice,
    stakeToken,
    events,
    disputed,
    lastOutcomeSet,
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
    disputed,
    lastOutcomeSet,
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

import "dotenv/config";
import {
  callContractEOA,
  callContractEthers,
  getReadyChallenges,
  prepareReadyChallengeParams,
} from ".";

(async () => {
  const readyChallenges = await getReadyChallenges(process.env.BALLS_API!);
  console.log(`${readyChallenges.length} Challenges Ready ...`);

  const readyChallengesParams = await prepareReadyChallengeParams(
    process.env.SOCCERSM_CONTRACT!,
    readyChallenges
  );

  console.log(
    `${readyChallengesParams.length} Challenges Prepared for Evaluation and Closing ...`
  );
  console.log(readyChallengesParams);
  

  await callContractEthers(
    parseInt(process.env.FUNCTIONS_CHAIN_ID!),
    process.env.FUNCTIONS_RPC!,
    process.env.POOL_EVAL_CLOSE_KEY!,
    readyChallengesParams
  );
})();

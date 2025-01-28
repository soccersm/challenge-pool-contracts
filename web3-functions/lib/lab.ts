import "dotenv/config";
import { callContract, getAssetRequests, prepareAssetParams } from ".";

(async () => {
  const assets = await getAssetRequests(process.env.BALLS_API!);
  //   const matches = await getFootballRequests(process.env.BALLS_API!);
  const assetParams = await prepareAssetParams(
    process.env.SOCCERSM_CONTRACT!,
    assets,
    process.env.CCDATA_URL!,
    process.env.CCDATA_API_KEY!
  );

  const transaction = await callContract(
    parseInt(process.env.FUNCTIONS_CHAIN_ID!),
    process.env.FUNCTIONS_RPC!,
    process.env.THIRDWEB_SECRET_KEY!,
    process.env.ORACLE_ROLE_KEY!,
    assetParams
  );

  console.log(transaction);
})();

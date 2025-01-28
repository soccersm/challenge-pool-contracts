import {
  createThirdwebClient,
  sendBatchTransaction,
  prepareContractCall,
  PreparedTransaction,
  getContract,
} from "thirdweb";
import { privateKeyAccount, smartWallet } from "thirdweb/wallets";
import { CallParams } from "./types";

export async function getAccount(
  chainId: number,
  rpc: string,
  thirdweb: string,
  privateKey: string
) {
  const client = createThirdwebClient({
    secretKey: thirdweb,
  });

  const personalAccount = privateKeyAccount({
    client,
    privateKey,
  });
  // Configure the smart wallet
  const wallet = smartWallet({
    sponsorGas: true,
    chain: { id: chainId, rpc },
  });

  // Connect the smart wallet
  const smartAccount = await wallet.connect({
    client,
    personalAccount,
  });
  return { personalAccount, smartAccount };
}

export async function callContract(
  chainId: number,
  rpc: string,
  thirdweb: string,
  privateKey: string,
  callParams: CallParams[]
) {
  const transactions: PreparedTransaction[] = [];
  const client = createThirdwebClient({
    secretKey: thirdweb,
  });
  for (const param of callParams) {
    const contract = getContract({
      client,
      chain: { id: chainId, rpc },
      address: param.target,
      abi: param.abi,
    });
    transactions.push(
      prepareContractCall({
        params: param.params,
        method: param.method,
        contract,
      })
    );
  }
  const { smartAccount } = await getAccount(chainId, rpc, thirdweb, privateKey);
  return await sendBatchTransaction({
    transactions,
    account: smartAccount,
  });
}

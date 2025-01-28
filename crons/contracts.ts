import {
  createThirdwebClient,
  sendBatchTransaction,
  prepareContractCall,
  PreparedTransaction,
  getContract,
  sendTransaction,
} from "thirdweb";
import { privateKeyAccount, smartWallet } from "thirdweb/wallets";
import { ethers } from "ethers";
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
    sponsorGas: false,
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

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function callContractEOA(
  chainId: number,
  rpc: string,
  thirdweb: string,
  privateKey: string,
  callParams: CallParams[]
) {
  const transactions: string[] = [];
  const { personalAccount } = await getAccount(
    chainId,
    rpc,
    thirdweb,
    privateKey
  );
  const client = createThirdwebClient({
    secretKey: thirdweb,
  });
  for (const param of callParams) {
    try {
      const contract = getContract({
        client,
        chain: { id: chainId, rpc },
        address: param.target,
        abi: param.abi,
      });
      const transaction = prepareContractCall({
        params: param.params,
        method: param.method,
        contract,
      });

      const tx = await sendTransaction({
        transaction,
        account: personalAccount,
      });
      console.log(`Executed transaction : ${tx.transactionHash}`);
      transactions.push(tx.transactionHash);
    } catch (error) {
      console.log("Error occurred, moving to next ...", error);
    }
    await delay(10 * 1000);
  }

  return transactions;
}

export async function callContractEthers(
  chainId: number,
  rpc: string,
  privateKey: string,
  callParams: CallParams[]
) {
  const transactions: string[] = [];
  const provider = new ethers.JsonRpcProvider(rpc, chainId, {
    staticNetwork: true,
  });
  const wallet = new ethers.Wallet(privateKey, provider);
  for (const param of callParams) {
    try {
      const contract = new ethers.Contract(param.target, param.abi, wallet);

      const tx = await contract[param.methodName](...param.params);
      await tx.wait();
      console.log(`Executed transaction : ${tx.has}`);
      transactions.push(tx.hash);
    } catch (error) {
      console.log("Error occurred, moving to next ...", error);
    }
    await delay(10 * 1000);
  }

  return transactions;
}

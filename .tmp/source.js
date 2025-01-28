var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// web3-functions/football_oracle/index.ts
import {
  Web3Function
} from "@gelatonetwork/web3-functions-sdk";

// web3-functions/lib/oracle.ts
import ky3 from "ky";
import { AbiCoder } from "ethers";

// web3-functions/lib/abis/TopicRegistry.json
var TopicRegistry_exports = {};
__export(TopicRegistry_exports, {
  default: () => TopicRegistry_default
});
var TopicRegistry_default = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_functionName",
        type: "string"
      }
    ],
    name: "DelegateCallFailed",
    type: "error"
  },
  {
    inputs: [],
    name: "EmptyString",
    type: "error"
  },
  {
    inputs: [],
    name: "ExistingTopic",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidTopic",
    type: "error"
  },
  {
    inputs: [],
    name: "UintUtils__InsufficientPadding",
    type: "error"
  },
  {
    inputs: [],
    name: "ZeroAddress",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "topicId",
        type: "string"
      },
      {
        indexed: false,
        internalType: "address",
        name: "poolResolver",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "dataProvider",
        type: "address"
      },
      {
        indexed: false,
        internalType: "enum ITopicRegistry.TopicState",
        name: "state",
        type: "uint8"
      }
    ],
    name: "NewTopic",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32"
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32"
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32"
      }
    ],
    name: "RoleAdminChanged",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32"
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address"
      }
    ],
    name: "RoleGranted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32"
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address"
      }
    ],
    name: "RoleRevoked",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "topicId",
        type: "string"
      },
      {
        indexed: false,
        internalType: "enum ITopicRegistry.TopicState",
        name: "state",
        type: "uint8"
      }
    ],
    name: "TopicDisabled",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "topicId",
        type: "string"
      },
      {
        indexed: false,
        internalType: "enum ITopicRegistry.TopicState",
        name: "state",
        type: "uint8"
      }
    ],
    name: "TopicEnabled",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "topicId",
        type: "string"
      },
      {
        indexed: false,
        internalType: "address",
        name: "poolResolver",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "dataProvider",
        type: "address"
      },
      {
        indexed: false,
        internalType: "enum ITopicRegistry.TopicState",
        name: "state",
        type: "uint8"
      }
    ],
    name: "UpdateTopic",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_topicId",
        type: "string"
      },
      {
        internalType: "address",
        name: "_poolResolver",
        type: "address"
      },
      {
        internalType: "address",
        name: "_dataProvider",
        type: "address"
      }
    ],
    name: "createTopic",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_topicId",
        type: "string"
      }
    ],
    name: "disableTopic",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_topicId",
        type: "string"
      }
    ],
    name: "enableTopic",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_topicId",
        type: "string"
      },
      {
        internalType: "bytes",
        name: "_params",
        type: "bytes"
      }
    ],
    name: "getData",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_topicId",
        type: "string"
      }
    ],
    name: "getTopic",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "topicId",
            type: "string"
          },
          {
            internalType: "contract IPoolResolver",
            name: "poolResolver",
            type: "address"
          },
          {
            internalType: "contract IDataProvider",
            name: "dataProvider",
            type: "address"
          },
          {
            internalType: "enum ITopicRegistry.TopicState",
            name: "state",
            type: "uint8"
          }
        ],
        internalType: "struct ITopicRegistry.Topic",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_topicId",
        type: "string"
      },
      {
        internalType: "bytes",
        name: "_params",
        type: "bytes"
      }
    ],
    name: "hasData",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_topicId",
        type: "string"
      },
      {
        internalType: "bytes",
        name: "_params",
        type: "bytes"
      }
    ],
    name: "provideData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_topicId",
        type: "string"
      },
      {
        internalType: "bytes",
        name: "_params",
        type: "bytes"
      }
    ],
    name: "registerEvent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_topicId",
        type: "string"
      },
      {
        internalType: "bytes",
        name: "_params",
        type: "bytes"
      }
    ],
    name: "updateProvision",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_topicId",
        type: "string"
      },
      {
        internalType: "address",
        name: "_poolResolver",
        type: "address"
      },
      {
        internalType: "address",
        name: "_dataProvider",
        type: "address"
      }
    ],
    name: "updateTopic",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];

// web3-functions/lib/sources/football.ts
import ky from "ky";
async function getMatchesScore(dataUrl, matchIds) {
  const url = `${dataUrl}/matches/scores?matchIds=${matchIds.join(",")}`;
  const resp = await ky.get(url, {
    timeout: 5e3,
    retry: 0
  }).json();
  if (resp) {
    return resp;
  }
  return [];
}

// web3-functions/lib/sources/assets.ts
import ky2 from "ky";

// web3-functions/lib/oracle.ts
var PROVIDE_DATA_METHOD = "function provideData(string,bytes)";
var coder = new AbiCoder();
function isNumeric(str) {
  if (typeof str != "string")
    return false;
  return !isNaN(parseFloat(str));
}
async function getFootballRequests(oracelApi) {
  const footballRequests = await ky3.get(`${oracelApi}/oracle/football?matured=yes&provided=no`, {
    timeout: 5e3,
    retry: 0
  }).json();
  return footballRequests;
}
async function prepareFootballParams(contract, requests, dataUrl) {
  const call = [];
  const matchIds = [];
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
      abi: TopicRegistry_exports,
      method: PROVIDE_DATA_METHOD,
      params
    });
  }
  return call;
}

// web3-functions/lib/contracts.ts
import {
  createThirdwebClient,
  sendBatchTransaction,
  prepareContractCall,
  getContract,
  sendTransaction
} from "thirdweb";
import { privateKeyAccount, smartWallet } from "thirdweb/wallets";
async function getAccount(chainId, rpc, thirdweb, privateKey) {
  const client = createThirdwebClient({
    secretKey: thirdweb
  });
  const personalAccount = privateKeyAccount({
    client,
    privateKey
  });
  const wallet = smartWallet({
    sponsorGas: false,
    chain: { id: chainId, rpc }
  });
  const smartAccount = await wallet.connect({
    client,
    personalAccount
  });
  return { personalAccount, smartAccount };
}
var delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function callContractEOA(chainId, rpc, thirdweb, privateKey, callParams) {
  const transactions = [];
  const { personalAccount } = await getAccount(
    chainId,
    rpc,
    thirdweb,
    privateKey
  );
  const client = createThirdwebClient({
    secretKey: thirdweb
  });
  for (const param of callParams) {
    const contract = getContract({
      client,
      chain: { id: chainId, rpc },
      address: param.target,
      abi: param.abi
    });
    const transaction = prepareContractCall({
      params: param.params,
      method: param.method,
      contract
    });
    const tx = await sendTransaction({
      transaction,
      account: personalAccount
    });
    console.log(`Executed transaction : ${tx.transactionHash}`);
    transactions.push(tx.transactionHash);
    await delay(10 * 1e3);
  }
  return transactions;
}

// web3-functions/football_oracle/index.ts
Web3Function.onRun(async (context) => {
  const { secrets, gelatoArgs } = context;
  const BALLS_API = await secrets.get("BALLS_API");
  const SOCCERSM_CONTRACT = await secrets.get("SOCCERSM_CONTRACT");
  const FUNCTIONS_CHAIN_ID = await secrets.get("FUNCTIONS_CHAIN_ID");
  const FUNCTIONS_RPC = await secrets.get("FUNCTIONS_RPC");
  const THIRDWEB_SECRET_KEY = await secrets.get("THIRDWEB_SECRET_KEY");
  const FOOTBALL_ORACLE_ROLE_KEY = await secrets.get("FOOTBALL_ORACLE_ROLE_KEY");
  const football = await getFootballRequests(BALLS_API);
  console.log(`${football.length} Football requests fetch ...`);
  const footballParams = await prepareFootballParams(
    SOCCERSM_CONTRACT,
    football,
    BALLS_API
  );
  console.log(
    `${footballParams.length} Football Params Prepared for Provision ...`
  );
  await callContractEOA(
    gelatoArgs.chainId,
    FUNCTIONS_RPC,
    THIRDWEB_SECRET_KEY,
    FOOTBALL_ORACLE_ROLE_KEY,
    footballParams
  );
});

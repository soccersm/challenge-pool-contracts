import { HardhatUserConfig, vars } from "hardhat/config";
import "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import "@nomicfoundation/hardhat-toolbox";

const DEPLOY_KEY = vars.get("DEPLOY_KEY");
const DEPLOY_KEY_MAIN = vars.get("DEPLOY_KEY_MAIN");
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 9999999,
      },
      evmVersion: "london",
    },
  },
  w3f: {
    rootDir: "./web3-functions",
    debug: true,
    networks: ["lisk", "liskTestnet"],
  },
  networks: {
    liskTestnet: {
      url: "https://rpc.sepolia-api.lisk.com",
      chainId: 4202,
      accounts: [DEPLOY_KEY],
    },
    lisk: {
      url: "https://rpc.api.lisk.com",
      chainId: 1135,
      accounts: [DEPLOY_KEY_MAIN],
    },
  },
  etherscan: {
    apiKey: {
      liskTestnet: "liskTestnet",
      lisk: "lisk",
    },
    customChains: [
      {
        network: "liskTestnet",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com",
        },
      },
      {
        network: "lisk",
        chainId: 1135,
        urls: {
          apiURL: "https://blockscout.lisk.com/api",
          browserURL: "https://blockscout.lisk.com",
        },
      },
    ],
  },
  mocha: {
    timeout: 100000000,
  },
};

export default config;

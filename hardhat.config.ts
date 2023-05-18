import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.12",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  gasReporter: { enabled: false },
  networks: {
    hardhat: {
      accounts: {
        count: 50,
        accountsBalance: "50000000000000000000000",
      },
    },
    baseGoerli: {
      url: process.env.BASE_GOERLI_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    matic: {
      url: process.env.POLYGON_MAINNET_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    mumbai: {
      url: process.env.POLYGON_MUMBAI_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;

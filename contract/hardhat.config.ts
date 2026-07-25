import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// Besu dev.json "Test Account 1" — see https://docs.besu-eth.org/private-networks/reference/accounts-for-testing
const BESU_DEV_PRIVATE_KEY =
  "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    besu: {
      url: "http://127.0.0.1:8545",
      // Match the network ID '1337' that your Besu node expects
      chainId: 1337,
      gasPrice: 0,
      gas: 60000000,
      accounts: [BESU_DEV_PRIVATE_KEY],
    },
    hardhat: {
      gasPrice: 0,
      initialBaseFeePerGas: 0,
    },
  },
};

export default config;

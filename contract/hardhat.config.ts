import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// Set your private key here for Besu deployment.
// WARNING: Do NOT commit real private keys! Use environment variables in production.
const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0x8f2a55949038a9610f50fb23b5883af3b4ca1305f03d5fc4107bcda663b610c1";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    // Local Hyperledger Besu network (zero gas)
    besu: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
      gasPrice: 0,
      accounts: [PRIVATE_KEY],
    },
    hardhat: {
      gasPrice: 0,
      initialBaseFeePerGas: 0,
    },
  },
};

export default config;

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    besu: {
      // Injected your exact active ngrok forwarding link
      url: "https://unplowed-scabby-stitch.ngrok-free.dev",
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

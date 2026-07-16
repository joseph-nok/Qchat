import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const MessageVerifier = await ethers.getContractFactory("MessageVerifier");
  const messageVerifier = await MessageVerifier.deploy();
  await messageVerifier.waitForDeployment();

  const address = await messageVerifier.getAddress();
  console.log("MessageVerifier deployed to:", address);
  console.log("\n==================================================");
  console.log("SUCCESS: MessageVerifier deployed to local Besu.");
  console.log("Copy the following configuration values into your .env.local file:");
  console.log("==================================================");
  console.log(`VITE_CONTRACT_ADDRESS=${address}`);
  console.log(`VITE_BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545`);
  console.log("==================================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

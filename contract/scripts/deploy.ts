import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const MessageVerifier = await ethers.getContractFactory("MessageVerifier");
  const messageVerifier = await MessageVerifier.deploy();
  await messageVerifier.waitForDeployment();

  const address = await messageVerifier.getAddress();
  console.log("MessageVerifier deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

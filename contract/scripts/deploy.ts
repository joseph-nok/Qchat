import { ethers } from "hardhat";

// Besu dev.json "Test Account 1" (200 ETH prefunded in genesis)
const BESU_DEV_PRIVATE_KEY =
  "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";

// Use standard 'any' typing objects for the pre-flight check to bypass strict compiler checks
async function assertBesuReady(provider: any, deployer: any): Promise<void> {
  const [chainId, balance, blockNumber, mining] = await Promise.all([
    provider.getNetwork().then((n: any) => Number(n.chainId)),
    provider.getBalance(deployer.address),
    provider.getBlockNumber(),
    provider.send("eth_mining", []),
  ]);

  if (chainId !== 1337) {
    throw new Error(`Expected Besu chain ID 1337, got ${chainId}.`);
  }

  if (balance === 0n) {
    throw new Error(
      `Deployer ${deployer.address} has zero balance. Use Besu dev test account 1 or restart with --network=dev.`,
    );
  }

  if (blockNumber === 0 && !mining) {
    throw new Error(
      "Besu is not mining (stuck at block 0). Restart with scripts/start-besu.sh or add --miner-enabled.",
    );
  }
}

async function main(): Promise<void> {
  // Use Hardhat's built-in initialization engine to guarantee plugin compatibility
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545", 1337);
  const deployer = new ethers.Wallet(BESU_DEV_PRIVATE_KEY, provider);

  await assertBesuReady(provider, deployer);

  console.log("Deploying with Besu dev account:", deployer.address);
  console.log(
    "Balance:",
    ethers.formatEther(await provider.getBalance(deployer.address)),
    "ETH",
  );

  const MessageVerifier = await ethers.getContractFactory(
    "MessageVerifier",
    deployer,
  );

  console.log("Sending deployment transaction to Hyperledger Besu...");
  const messageVerifier = await MessageVerifier.deploy({
    gasLimit: 5000000,
    gasPrice: 0,
  });

  await messageVerifier.waitForDeployment();

  const address = await messageVerifier.getAddress();
  console.log("\n==================================================");
  console.log("🚀 SUCCESS: MessageVerifier deployed to local Besu!");
  console.log(`VITE_CONTRACT_ADDRESS=${address}`);
  console.log("==================================================\n");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

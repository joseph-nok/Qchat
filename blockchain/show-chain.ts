import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const TX_LOG_FILE = path.join(DATA_DIR, "transactions_log.json");
const CHAIN_DATA_FILE = path.join(DATA_DIR, "chain_data.json");

const BESU_RPC_URL = process.env.VITE_BESU_RPC_URL || process.env.BESU_RPC_URL || "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS || "0xa50a51c09a5c451C52BB714527E1974b686D8e77";

async function showChain(): Promise<void> {
  console.log("\n==================================================================");
  console.log("⛓️  QCHAT BLOCKCHAIN STORAGE & CHAIN STATE OVERVIEW");
  console.log("==================================================================");

  let currentBlockNum: number | string = "Unavailable";
  let networkName: string = "Besu Local Dev (1337)";
  let isConnected = false;

  try {
    const provider = new ethers.JsonRpcProvider(BESU_RPC_URL);
    const network = await provider.getNetwork();
    currentBlockNum = await provider.getBlockNumber();
    networkName = `Chain ID ${network.chainId.toString()}`;
    isConnected = true;
  } catch {
    isConnected = false;
  }

  console.log(`🌐 Node Status      : ${isConnected ? "✅ ONLINE (Listening on 8545)" : "⚠️ OFFLINE (Besu container not running)"}`);
  console.log(`📡 RPC Endpoint     : ${BESU_RPC_URL}`);
  console.log(`📜 Contract Address : ${CONTRACT_ADDRESS}`);
  console.log(`📦 Current Height   : Block #${currentBlockNum}`);
  console.log(`🔗 Network Info     : ${networkName}`);
  console.log("------------------------------------------------------------------");

  let snapshot: any = {};
  if (fs.existsSync(CHAIN_DATA_FILE)) {
    try {
      snapshot = JSON.parse(fs.readFileSync(CHAIN_DATA_FILE, "utf-8"));
    } catch {}
  }

  let transactions: any[] = [];
  if (fs.existsSync(TX_LOG_FILE)) {
    try {
      transactions = JSON.parse(fs.readFileSync(TX_LOG_FILE, "utf-8"));
    } catch {}
  }

  console.log(`📁 Stored Tx Logs    : ${TX_LOG_FILE}`);
  console.log(`📊 Total Stored Txs : ${transactions.length}`);
  console.log("==================================================================\n");

  if (transactions.length === 0) {
    console.log("ℹ️ No transactions recorded in storage yet.");
    console.log("👉 Send a message or register a user in QChat to generate live transactions.\n");
    return;
  }

  console.log("📜 RECORDED TRANSACTIONS HISTORY (Newest First):\n");
  transactions.slice(0, 15).forEach((tx, idx) => {
    console.log(`[${idx + 1}] Event: ${tx.eventType || "Contract Interaction"}`);
    console.log(`    🔗 Tx Hash   : ${tx.txHash}`);
    console.log(`    📦 Block #   : #${tx.blockNumber}`);
    console.log(`    🕒 Time      : ${tx.timestamp}`);
    if (tx.messageId) console.log(`    🆔 Message ID: ${tx.messageId}`);
    if (tx.messageHash) console.log(`    🔑 Hash      : ${tx.messageHash}`);
    if (tx.from) console.log(`    👤 From      : ${tx.from}`);
    if (tx.to) console.log(`    📥 To        : ${tx.to}`);
    if (tx.userAddress) console.log(`    👤 User      : ${tx.userAddress}`);
    if (tx.role) console.log(`    🏷️ Role      : ${tx.role}`);
    console.log("    --------------------------------------------------------------");
  });

  if (transactions.length > 15) {
    console.log(`... and ${transactions.length - 15} more transactions in ${TX_LOG_FILE}\n`);
  }
}

showChain().catch((err) => {
  console.error("Error reading chain state:", err);
  process.exit(1);
});

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

const CONTRACT_ABI = [
  "event MessageHashRecorded(string messageId, bytes32 messageHash, address indexed sender, address indexed receiver, uint256 timestamp)",
  "event UserVerified(address indexed userAddress, string role)",
  "function recordHash(string messageId, bytes32 messageHash, address sender, address receiver) external",
  "function verifyUser(address userAddress, string role) external",
  "function registerMessageHash(bytes32 _hash) public",
];

interface TxRecord {
  txHash: string;
  blockNumber: number;
  timestamp: string;
  eventType: string;
  contractAddress: string;
  from: string;
  to?: string;
  messageId?: string;
  messageHash?: string;
  userAddress?: string;
  role?: string;
  gasUsed?: string;
}

interface ChainDataSnapshot {
  lastUpdated: string;
  rpcUrl: string;
  contractAddress: string;
  currentBlock: number;
  totalTransactionsRecorded: number;
  networkId: string;
}

function ensureDataStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TX_LOG_FILE)) {
    fs.writeFileSync(TX_LOG_FILE, JSON.stringify([], null, 2), "utf-8");
  }
  if (!fs.existsSync(CHAIN_DATA_FILE)) {
    const initialSnapshot: ChainDataSnapshot = {
      lastUpdated: new Date().toISOString(),
      rpcUrl: BESU_RPC_URL,
      contractAddress: CONTRACT_ADDRESS,
      currentBlock: 0,
      totalTransactionsRecorded: 0,
      networkId: "1337",
    };
    fs.writeFileSync(CHAIN_DATA_FILE, JSON.stringify(initialSnapshot, null, 2), "utf-8");
  }
}

function readTxLogs(): TxRecord[] {
  try {
    ensureDataStorage();
    const raw = fs.readFileSync(TX_LOG_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveTxRecord(record: TxRecord): void {
  ensureDataStorage();
  const logs = readTxLogs();
  // Prevent duplicate logs for same txHash and event
  const exists = logs.some((l) => l.txHash === record.txHash && l.eventType === record.eventType);
  if (!exists) {
    logs.unshift(record); // newest first
    fs.writeFileSync(TX_LOG_FILE, JSON.stringify(logs, null, 2), "utf-8");
  }
}

function updateChainSnapshot(blockNum: number, txCountIncrement: number = 0): void {
  ensureDataStorage();
  try {
    const logs = readTxLogs();
    const snapshot: ChainDataSnapshot = {
      lastUpdated: new Date().toISOString(),
      rpcUrl: BESU_RPC_URL,
      contractAddress: CONTRACT_ADDRESS,
      currentBlock: blockNum,
      totalTransactionsRecorded: logs.length,
      networkId: "1337",
    };
    fs.writeFileSync(CHAIN_DATA_FILE, JSON.stringify(snapshot, null, 2), "utf-8");
  } catch (err) {
    console.error("⚠️ Failed to write chain data snapshot:", err);
  }
}

async function startMonitor(): Promise<void> {
  console.log("\n==================================================================");
  console.log("⛓️  QCHAT HYPERLEDGER BESU - REAL-TIME TRANSACTION MONITOR");
  console.log("==================================================================");
  console.log(`📡 RPC Endpoint     : ${BESU_RPC_URL}`);
  console.log(`📜 Target Contract  : ${CONTRACT_ADDRESS}`);
  console.log(`📁 Storage Location : ${TX_LOG_FILE}`);
  console.log("==================================================================\n");

  ensureDataStorage();

  let provider: ethers.JsonRpcProvider | null = null;

  while (!provider) {
    try {
      provider = new ethers.JsonRpcProvider(BESU_RPC_URL);
      const network = await provider.getNetwork();
      const currentBlock = await provider.getBlockNumber();
      console.log(`✅ Connected to Blockchain (Chain ID: ${network.chainId.toString()}, Current Block: #${currentBlock})`);
      updateChainSnapshot(currentBlock);
    } catch (err) {
      console.log("⏳ Waiting for Hyperledger Besu node at http://127.0.0.1:8545 ...");
      provider = null;
      await new Promise((res) => setTimeout(res, 3000));
    }
  }

  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

  // Sync past events on startup
  try {
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latestBlock - 1000);
    const pastMsgEvents = await contract.queryFilter("MessageHashRecorded", fromBlock, latestBlock);
    for (const event of pastMsgEvents as any[]) {
      if (event.args) {
        const [msgId, msgHash, sender, receiver, timestamp] = event.args;
        const formattedTime = new Date(Number(timestamp) * 1000).toLocaleString();
        saveTxRecord({
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: formattedTime,
          eventType: "MessageHashRecorded",
          contractAddress: CONTRACT_ADDRESS,
          from: sender,
          to: receiver,
          messageId: msgId,
          messageHash: msgHash,
        });
      }
    }
    const pastUserEvents = await contract.queryFilter("UserVerified", fromBlock, latestBlock);
    for (const event of pastUserEvents as any[]) {
      if (event.args) {
        const [userAddr, role] = event.args;
        saveTxRecord({
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: new Date().toLocaleString(),
          eventType: "UserVerified",
          contractAddress: CONTRACT_ADDRESS,
          from: userAddr,
          userAddress: userAddr,
          role: role,
        });
      }
    }
  } catch (syncErr) {
    console.log("ℹ️ Event sync note:", syncErr);
  }

  // 1. Listen for MessageHashRecorded events
  contract.on(
    "MessageHashRecorded",
    async (messageId: string, messageHash: string, sender: string, receiver: string, timestamp: bigint, event: any) => {
      const txHash = event.log?.transactionHash || "0x0";
      const blockNum = event.log?.blockNumber || 0;
      const formattedTime = new Date(Number(timestamp) * 1000).toLocaleString();

      console.log("\n------------------------------------------------------------------");
      console.log(`⚡ TRANSACTION DETECTED [MessageHashRecorded]`);
      console.log("------------------------------------------------------------------");
      console.log(`📦 Block Number  : #${blockNum}`);
      console.log(`🔗 Tx Hash       : ${txHash}`);
      console.log(`🕒 Timestamp     : ${formattedTime}`);
      console.log(`🆔 Message ID    : ${messageId}`);
      console.log(`🔑 Content Hash  : ${messageHash}`);
      console.log(`👤 Sender        : ${sender}`);
      console.log(`📥 Receiver      : ${receiver}`);
      console.log("------------------------------------------------------------------");

      const record: TxRecord = {
        txHash,
        blockNumber: blockNum,
        timestamp: formattedTime,
        eventType: "MessageHashRecorded",
        contractAddress: CONTRACT_ADDRESS,
        from: sender,
        to: receiver,
        messageId,
        messageHash,
      };

      saveTxRecord(record);
      updateChainSnapshot(blockNum);
      console.log(`💾 Saved to: ${TX_LOG_FILE}\n`);
    }
  );

  // 2. Listen for UserVerified events
  contract.on("UserVerified", async (userAddress: string, role: string, event: any) => {
    const txHash = event.log?.transactionHash || "0x0";
    const blockNum = event.log?.blockNumber || 0;
    const formattedTime = new Date().toLocaleString();

    console.log("\n------------------------------------------------------------------");
    console.log(`⚡ TRANSACTION DETECTED [UserVerified]`);
    console.log("------------------------------------------------------------------");
    console.log(`📦 Block Number  : #${blockNum}`);
    console.log(`🔗 Tx Hash       : ${txHash}`);
    console.log(`🕒 Timestamp     : ${formattedTime}`);
    console.log(`👤 User Address  : ${userAddress}`);
    console.log(`🏷️ Assigned Role  : ${role}`);
    console.log("------------------------------------------------------------------");

    const record: TxRecord = {
      txHash,
      blockNumber: blockNum,
      timestamp: formattedTime,
      eventType: "UserVerified",
      contractAddress: CONTRACT_ADDRESS,
      from: userAddress,
      userAddress,
      role,
    };

    saveTxRecord(record);
    updateChainSnapshot(blockNum);
    console.log(`💾 Saved to: ${TX_LOG_FILE}\n`);
  });

  // 3. Monitor new blocks for general contract interactions
  provider.on("block", async (blockNumber: number) => {
    try {
      const block = await provider!.getBlock(blockNumber, true);
      if (!block || !block.transactions) return;

      updateChainSnapshot(blockNumber);

      for (const txResponse of block.prefetchedTransactions || []) {
        if (txResponse.to && txResponse.to.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
          const receipt = await provider!.getTransactionReceipt(txResponse.hash);
          if (receipt) {
            const formattedTime = new Date(block.timestamp * 1000).toLocaleString();
            console.log(`\n📦 Block #${blockNumber} mined - Contract Tx: ${txResponse.hash} (Gas Used: ${receipt.gasUsed.toString()})`);
          }
        }
      }
    } catch {
      // Ignore transient block read issues
    }
  });

  console.log("👀 Listening for live blockchain transactions on Hyperledger Besu...\n");
}

startMonitor().catch((err) => {
  console.error("❌ Fatal Error in Blockchain Monitor:", err);
  process.exit(1);
});

# ⛓️ QChat Blockchain Storage & Real-Time Terminal Monitor

This directory houses the persistent storage artifacts and real-time terminal monitoring utilities for QChat's Hyperledger Besu private blockchain integration.

## 📁 Directory Structure

```
blockchain/
├── data/                      # Persistent storage directory for chain history & logs
│   ├── transactions_log.json  # Recorded transaction receipts, function calls, and parameters
│   └── chain_data.json       # Snapshot of synced block metadata and network stats
├── monitor.ts                 # Real-time CLI listener that displays live transactions on terminal
├── show-chain.ts              # Terminal viewer tool to print stored blockchain status and history
└── README.md                  # Documentation (this file)
```

## 🚀 Quick Terminal Commands

- **Monitor Live Transactions**:
  ```bash
  pnpm blockchain:monitor
  ```
  Runs a real-time event & block listener that formats transactions directly to your terminal screen as messages, users, or Q&A posts are anchored.

- **Inspect Blockchain History**:
  ```bash
  pnpm blockchain:show
  ```
  Displays current block height, total recorded transactions, contract address, and recent ledger entries stored in `blockchain/data/`.

- **View Raw Transaction Log JSON**:
  ```bash
  pnpm blockchain:logs
  ```

## ⚙️ How It Works

1. **Smart Contract**: Deployed on Hyperledger Besu at `MessageVerifier` contract address.
2. **Web3 Bridge**: When a user registers, sends a DM, or posts in Q&A, `cryptoBridge.ts` invokes `recordHash` or `verifyUser` on the smart contract with `{ gasPrice: 0 }`.
3. **Storage Persistence**: `monitor.ts` intercepts the event logs, decodes function arguments, logs formatted details to the terminal, and writes structured records into `blockchain/data/transactions_log.json`.

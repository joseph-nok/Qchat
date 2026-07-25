# MessageVerifier Smart Contract

This is the Smart Contract backend for a Web3 chat/Q&A application, built using Hardhat and configured for a zero-gas Hyperledger Besu local network.

## Features

- **Immutable Hash Recording**: Records the Keccak256 hash of messages (`recordHash`) to ensure data integrity and prevent tampering.
- **Message Verification**: Allows checking the integrity of a message by retrieving its stored hash (`verifyHash`).
- **User Verification (RBAC)**: Basic admin access control to verify users and assign roles like `"student"`, `"lecturer"`, or `"admin"` (`verifyUser`).

## Requirements

- Node.js (v18+ recommended)
- Hyperledger Besu (for local zero-gas network)

## Setup and Installation

1. Install dependencies:
```bash
npm install
```

2. Compile the smart contract:
```bash
npx hardhat compile
```

## Running Tests

Run the test suite to ensure the contract logic works as expected:

```bash
npx hardhat test
```

## Deployment to Besu (Zero-Gas Local Network)

1. **Start your Besu network:**
Ensure your Besu node is running locally with mining enabled and exposing RPC at `http://127.0.0.1:8545`:

```bash
./scripts/start-besu.sh
```

Use Besu dev test account 1 (`0xfe3b557e8fb62b89f4916b721be55ceb828dbd73`, 200 ETH prefunded). Without `--miner-enabled`, deployments hang waiting for block 1.

2. **Deploy the contract:**
Deploy the smart contract to the local Besu network using the following command:

```bash
npx hardhat run scripts/deploy.ts --network besu
```

This will compile (if needed) and deploy the `MessageVerifier` contract, then print the deployed contract address.

## Interacting with the Contract (Frontend)

Once deployed, use the `ethers.js` or `web3.js` library in your frontend to interact with the contract. 

**ABIs and Contract Address:**
- The ABI will be located in `artifacts/contracts/MessageVerifier.sol/MessageVerifier.json` after compilation.
- The contract address will be the one returned during the deployment step.

**Key Functions:**
- `recordHash(string messageId, bytes32 messageHash, address sender, address receiver)`
- `verifyHash(string messageId)`
- `verifyUser(address userAddress, string role)` (Admin Only)
- `getUserRole(address userAddress)`

## Security Considerations
This contract is designed to be simple and secure for a final-year project:
- Uses `modifier onlyAdmin()` for restricted actions.
- Includes timestamp checks to prevent overwriting existing message hashes.
- Emits events (`MessageHashRecorded`, `UserVerified`) for efficient frontend tracking.

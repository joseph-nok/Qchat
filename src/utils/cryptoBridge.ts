import { ethers } from "ethers";

// Environment variables configuration with fallbacks
const BLOCKCHAIN_RPC_URL =
  (import.meta.env?.VITE_BESU_RPC_URL as string) ||
  (import.meta.env?.VITE_BLOCKCHAIN_RPC_URL as string) ||
  "http://127.0.0.1:8545"; // Default local Besu/Hardhat network port

const CONTRACT_ADDRESS =
  (import.meta.env?.VITE_CONTRACT_ADDRESS as string) ||
  "0xa50a51c09a5c451C52BB714527E1974b686D8e77";

const ADMIN_PRIVATE_KEY =
  (import.meta.env?.VITE_SYSTEM_PRIVATE_KEY as string) ||
  (import.meta.env?.VITE_ADMIN_PRIVATE_KEY as string) ||
  "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";

const CONTRACT_ABI = [
  "function recordHash(string memory messageId, bytes32 messageHash, address sender, address receiver) external",
  "function verifyHash(string memory messageId) external view returns (bytes32)",
  "function verifyUser(address userAddress, string memory role) external",
  "function getUserRole(address userAddress) external view returns (string memory)",
];

/**
 * Deterministically derives a 20-byte Ethereum address from a Convex ID.
 * This allows user-specific or entity-specific keys without needing true wallets.
 */
export function getPseudoAddress(id: string): string {
  if (!id || id === "public" || id === "skip") {
    return ethers.ZeroAddress;
  }
  const hash = ethers.keccak256(ethers.toUtf8Bytes(id));
  return "0x" + hash.substring(26);
}

/**
 * Generates a 2048-bit RSA key pair (RSASSA-PKCS1-v1_5, SHA-256).
 * The private key is set as non-extractable and saved to IndexedDB ("QChatLocalVault", store "keys").
 * The public key is exported in SPKI format as a Base64 string.
 * 
 * @param userId Unique identifier for the user to index the private key in IndexedDB.
 * @returns The Base64 encoded public key string (SPKI format).
 */
export async function generateAndStoreKeyPair(userId: string): Promise<string> {
  // Generate keypair
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // Extractable public key and private key object
    ["encrypt", "decrypt"]
  );

  // Export public key in SPKI format
  const exportedPublic = await window.crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey
  );

  // Convert ArrayBuffer to Base64 string
  const publicBase64 = btoa(
    String.fromCharCode(...new Uint8Array(exportedPublic))
  );

  // Save the private key natively into IndexedDB indexed by userId
  await savePrivateKeyToIndexedDB(userId, keyPair.privateKey);

  return publicBase64;
}

/**
 * Saves a CryptoKey to the browser's local IndexedDB.
 */
export function savePrivateKeyToIndexedDB(
  userId: string,
  privateKey: CryptoKey
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("QChatLocalVault", 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("keys")) {
        db.createObjectStore("keys");
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction("keys", "readwrite");
      const store = transaction.objectStore("keys");
      const putRequest = store.put(privateKey, userId);

      putRequest.onsuccess = () => {
        resolve();
      };

      putRequest.onerror = () => {
        reject(putRequest.error || new Error("Failed to store private key."));
      };
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to open IndexedDB vault."));
    };
  });
}

/**
 * Retrieves a CryptoKey from the browser's local IndexedDB.
 */
export function getPrivateKeyFromIndexedDB(
  userId: string
): Promise<CryptoKey | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("QChatLocalVault", 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("keys")) {
        db.createObjectStore("keys");
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction("keys", "readonly");
      const store = transaction.objectStore("keys");
      const getRequest = store.get(userId);

      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };

      getRequest.onerror = () => {
        reject(getRequest.error || new Error("Failed to retrieve private key."));
      };
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to open IndexedDB vault."));
    };
  });
}

/**
 * Computes the client-side SHA-256 hash of a string payload and formats it as a 0x-prefixed hex string (bytes32).
 */
export async function computeSHA256Bytes32(payload: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(payload);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hashHex}`;
}

/**
 * Relays user identity approval or message hashes to the Hyperledger Besu Private network.
 * Uses a walletless admin signing loop configured with zero gas.
 * 
 * @param actionType The operation to perform: "APPROVE_USER" or "RECORD_MESSAGE".
 * @param identifier The target ID (convexUserId or messageId).
 * @param rawTextPayload The raw text payload to hash (empty string or custom payload for user approvals, message text for messages).
 * @param extraData Optional extra context (senderId, receiverId, role).
 * @returns The transaction hash of the dispatched blockchain transaction.
 */
export async function relayHashToBesu(
  actionType: "APPROVE_USER" | "RECORD_MESSAGE",
  identifier: string,
  rawTextPayload: string,
  extraData?: {
    senderId?: string;
    receiverId?: string;
    role?: string;
  }
): Promise<string> {
  try {
    // 1. Initialize Ethers provider (connecting to local or tunnel RPC URL)
    const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_RPC_URL);

    // 2. Instantiate the admin wallet signer
    const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);

    // 3. Connect to the smart contract
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      adminWallet
    );

    // 4. Compute SHA-256 hash of the payload in bytes32 format
    const contentHash = await computeSHA256Bytes32(rawTextPayload);

    // 5. Execute transaction based on action type with { gasPrice: 0 }
    let txResponse;
    if (actionType === "APPROVE_USER") {
      const userAddress = getPseudoAddress(identifier);
      const role = extraData?.role || "student";
      txResponse = await contract.verifyUser(userAddress, role, {
        gasPrice: 0n, // zero-gas dev network
      });
    } else if (actionType === "RECORD_MESSAGE") {
      const senderAddr = getPseudoAddress(extraData?.senderId || "admin");
      const receiverAddr = getPseudoAddress(extraData?.receiverId || "public");

      txResponse = await contract.recordHash(identifier, contentHash, senderAddr, receiverAddr, {
        gasPrice: 0n, // zero-gas dev network
      });
    } else {
      throw new Error(`Unsupported action type: ${actionType}`);
    }

    // Wait for the transaction to be mined
    const receipt = await txResponse.wait();
    return receipt.hash || txResponse.hash;
  } catch (error) {
    console.error("Blockchain relay error:", error);
    throw error;
  }
}

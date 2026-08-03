import { runBB84Simulation, BB84Result } from '../lib/bb84';

export interface EncryptedTextPayload {
  ciphertext: string; // Base64 encoded
  iv: string;         // Base64 encoded Initialization Vector (12 bytes)
}

export interface EncryptedFilePayload {
  encryptedBlob: Blob;
  iv: string;         // Base64 encoded IV
  originalName: string;
  originalType: string;
  originalSize: number;
}

/**
 * Converts a hex string to Uint8Array byte array.
 */
function hexToUint8Array(hexString: string): Uint8Array {
  const cleanHex = hexString.replace(/^0x/, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Converts Uint8Array byte array to Base64 string.
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Converts Base64 string to Uint8Array byte array.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Imports a 256-bit raw hex string key into a Web Crypto AES-GCM CryptoKey.
 */
export async function importAESGCMKey(rawHexKey: string): Promise<CryptoKey> {
  const keyBuffer = hexToUint8Array(rawHexKey);
  return await window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Triggers automated BB84 quantum key exchange simulation.
 * Returns 256-bit raw hex key, formatted SHA-256 fingerprint, and simulation stats.
 */
export async function performBB84KeyExchange(): Promise<BB84Result> {
  return await runBB84Simulation(256);
}

/**
 * Encrypts a plain text message using Web Crypto API (AES-GCM 256-bit).
 * 
 * @param plaintext Plain text message to encrypt.
 * @param rawHexKey 256-bit shared secret key (hex string).
 * @returns Object containing Base64 ciphertext and Base64 initialization vector (IV).
 */
export async function encryptTextMessage(
  plaintext: string,
  rawHexKey: string
): Promise<EncryptedTextPayload> {
  const cryptoKey = await importAESGCMKey(rawHexKey);
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV recommended for AES-GCM
  const encodedText = new TextEncoder().encode(plaintext);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    cryptoKey,
    encodedText
  );

  return {
    ciphertext: uint8ArrayToBase64(new Uint8Array(encryptedBuffer)),
    iv: uint8ArrayToBase64(iv),
  };
}

/**
 * Decrypts an AES-GCM encrypted message using Web Crypto API.
 * 
 * @param ciphertext Base64 encoded ciphertext.
 * @param iv Base64 encoded IV.
 * @param rawHexKey 256-bit shared secret key (hex string).
 * @returns Decrypted plaintext string.
 */
export async function decryptTextMessage(
  ciphertext: string,
  iv: string,
  rawHexKey: string
): Promise<string> {
  try {
    const cryptoKey = await importAESGCMKey(rawHexKey);
    const ciphertextBytes = base64ToUint8Array(ciphertext);
    const ivBytes = base64ToUint8Array(iv);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
      },
      cryptoKey,
      ciphertextBytes
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt message. Key mismatch or corrupted ciphertext.');
  }
}

/**
 * Encrypts a File blob using Web Crypto AES-GCM.
 * 
 * @param file Input file object.
 * @param rawHexKey 256-bit shared secret key.
 * @returns Object containing encrypted Blob, IV, and original file metadata.
 */
export async function encryptFile(
  file: File,
  rawHexKey: string
): Promise<EncryptedFilePayload> {
  const cryptoKey = await importAESGCMKey(rawHexKey);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const fileArrayBuffer = await file.arrayBuffer();

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    cryptoKey,
    fileArrayBuffer
  );

  const encryptedBlob = new Blob([encryptedBuffer], { type: 'application/octet-stream' });

  return {
    encryptedBlob,
    iv: uint8ArrayToBase64(iv),
    originalName: file.name,
    originalType: file.type || 'application/octet-stream',
    originalSize: file.size,
  };
}

/**
 * Decrypts an encrypted File blob using Web Crypto AES-GCM.
 * 
 * @param encryptedBlob Encrypted Blob.
 * @param iv Base64 encoded IV.
 * @param rawHexKey 256-bit shared secret key.
 * @param originalName Original file name.
 * @param originalType Original MIME type.
 * @returns Decrypted native File object ready for download/preview.
 */
export async function decryptFile(
  encryptedBlob: Blob,
  iv: string,
  rawHexKey: string,
  originalName: string,
  originalType: string
): Promise<File> {
  const cryptoKey = await importAESGCMKey(rawHexKey);
  const ivBytes = base64ToUint8Array(iv);
  const encryptedBuffer = await encryptedBlob.arrayBuffer();

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes,
    },
    cryptoKey,
    encryptedBuffer
  );

  return new File([decryptedBuffer], originalName, { type: originalType });
}

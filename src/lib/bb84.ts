/**
 * Quantum-Inspired BB84 Key Exchange Protocol Simulation
 * 
 * BB84 is a quantum key distribution (QKD) scheme developed by Charles Bennett and Gilles Brassard in 1984.
 * In a quantum environment:
 * 1. Alice prepares qubits encoded in randomly selected bases: Rectilinear (+) or Diagonal (×).
 * 2. Alice sends these qubits over a quantum channel to Bob.
 * 3. Bob measures each qubit using a randomly chosen basis (+ or ×).
 * 4. Sifting Phase: Alice and Bob communicate over a public classical channel to compare their choice of bases.
 *    - Where their bases MATCH, Bob's measurement is guaranteed to match Alice's bit (ideal noiseless channel).
 *    - Where their bases MISMATCH, Bob's measurement yields a random bit with 50% probability.
 * 5. Alice and Bob discard all bits where their bases mismatched, leaving the sifted key.
 * 6. The sifted key is converted into a 256-bit symmetric key for AES encryption.
 */

export type Basis = '+' | '×';
export type Bit = 0 | 1;

export interface BB84SimulationDetails {
  aliceBits: Bit[];
  aliceBases: Basis[];
  bobBases: Basis[];
  bobMeasurements: Bit[];
  siftedBits: Bit[];
  matchingIndices: number[];
  totalBitsSent: number;
  siftedLength: number;
  efficiencyPercentage: number;
  qber: number; // Quantum Bit Error Rate (0.0 in ideal noiseless channel)
}

export interface BB84Result {
  sharedKeyHex: string;
  fingerprint: string;
  details: BB84SimulationDetails;
}

/**
 * Generates a cryptographically secure random bit (0 or 1).
 */
function getRandomBit(): Bit {
  const array = new Uint8Array(1);
  window.crypto.getRandomValues(array);
  return (array[0] % 2) as Bit;
}

/**
 * Generates a cryptographically secure random basis ('+' or '×').
 */
function getRandomBasis(): Basis {
  return getRandomBit() === 0 ? '+' : '×';
}

/**
 * Converts an array of binary bits into a hexadecimal string.
 * Padding is applied if necessary to align byte boundaries.
 */
export function bitsToHex(bits: Bit[]): string {
  let hex = '';
  for (let i = 0; i < bits.length; i += 8) {
    const byteBits = bits.slice(i, i + 8);
    // Pad right with zeros if last chunk is shorter than 8 bits
    while (byteBits.length < 8) {
      byteBits.push(0);
    }
    const byteVal = byteBits.reduce((acc, bit, idx) => acc | (bit << (7 - idx)), 0);
    hex += byteVal.toString(16).padStart(2, '0');
  }
  return hex.toLowerCase();
}

/**
 * Computes a short, human-readable SHA-256 fingerprint from a key hex string.
 * Format: XXXX-XXXX-XXXX (first 12 uppercase hex characters formatted into 3 groups of 4).
 * 
 * @param hexKey Hexadecimal string representation of the shared secret key.
 * @returns Formatted fingerprint string (e.g. "A3F9-7C2B-1E8D").
 */
export async function generateKeyFingerprint(hexKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(hexKey);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const fullHashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  
  // Extract first 12 characters and format as XXXX-XXXX-XXXX
  const rawFingerprint = fullHashHex.slice(0, 12);
  return `${rawFingerprint.slice(0, 4)}-${rawFingerprint.slice(4, 8)}-${rawFingerprint.slice(8, 12)}`;
}

/**
 * Runs a classical simulation of the BB84 Quantum Key Exchange protocol.
 * Generates qubits, basis choices, simulates measurement, performs sifting,
 * and derives a 256-bit symmetric shared key along with a SHA-256 fingerprint.
 * 
 * @param targetKeyBits Target length for the final sifted key in bits (default: 256).
 * @returns Promise resolving to BB84Result containing key, fingerprint, and simulation statistics.
 */
export async function runBB84Simulation(targetKeyBits = 256): Promise<BB84Result> {
  // Statistically, sifting retains ~50% of bits. We generate slightly more than double
  // the target key length plus safety buffer to ensure we reach targetKeyBits sifted bits.
  const numPhotonsToGenerate = Math.max(targetKeyBits * 2.5, 600);

  const aliceBits: Bit[] = [];
  const aliceBases: Basis[] = [];
  const bobBases: Basis[] = [];
  const bobMeasurements: Bit[] = [];
  const siftedBits: Bit[] = [];
  const matchingIndices: number[] = [];

  let errorCount = 0;

  for (let i = 0; i < numPhotonsToGenerate; i++) {
    // 1. Alice generates random bit and random basis
    const aBit = getRandomBit();
    const aBasis = getRandomBasis();
    aliceBits.push(aBit);
    aliceBases.push(aBasis);

    // 2. Bob chooses random basis for measurement
    const bBasis = getRandomBasis();
    bobBases.push(bBasis);

    // 3. Quantum Measurement Simulation:
    // If Bob's basis matches Alice's basis (+ == + or × == ×), measurement is deterministic (exact bit).
    // If Bob's basis differs (+ vs ×), measurement is randomized with 50/50 probability.
    let bMeasuredBit: Bit;
    if (aBasis === bBasis) {
      bMeasuredBit = aBit;
      matchingIndices.push(i);
    } else {
      bMeasuredBit = getRandomBit();
    }
    bobMeasurements.push(bMeasuredBit);

    // 4. Sifting: Keep only bits where basis choices match
    if (aBasis === bBasis) {
      siftedBits.push(bMeasuredBit);
      if (bMeasuredBit !== aBit) {
        errorCount++;
      }
    }

    // Stop early if target length reached
    if (siftedBits.length >= targetKeyBits) {
      break;
    }
  }

  // Ensure exact target key length (take first targetKeyBits)
  const finalSiftedBits = siftedBits.slice(0, targetKeyBits);
  const sharedKeyHex = bitsToHex(finalSiftedBits);
  const fingerprint = await generateKeyFingerprint(sharedKeyHex);

  const totalBitsSent = aliceBits.length;
  const siftedLength = finalSiftedBits.length;
  const efficiencyPercentage = Math.round((siftedLength / totalBitsSent) * 100);
  const qber = matchingIndices.length > 0 ? (errorCount / matchingIndices.length) : 0;

  return {
    sharedKeyHex,
    fingerprint,
    details: {
      aliceBits,
      aliceBases,
      bobBases,
      bobMeasurements,
      siftedBits: finalSiftedBits,
      matchingIndices: matchingIndices.slice(0, targetKeyBits),
      totalBitsSent,
      siftedLength,
      efficiencyPercentage,
      qber,
    },
  };
}

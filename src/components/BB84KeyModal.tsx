import React, { useState } from 'react';
import type { BB84SimulationDetails } from '../lib/bb84';
import '../component_css/BB84KeyModal.css';

interface BB84KeyModalProps {
  fingerprint: string;
  isConfirmedByMe: boolean;
  isConfirmedByOther: boolean;
  otherUserName: string;
  debugInfo?: BB84SimulationDetails | { totalBitsSent: number; siftedLength: number; efficiencyPercentage: number; qber: number };
  onConfirm: () => void;
  onRegenerateKey: () => void;
  onClose?: () => void;
}

export const BB84KeyModal: React.FC<BB84KeyModalProps> = ({
  fingerprint,
  isConfirmedByMe,
  isConfirmedByOther,
  otherUserName,
  debugInfo,
  onConfirm,
  onRegenerateKey,
  onClose,
}) => {
  const [showDebug, setShowDebug] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyFingerprint = () => {
    void navigator.clipboard.writeText(fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFullDebug = debugInfo && 'aliceBits' in debugInfo;
  const fullDetails = isFullDebug ? (debugInfo as BB84SimulationDetails) : null;

  return (
    <div className="bb84-modal-overlay">
      <div className="bb84-modal-card">
        <div className="bb84-modal-header">
          <div className="bb84-quantum-badge">
            <span className="bb84-atom-icon">⚛️</span> Quantum Key Exchange (BB84)
          </div>
          {onClose && (
            <button className="bb84-close-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>

        <div className="bb84-modal-body">
          <p className="bb84-intro-text">
            A 256-bit symmetric encryption key has been generated using a simulated <strong>BB84 Quantum Key Distribution</strong> protocol with <strong>{otherUserName}</strong>.
          </p>

          {/* Key Fingerprint Display */}
          <div className="bb84-fingerprint-box">
            <div className="bb84-fingerprint-label">SHARED KEY FINGERPRINT (SHA-256)</div>
            <div className="bb84-fingerprint-code">{fingerprint}</div>
            <button className="bb84-copy-btn" onClick={handleCopyFingerprint}>
              {copied ? '✓ Copied' : '📋 Copy Fingerprint'}
            </button>
          </div>

          {/* Confirmation Status Indicators */}
          <div className="bb84-status-panel">
            <div className={`bb84-status-item ${isConfirmedByMe ? 'confirmed' : 'pending'}`}>
              <span className="status-dot"></span>
              <span>You: {isConfirmedByMe ? 'Confirmed ✓' : 'Pending Confirmation'}</span>
            </div>
            <div className={`bb84-status-item ${isConfirmedByOther ? 'confirmed' : 'pending'}`}>
              <span className="status-dot"></span>
              <span>{otherUserName}: {isConfirmedByOther ? 'Confirmed ✓' : 'Pending Confirmation'}</span>
            </div>
          </div>

          {/* Debug / Educational Toggle */}
          <div className="bb84-debug-toggle-bar">
            <button
              className="bb84-toggle-debug-btn"
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? '▼ Hide Educational Debug Mode' : '▶ Educational Debug Mode (Quantum Simulation)'}
            </button>
          </div>

          {/* Debug Mode Content */}
          {showDebug && (
            <div className="bb84-debug-container">
              <div className="bb84-educational-explainer">
                <h4>Quantum BB84 Protocol Steps:</h4>
                <ol>
                  <li><strong>Alice State Prep:</strong> Alice picks random bits (0/1) and random bases (+ rectilinear or × diagonal).</li>
                  <li><strong>Bob Photon Measurement:</strong> Bob measures incoming qubits with his own random basis choices.</li>
                  <li><strong>Basis Sifting:</strong> Where bases match (+ = + or × = ×), Bob measures the exact bit Alice sent. Discard mismatches.</li>
                  <li><strong>Key Generation:</strong> Sifted matching bits form the 256-bit AES-GCM secret key.</li>
                </ol>
              </div>

              {debugInfo && (
                <div className="bb84-stats-grid">
                  <div className="bb84-stat-card">
                    <span className="stat-value">{debugInfo.totalBitsSent}</span>
                    <span className="stat-label">Photons Transmitted</span>
                  </div>
                  <div className="bb84-stat-card">
                    <span className="stat-value">{debugInfo.siftedLength} bits</span>
                    <span className="stat-label">Sifted Key Length</span>
                  </div>
                  <div className="bb84-stat-card">
                    <span className="stat-value">{debugInfo.efficiencyPercentage}%</span>
                    <span className="stat-label">Sifting Efficiency</span>
                  </div>
                  <div className="bb84-stat-card">
                    <span className="stat-value">{(debugInfo.qber * 100).toFixed(1)}%</span>
                    <span className="stat-label">Quantum Error Rate (QBER)</span>
                  </div>
                </div>
              )}

              {fullDetails && (
                <div className="bb84-sample-table-wrapper">
                  <h5>Sample Quantum Photon Transmission Log (First 10 Photons)</h5>
                  <table className="bb84-sample-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Alice Bit</th>
                        <th>Alice Basis</th>
                        <th>Bob Basis</th>
                        <th>Bob Measure</th>
                        <th>Basis Match</th>
                        <th>Sifted Bit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fullDetails.aliceBits.slice(0, 10).map((bit, idx) => {
                        const aBasis = fullDetails.aliceBases[idx];
                        const bBasis = fullDetails.bobBases[idx];
                        const match = aBasis === bBasis;
                        const bMeasure = fullDetails.bobMeasurements[idx];

                        return (
                          <tr key={idx} className={match ? 'match-row' : 'mismatch-row'}>
                            <td>{idx + 1}</td>
                            <td>{bit}</td>
                            <td><span className="basis-tag">{aBasis}</span></td>
                            <td><span className="basis-tag">{bBasis}</span></td>
                            <td>{bMeasure}</td>
                            <td>
                              <span className={`match-badge ${match ? 'yes' : 'no'}`}>
                                {match ? 'MATCH ✓' : 'MISMATCH'}
                              </span>
                            </td>
                            <td>{match ? bit : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bb84-modal-footer">
          <button className="bb84-rekey-btn" onClick={onRegenerateKey}>
            🔄 Re-run BB84 Exchange
          </button>

          {!isConfirmedByMe ? (
            <button className="bb84-confirm-btn" onClick={onConfirm}>
              ✓ Confirm Fingerprint & Unlock Chat
            </button>
          ) : (
            <div className="bb84-confirmed-banner">
              ✓ You confirmed this fingerprint
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import '../component_css/BB84KeyModal.css';

interface BB84KeyModalProps {
  fingerprint: string;
  isConfirmedByMe: boolean;
  isConfirmedByOther: boolean;
  otherUserName: string;
  onConfirm: () => void;
  onRegenerateKey: () => void;
  onClose?: () => void;
}

export const BB84KeyModal: React.FC<BB84KeyModalProps> = ({
  fingerprint,
  isConfirmedByMe,
  isConfirmedByOther,
  otherUserName,
  onConfirm,
  onRegenerateKey,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyFingerprint = () => {
    void navigator.clipboard.writeText(fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

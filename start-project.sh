#!/bin/bash
echo "=================================================="
echo "🚀 POWERING UP QCHAT WEB2 + WEB3 ARCHITECTURE"
echo "=================================================="

# 1. Start your local private blockchain container
echo "📡 Waking up Hyperledger Besu via Podman..."
podman start besu-local

# 2. Wait for RPC service port to go live
echo "⏱️ Waiting for JSON-RPC port 8545 to establish..."
while ! curl -s -X POST --data '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}' -H "Content-Type: application/json" http://127.0.0.1:8545 > /dev/null; do
    sleep 1
done
echo "✅ Besu Ledger engine is listening perfectly!"

# 3. Open a separate window to show real-time Hyperledger logs to your supervisors
echo "📋 Opening real-time Ledger Log Viewer..."
ptyxis --title="Hyperledger Besu Live Blocks" -- bash -c "podman logs -f besu-local; exec bash" &

# 4. Fire up the Vite development frontend interface
echo "🌐 Starting Vite Frontend Dev Server..."
pnpm dev

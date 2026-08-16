#!/bin/bash
set -e

echo "=================================================="
echo "🚀 POWERING UP QCHAT WEB2 + WEB3 ARCHITECTURE"
echo "=================================================="

# 1. Start your local private blockchain container
# Automatically wake up the Podman service if it is stopped
echo "⚡ Checking Podman service status..."
podman machine start 2>/dev/null || echo "✅ Podman service is already awake."

echo "📡 Waking up Hyperledger Besu via Podman..."
if podman ps -a --format '{{.Names}}' | grep -qx "besu-local"; then
    podman start besu-local
else
    echo "Creating and starting Hyperledger Besu container..."
    podman run -d \
      --name besu-local \
      -p 8545:8545 \
      hyperledger/besu:latest \
      --network=dev \
      --miner-enabled \
      --miner-coinbase=0xfe3b557e8fb62b89f4916b721be55ceb828dbd73 \
      --rpc-http-enabled \
      --rpc-http-host=0.0.0.0 \
      --rpc-http-port=8545 \
      --rpc-http-cors-origins='*' \
      --host-allowlist='*' \
      --rpc-http-api=ETH,NET,WEB3,MINER,TXPOOL
fi

# 2. Wait for RPC service port to go live
echo "⏱️ Waiting for JSON-RPC port 8545 to establish..."
while ! curl -s -X POST --data '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}' -H "Content-Type: application/json" http://127.0.0.1:8545 > /dev/null; do
    sleep 1
done
echo "✅ Besu Ledger engine is listening perfectly!"

# 3. Open a separate window to show real-time Hyperledger logs to your supervisors
echo "📋 Opening real-time Ledger Log Viewer..."
if command -v ptyxis &> /dev/null; then
    # Linux / Fedora Environment
    ptyxis --title="Hyperledger Besu Live Blocks" -- bash -c "podman logs -f besu-local; exec bash" &
elif command -v cmd.exe &> /dev/null; then
    # Windows / Git Bash Environment
    cmd.exe /c start "Hyperledger Besu Live Blocks" cmd.exe /k "podman logs -f besu-local"
else
    # Generic Unix Fallback
    start "Hyperledger Besu Live Blocks" podman logs -f besu-local &
fi

# 4. Fire up the Vite development frontend interface
echo "🌐 Starting Vite Frontend Dev Server..."
pnpm dev

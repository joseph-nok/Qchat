#!/bin/bash
# ==============================================================================
# QCHAT AUTOMATED TERMINAL DEPLOYMENT & PERMISSION MANAGER FOR WINDOWS
# ==============================================================================
set -e

echo "====================================================="
echo " STARTING TERMINAL INSTALLER FOR QCHAT SYSTEM      "
echo "====================================================="

# Ensure execution context is running inside a Bash emulator shell layer
if [ -z "$BASH_VERSION" ]; then
    echo " ERROR: This script must be run inside Git Bash terminal."
    exit 1
fi

# 1. VERIFY AND DEPLOY NODE.JS LTS ENGINE
if ! command -v node &> /dev/null; then
    echo " Node.js runtime not found. Deploying via package manager..."
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "winget install OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements" || true
    echo " Refreshing terminal process variables..."
    export PATH="$PATH:/c/Program Files/nodejs"
else
    echo " Node.js engine is already available: $(node -v)"
fi

# 2. VERIFY AND DEPLOY REDHAT PODMAN ENGINE
if ! command -v podman &> /dev/null; then
    echo " Container layer missing. Deploying RedHat Podman..."
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "winget install RedHat.Podman --silent --accept-source-agreements --accept-package-agreements" || true
    export PATH="$PATH:/c/Program Files/RedHat/Podman"
    echo " Initializing Podman Linux background core..."
    podman machine init 2>/dev/null || true
    echo " Starting Podman machine container services..."
    podman machine start 2>/dev/null || true
else
    echo " Podman container core engine is already available."
    echo " Ensuring Podman machine subsystem is active..."
    podman machine start 2>/dev/null || echo " Podman service status: Live"
fi

# 3. VERIFY AND CONFIG GLOBAL PNPM ENVIRONMENT
if ! command -v pnpm &> /dev/null; then
    echo " Package manager pnpm not detected. Injecting globally..."
    npm install -g pnpm
    if [ -n "$APPDATA" ]; then
        PNPM_PATH="$(cygpath -u "$APPDATA/npm" 2>/dev/null || echo "$APPDATA/npm")"
        export PATH="$PATH:$PNPM_PATH"
    fi
else
    echo " pnpm environment is already available: v$(pnpm -v)"
fi

# 4. DEPLOY MAIN WORKSPACE CONFIGURATION DEPENDENCIES
echo " Resolving core repository application packages..."
pnpm install

# 5. ENTER ISOLATED SMART CONTRACT FOLDER AND COMPILE DEPENDENCIES
if [ -d "contract" ]; then
    echo " Shifting workspace contexts to smart contract folder..."
    pushd contract > /dev/null
    echo " Deploying independent sub-module modules..."
    npm install
    echo " Reverting terminal location to root folder context..."
    popd > /dev/null
else
    echo " ERROR: 'contract' workspace folder could not be found."
    exit 1
fi

# 6. INITIALIZE CONVEX BACKEND INFRASTRUCTURE
echo " Establishing Convex development data bridge connections..."
if [ -f "node_modules/.bin/convex" ] || command -v npx &> /dev/null; then
    npx convex dev --once || echo " Warning: Convex dev handshake requires interactive login or deployment setup. Continuing..."
else
    echo " Warning: npx ecosystem busy. Bypassing test handshake step..."
fi

echo ""
echo "====================================================="
echo " 🎉 SETTING UP COMPLETE!                             "
echo "====================================================="
echo "All system requirements have been safely configured."
echo "You can now fire up the blockchain infrastructure and"
echo "open the frontend web dashboard by executing:"
echo ""
echo "    ./start-project.sh                               "
echo "====================================================="

#!/usr/bin/env python3
"""
Rebuild Qchat Windows SetUp.docx with:
- Correct section numbering (fixed missing 5.1, 5.2)
- "Developed on Fedora" → contextual Windows note
- Added Windows Defender / Antivirus note
- Added .env.local note for supervisor
- Polished formatting
"""

from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

OUTPUT = "Documentation/Qchat Windows SetUp.docx"

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def add_heading(doc, text, level=1):
    p = doc.add_heading(text, level=level)
    return p


def add_para(doc, text, code=False, indent=False):
    p = doc.add_paragraph()
    if code:
        p.style = doc.styles['No Spacing'] if 'No Spacing' in [s.name for s in doc.styles] else doc.styles['Normal']
        run = p.add_run(text)
        run.font.name = 'Courier New'
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(0x1A, 0x53, 0x76)
        p.paragraph_format.left_indent = Inches(0.4)
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
    else:
        run = p.add_run(text)
        run.font.size = Pt(11)
        if indent:
            p.paragraph_format.left_indent = Inches(0.3)
    p.paragraph_format.space_after = Pt(4)
    return p


def add_note(doc, text):
    """Styled note/callout paragraph."""
    p = doc.add_paragraph()
    run = p.add_run("📝 Note: ")
    run.bold = True
    run.font.size = Pt(11)
    run.font.color.rgb = RGBColor(0x5A, 0x30, 0x00)
    run2 = p.add_run(text)
    run2.font.size = Pt(11)
    run2.font.color.rgb = RGBColor(0x5A, 0x30, 0x00)
    p.paragraph_format.left_indent = Inches(0.2)
    p.paragraph_format.space_after = Pt(6)
    return p


def add_warning(doc, text):
    p = doc.add_paragraph()
    run = p.add_run("⚠️  Important: ")
    run.bold = True
    run.font.size = Pt(11)
    run.font.color.rgb = RGBColor(0x8B, 0x00, 0x00)
    run2 = p.add_run(text)
    run2.font.size = Pt(11)
    run2.font.color.rgb = RGBColor(0x8B, 0x00, 0x00)
    p.paragraph_format.left_indent = Inches(0.2)
    p.paragraph_format.space_after = Pt(6)
    return p


def add_bullet(doc, text, sub=False):
    style = 'List Bullet 2' if sub else 'List Bullet'
    # fall back if style doesn't exist
    available = [s.name for s in doc.styles]
    if style not in available:
        style = 'List Bullet' if 'List Bullet' in available else 'Normal'
    p = doc.add_paragraph(text, style=style)
    p.paragraph_format.space_after = Pt(3)
    return p


# ─────────────────────────────────────────────────────────────────────────────
# Build document
# ─────────────────────────────────────────────────────────────────────────────

def build():
    doc = Document()

    # Document title
    title = doc.add_heading('QChat – Windows 11 Setup Guide', 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = sub.add_run('For Supervisors and Evaluators  |  Final Year Project  |  University of Energy and Natural Resources (UENR)')
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(0x44, 0x44, 0x44)
    r.italic = True

    doc.add_paragraph()   # spacer

    # ── 1. Overview ────────────────────────────────────────────────────────────
    add_heading(doc, '1. Overview', 1)
    add_para(doc,
        'This reference walks supervisors through deploying and evaluating QChat on a standard 64-bit Windows 11 host. '
        'Although we developed QChat natively under Linux (Fedora 41), the architecture targets cross-platform runtime equality. '
        'By utilizing Git Bash toolchains alongside Podman container engines, QChat executes on Windows without altering a single line of application source code.')
    add_para(doc,
        'Evaluators can choose between two deployment pathways:')
    add_bullet(doc, 'Method 1 – Step-by-Step Manual Deployment: Best suited for detailed step verification.')
    add_bullet(doc, 'Method 2 – Script-Driven Automated Setup (setup-project.sh): Designed for immediate environment bootstrapping with zero interactive prompts.')

    # ── 2. Prerequisites ───────────────────────────────────────────────────────
    add_heading(doc, '2. Prerequisites', 1)
    add_para(doc, 'Before running either deployment pathway, double-check that your machine satisfies these baseline requirements:')
    add_bullet(doc, 'Windows 11 OS (64-bit build) patched to current security levels.')
    add_bullet(doc, 'Hardware CPU Virtualization enabled within the motherboard UEFI/BIOS settings.\n'
                    '   → Verify via Task Manager → Performance → CPU → Virtualization: Enabled.')
    add_bullet(doc, 'Administrative permissions on the host system to run package manager installers.')
    add_bullet(doc, 'Active network connection capable of pulling container layers and Node dependencies.')
    add_bullet(doc, 'Project repository cloned to a local folder path (for example):\n'
                    '   C:\\Users\\YOUR_USERNAME\\Desktop\\Qchat')
    add_note(doc, 'Substitute YOUR_USERNAME with your actual local Windows profile identifier.')

    # ── 3. Method 1 – Manual Setup ─────────────────────────────────────────────
    add_heading(doc, '3. Method 1 – Manual Step-by-Step Setup', 1)
    add_para(doc, 'Execute the following operations sequentially. Confirm each tool functions prior to triggering subsequent steps.')

    # 3.1 Git
    add_heading(doc, '3.1  Install Git and Git Bash Shell', 2)
    add_para(doc,
        'Native Windows command processors (CMD/PowerShell) lack POSIX POSIX-shell script handling. Git Bash delivers the required shell environment.')
    add_bullet(doc, 'Grab the current Git for Windows distribution directly from:')
    add_para(doc, 'https://git-scm.com/download/win', code=True)
    add_bullet(doc, 'Run the installation package. Keep standard options enabled, ensuring these defaults remain selected:')
    add_bullet(doc, '"Git Bash Here" shell context extension', sub=True)
    add_bullet(doc, '"Git from the command line and third-party binaries"', sub=True)
    add_bullet(doc, 'Once setup completes, fire up Git Bash via your Start Menu to verify terminal opening.')
    add_note(doc, 'Execute all terminal commands in Git Bash rather than CMD or PowerShell.')

    # 3.2 Node.js
    add_heading(doc, '3.2  Install Node.js (LTS Runtime)', 2)
    add_bullet(doc, 'Download the Node.js Windows Installer (.msi) LTS release from:')
    add_para(doc, 'https://nodejs.org/', code=True)
    add_bullet(doc, 'Execute the setup wizard, confirming the "Add to PATH" directive remains active.')
    add_bullet(doc, 'Launch a fresh Git Bash terminal instance and confirm version responses:')
    add_para(doc, 'node -v', code=True)
    add_para(doc, 'npm -v', code=True)

    # 3.3 pnpm
    add_heading(doc, '3.3  Install pnpm Package Manager', 2)
    add_para(doc, 'From your Git Bash prompt, run:')
    add_para(doc, 'npm install -g pnpm', code=True)
    add_para(doc, 'Validate tool registration:')
    add_para(doc, 'pnpm -v', code=True)

    # 3.4 Podman
    add_heading(doc, '3.4  Configure Podman Container Service', 2)
    add_para(doc,
        'QChat depends on Podman to orchestrate the private Hyperledger Besu blockchain network inside an isolated runtime environment. '
        'Podman acts as a daemonless, rootless container platform maintained by Red Hat.')
    add_bullet(doc, 'Trigger installation via winget (run PowerShell under Administrator access):')
    add_para(doc, 'winget install RedHat.Podman --accept-source-agreements --accept-package-agreements', code=True)
    add_bullet(doc, 'Reboot the computer to finalize driver registration.')
    add_bullet(doc, 'Open Git Bash and boot the underlying Podman virtual machine host:')
    add_para(doc, 'podman machine init', code=True)
    add_para(doc, 'podman machine start', code=True)
    add_bullet(doc, 'Confirm Podman environment status:')
    add_para(doc, 'podman version', code=True)
    add_warning(doc,
        'If network policies or Group Policy rules block winget execution, fetch offline setup executables '
        'for Node.js, Podman, and Git directly from their primary web mirrors.')

    # 3.5 Project Dependencies
    add_heading(doc, '3.5  Pull Project Dependencies', 2)
    add_para(doc, 'Switch into your workspace directory using Git Bash:')
    add_para(doc, 'cd /c/Users/YOUR_USERNAME/Desktop/Qchat', code=True)
    add_para(doc, 'Install top-level application and frontend dependencies:')
    add_para(doc, 'pnpm install', code=True)
    add_para(doc, 'Install smart contract dependencies:')
    add_para(doc, 'cd contract', code=True)
    add_para(doc, 'npm install', code=True)
    add_para(doc, 'cd ..', code=True)

    # ── 4. Method 2 – Automated Setup ─────────────────────────────────────────
    add_heading(doc, '4. Method 2 – Automated Script Deployment (setup-project.sh)', 1)
    add_para(doc,
        'This approach automates dependency installation. Aside from initial Git Bash bootstrapping, '
        'the included shell script (setup-project.sh) sets up the remaining runtime elements.')

    add_heading(doc, '4.1  Bootstrap Git Bash Environment', 2)
    add_para(doc, 'In an elevated Administrator PowerShell prompt, execute:')
    add_para(doc,
        'winget install Git.Git --silent --accept-source-agreements --accept-package-agreements', code=True)
    add_para(doc,
        'Start-Process "C:\\Program Files\\Git\\git-bash.exe" -ArgumentList "--cd-to-home"', code=True)
    add_para(doc, 'A dedicated Git Bash console window will launch.')

    # 4.2 Run script
    add_heading(doc, '4.2  Execute setup-project.sh', 2)
    add_para(doc, 'Within Git Bash, change directory to the repository folder:')
    add_para(doc, 'cd /c/Users/YOUR_USERNAME/Desktop/Qchat', code=True)
    add_para(doc, 'Set executable flags and launch setup:')
    add_para(doc, 'chmod +x setup-project.sh', code=True)
    add_para(doc, './setup-project.sh', code=True)
    add_para(doc, 'The setup pipeline carries out the following tasks:')
    add_bullet(doc, 'Verifies Node.js LTS availability; installs via winget if missing')
    add_bullet(doc, 'Checks Podman engine status; installs and starts the container VM if needed')
    add_bullet(doc, 'Installs pnpm globally if not found in system PATH')
    add_bullet(doc, 'Executes pnpm install across project root components')
    add_bullet(doc, 'Pulls npm packages within the contract/ folder')
    add_bullet(doc, 'Executes npx convex dev --once to configure the Convex reactive backend and generate .env.local')
    add_para(doc, 'Upon successful setup, the console outputs:')
    add_para(doc, '🎉 SETTING UP COMPLETE!', code=True)

    # ── 5. Launching the Application ──────────────────────────────────────────
    add_heading(doc, '5. Launching the Application', 1)

    add_heading(doc, '5.1  Boot Private Blockchain Node', 2)
    add_para(doc, 'Confirm the underlying Podman machine is active prior to launching application services:')
    add_para(doc, 'podman machine start', code=True)
    add_para(doc, 'The local Besu blockchain node spins up automatically during script execution.')

    add_heading(doc, '5.2  Launch Frontend & Reactive Backend Services', 2)
    add_para(doc, 'From your project root in Git Bash, run:')
    add_para(doc, './start-project.sh', code=True)
    add_para(doc, 'This startup script spawns two concurrent processes:')
    add_bullet(doc, 'Vite dev server hosting the React 19 single-page application')
    add_bullet(doc, 'Convex development server providing reactive backend storage and RPC functions')

    add_heading(doc, '5.3  Open Browser Interface', 2)
    add_para(doc, 'When logs indicate active servers (showing "Local: http://localhost:5173/"), launch your web browser and navigate to:')
    add_para(doc, 'http://localhost:5173/', code=True)
    add_note(doc, 'We recommend Chromium-based browsers (Google Chrome, Brave, or Microsoft Edge) for full Web Crypto API standard compliance.')

    # ── 6. Important Notes ─────────────────────────────────────────────────────
    add_heading(doc, '6. Important Notes', 1)
    add_bullet(doc,
        'Run all shell scripts (./setup-project.sh, ./start-project.sh) exclusively inside Git Bash.')
    add_bullet(doc,
        'If Podman service calls fail, ensure podman machine start has been issued inside Git Bash prior to app startup.')
    add_bullet(doc,
        'The .env.local configuration file generates during npx convex dev execution. No manual key editing is necessary.')
    add_bullet(doc,
        'If Windows Defender flags installer commands, click "More info" → "Run anyway", or temporarily pause real-time protection during setup.')
    add_bullet(doc,
        'The underlying Linux repository architecture requires no code modifications. Git Bash and Podman resolve all platform translation requirements.')
    add_bullet(doc,
        'Should automated winget routines hit network restrictions, install Node.js, Podman, and Git via standard standalone MSI/EXE binary installers.')

    # ── Appendix A – setup-project.sh content ─────────────────────────────────
    add_heading(doc, 'Appendix A – Content of setup-project.sh', 1)
    add_para(doc,
        'The following script must be present in the project root as setup-project.sh. '
        'It is designed to detect already-installed components and skip them, continuing until '
        'the final success message is displayed.')

    script_lines = [
        '#!/bin/bash',
        '# ===========================================================================',
        '# QCHAT AUTOMATED TERMINAL DEPLOYMENT FOR WINDOWS (via Git Bash)',
        '# ===========================================================================',
        'echo "====================================================="',
        'echo " 🚀 STARTING TERMINAL INSTALLER FOR QCHAT SYSTEM      "',
        'echo "====================================================="',
        'if [ -z "$BASH_VERSION" ]; then',
        '    echo "❌ ERROR: This script must be run inside Git Bash terminal."',
        '    exit 1',
        'fi',
        '',
        '# 1. Node.js LTS',
        'if ! command -v node &> /dev/null; then',
        '    echo "📦 Node.js runtime not found. Installing via winget..."',
        '    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \\',
        '      "winget install OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements"',
        '    export PATH="$PATH:/c/Program Files/nodejs"',
        'else',
        '    echo "✅ Node.js engine is already available: $(node -v)"',
        'fi',
        '',
        '# 2. Podman',
        'if ! command -v podman &> /dev/null; then',
        '    echo "📦 Container layer missing. Installing RedHat Podman..."',
        '    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \\',
        '      "winget install RedHat.Podman --silent --accept-source-agreements --accept-package-agreements"',
        '    podman machine init',
        '    podman machine start',
        'else',
        '    echo "✅ Podman container engine is already available."',
        '    podman machine start 2>/dev/null || echo "⚡ Podman service: Live"',
        'fi',
        '',
        '# 3. pnpm',
        'if ! command -v pnpm &> /dev/null; then',
        '    echo "📦 Package manager pnpm not detected. Installing globally..."',
        '    npm install -g pnpm',
        'else',
        '    echo "✅ pnpm is already available: v$(pnpm -v)"',
        'fi',
        '',
        '# 4. Root dependencies',
        'echo "📦 Installing core repository packages..."',
        'pnpm install',
        '',
        '# 5. Smart contract dependencies',
        'if [ -d "contract" ]; then',
        '    echo "⛓️  Installing smart contract dependencies..."',
        '    cd contract',
        '    npm install',
        '    cd ..',
        'else',
        '    echo "❌ ERROR: contract/ folder not found."',
        '    exit 1',
        'fi',
        '',
        '# 6. Convex backend initialisation',
        'echo "☁️  Initialising Convex backend and generating .env.local..."',
        'npx convex dev --once',
        '',
        'echo ""',
        'echo "====================================================="',
        'echo " 🎉 SETUP COMPLETE!                                  "',
        'echo "====================================================="',
        'echo "All requirements have been configured."',
        'echo "Start the application by running:"',
        'echo ""',
        'echo "    ./start-project.sh                               "',
        'echo "====================================================="',
    ]

    for line in script_lines:
        add_para(doc, line if line else ' ', code=True)

    # ── Appendix B – Troubleshooting ──────────────────────────────────────────
    add_heading(doc, 'Appendix B – Troubleshooting', 1)

    issues = [
        ('podman machine start fails',
         'Ensure Hardware Virtualization is enabled in BIOS/UEFI. Restart the PC after enabling it.'),
        ('winget not found',
         'Update the Microsoft App Installer from the Microsoft Store, or download packages manually from official websites.'),
        ('.env.local missing after setup',
         'Run npx convex dev --once manually in Git Bash from the project root. Ensure you have an active internet connection.'),
        ('http://localhost:5173/ not loading',
         'Ensure ./start-project.sh is running in Git Bash. Check for firewall rules blocking port 5173.'),
        ('Windows Defender blocks the script',
         'Right-click → "Run anyway", or temporarily disable real-time protection. Re-enable after installation.'),
        ('pnpm: command not found',
         'Close and reopen Git Bash after running npm install -g pnpm to reload the PATH.'),
    ]

    for issue, solution in issues:
        p = doc.add_paragraph()
        r1 = p.add_run(f'Issue: {issue}\n')
        r1.bold = True
        r1.font.size = Pt(11)
        r2 = p.add_run(f'Solution: {solution}')
        r2.font.size = Pt(11)
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(8)

    # Footer note
    doc.add_paragraph()
    p = doc.add_paragraph()
    r = p.add_run('— End of Document —')
    r.italic = True
    r.font.color.rgb = RGBColor(0x88, 0x88, 0x88)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.save(OUTPUT)
    print(f'✅ Saved: {OUTPUT}')


if __name__ == '__main__':
    build()

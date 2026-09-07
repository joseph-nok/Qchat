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
        'This guide explains how to run the QChat project on a clean Windows 11 machine. '
        'QChat was developed on a Linux workstation (Fedora 41) and is designed to run on '
        'Windows through the Git Bash environment and Podman container runtime — no source-code '
        'changes are required. The application behaves identically on both operating systems.')
    add_para(doc,
        'Two installation methods are provided:')
    add_bullet(doc, 'Method 1 – Manual Step-by-Step: Recommended for supervisors who want full visibility over every step.')
    add_bullet(doc, 'Method 2 – Automated Script (setup-project.sh): Recommended for rapid deployment with minimal manual effort.')

    # ── 2. Prerequisites ───────────────────────────────────────────────────────
    add_heading(doc, '2. Prerequisites', 1)
    add_para(doc, 'Before beginning either method, confirm the following conditions are met:')
    add_bullet(doc, 'Windows 11 (64-bit) with all pending updates installed.')
    add_bullet(doc, 'Hardware Virtualization is enabled in the BIOS/UEFI.\n'
                    '   → Verify in Task Manager → Performance → CPU → Virtualization: Enabled.')
    add_bullet(doc, 'Administrator privileges are available for initial package installation.')
    add_bullet(doc, 'Stable internet connection for downloading packages and container images.')
    add_bullet(doc, 'The project folder is located at a path such as:\n'
                    '   C:\\Users\\YOUR_USERNAME\\Desktop\\Qchat')
    add_note(doc, 'Replace YOUR_USERNAME with the actual Windows account name wherever it appears in this guide.')

    # ── 3. Method 1 – Manual Setup ─────────────────────────────────────────────
    add_heading(doc, '3. Method 1 – Manual Step-by-Step Setup', 1)
    add_para(doc, 'Follow the steps below in order. Verify each component before proceeding to the next.')

    # 3.1 Git
    add_heading(doc, '3.1  Install Git and Git Bash', 2)
    add_para(doc,
        'Windows cannot execute .sh scripts natively. Git Bash provides the required Bash shell environment.')
    add_bullet(doc, 'Download the official Git for Windows installer from:')
    add_para(doc, 'https://git-scm.com/download/win', code=True)
    add_bullet(doc, 'Run the installer. Accept all defaults, ensuring these options remain checked:')
    add_bullet(doc, '"Git Bash Here" context menu option', sub=True)
    add_bullet(doc, '"Git from the command line and also from 3rd-party software"', sub=True)
    add_bullet(doc, 'After installation, open Git Bash from the Start Menu and confirm it launches successfully.')
    add_note(doc, 'All subsequent commands in this guide must be typed into Git Bash, not CMD or PowerShell.')

    # 3.2 Node.js
    add_heading(doc, '3.2  Install Node.js (LTS)', 2)
    add_bullet(doc, 'Download the Windows Installer (.msi) – LTS version from:')
    add_para(doc, 'https://nodejs.org/', code=True)
    add_bullet(doc, 'Run the installer. Ensure the "Add to PATH" checkbox remains selected.')
    add_bullet(doc, 'Open a new Git Bash window and verify both commands print version numbers:')
    add_para(doc, 'node -v', code=True)
    add_para(doc, 'npm -v', code=True)

    # 3.3 pnpm
    add_heading(doc, '3.3  Install pnpm Globally', 2)
    add_para(doc, 'In Git Bash, run:')
    add_para(doc, 'npm install -g pnpm', code=True)
    add_para(doc, 'Verify installation:')
    add_para(doc, 'pnpm -v', code=True)

    # 3.4 Podman
    add_heading(doc, '3.4  Install and Initialise Podman', 2)
    add_para(doc,
        'Podman is used to run the local Hyperledger Besu blockchain container. '
        'It is a Docker-compatible, rootless container engine provided by Red Hat.')
    add_bullet(doc, 'Install via winget (in PowerShell as Administrator):')
    add_para(doc, 'winget install RedHat.Podman --accept-source-agreements --accept-package-agreements', code=True)
    add_bullet(doc, 'Restart the computer after installation completes.')
    add_bullet(doc, 'Open Git Bash and initialise the Podman virtual machine:')
    add_para(doc, 'podman machine init', code=True)
    add_para(doc, 'podman machine start', code=True)
    add_bullet(doc, 'Confirm successful installation:')
    add_para(doc, 'podman version', code=True)
    add_warning(doc,
        'If winget is unavailable or blocked by your institution\'s Group Policy, download and install '
        'Node.js, Podman, and Git manually from their official websites using the graphical installers.')

    # 3.5 Project Dependencies
    add_heading(doc, '3.5  Install Project Dependencies', 2)
    add_para(doc, 'Open Git Bash and navigate to the project root:')
    add_para(doc, 'cd /c/Users/YOUR_USERNAME/Desktop/Qchat', code=True)
    add_para(doc, 'Install root and frontend packages:')
    add_para(doc, 'pnpm install', code=True)
    add_para(doc, 'Install smart-contract dependencies:')
    add_para(doc, 'cd contract', code=True)
    add_para(doc, 'npm install', code=True)
    add_para(doc, 'cd ..', code=True)

    # ── 4. Method 2 – Automated Setup ─────────────────────────────────────────
    add_heading(doc, '4. Method 2 – Automated Setup with setup-project.sh', 1)
    add_para(doc,
        'This method minimises manual work. Only Git Bash needs to be installed manually; '
        'everything else is handled by the provided setup script (setup-project.sh).')

    add_heading(doc, '4.1  Bootstrap Git Bash', 2)
    add_para(doc, 'Open Windows PowerShell as Administrator and run:')
    add_para(doc,
        'winget install Git.Git --silent --accept-source-agreements --accept-package-agreements', code=True)
    add_para(doc,
        'Start-Process "C:\\Program Files\\Git\\git-bash.exe" -ArgumentList "--cd-to-home"', code=True)
    add_para(doc, 'A new Git Bash window will open automatically.')

    add_heading(doc, '4.2  Run the Automated Setup Script', 2)
    add_para(doc, 'In the Git Bash window, navigate to the project root:')
    add_para(doc, 'cd /c/Users/YOUR_USERNAME/Desktop/Qchat', code=True)
    add_para(doc, 'Make the script executable and run it:')
    add_para(doc, 'chmod +x setup-project.sh', code=True)
    add_para(doc, './setup-project.sh', code=True)
    add_para(doc, 'The script will automatically:')
    add_bullet(doc, 'Detect and install Node.js LTS if missing')
    add_bullet(doc, 'Detect and install Podman if missing, then initialise and start the Podman virtual machine')
    add_bullet(doc, 'Install pnpm globally if missing')
    add_bullet(doc, 'Run pnpm install at the project root')
    add_bullet(doc, 'Install dependencies inside the contract/ folder')
    add_bullet(doc, 'Initialise the Convex development backend (npx convex dev --once) and generate the .env.local configuration file')
    add_para(doc, 'When finished, the terminal displays:')
    add_para(doc, '🎉 SETTING UP COMPLETE!', code=True)

    # ── 5. Launching the Application ──────────────────────────────────────────
    add_heading(doc, '5. Launching the Application', 1)

    add_heading(doc, '5.1  Start the Blockchain Node', 2)
    add_para(doc, 'Ensure the Podman machine is running before launching the application:')
    add_para(doc, 'podman machine start', code=True)
    add_para(doc, 'The Hyperledger Besu node starts automatically when the project script runs.')

    add_heading(doc, '5.2  Start the Frontend and Backend', 2)
    add_para(doc, 'In Git Bash, from the project root, run:')
    add_para(doc, './start-project.sh', code=True)
    add_para(doc, 'This script concurrently starts:')
    add_bullet(doc, 'The Vite development server (React 19 frontend)')
    add_bullet(doc, 'The Convex local backend (serverless functions)')

    add_heading(doc, '5.3  Access the Application', 2)
    add_para(doc, 'Once both processes are running (you will see "Local: http://localhost:5173/"), open a web browser and navigate to:')
    add_para(doc, 'http://localhost:5173/', code=True)
    add_note(doc, 'Use a Chromium-based browser (Google Chrome or Microsoft Edge) for best compatibility with the Web Crypto API used by QChat.')

    # ── 6. Important Notes ─────────────────────────────────────────────────────
    add_heading(doc, '6. Important Notes', 1)
    add_bullet(doc,
        'Always use Git Bash (not PowerShell or CMD) when executing .sh scripts such as '
        './setup-project.sh and ./start-project.sh.')
    add_bullet(doc,
        'If the Podman machine is not running, execute podman machine start in Git Bash before launching the project.')
    add_bullet(doc,
        'The .env.local file is generated automatically by npx convex dev during setup. '
        'No manual Convex configuration is required.')
    add_bullet(doc,
        'If Windows Defender SmartScreen or antivirus software blocks the installer scripts, '
        'right-click the installer → "Run anyway" or temporarily disable real-time protection, '
        'then re-enable it after installation.')
    add_bullet(doc,
        'The original Linux/Fedora codebase remains unmodified. All Windows compatibility is '
        'handled by Git Bash, Podman Desktop, and the provided shell scripts.')
    add_bullet(doc,
        'If winget is unavailable or blocked by Group Policy, the packages (Node.js, Podman, Git) '
        'can be downloaded manually from their official websites and installed via graphical installers.')

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

#!/usr/bin/env python3
"""
Build QChat presentation.pptx properly using a fresh Presentation() object.
We copy slide_layouts from the template for colour/font consistency,
then build all 12 slides from scratch.
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

# ── Colour palette pulled from UENR template (green/white/dark) ──────────────
GREEN_DARK   = RGBColor(0x00, 0x5C, 0x2E)
GREEN_MID    = RGBColor(0x00, 0x7A, 0x3D)
GREEN_LIGHT  = RGBColor(0xD4, 0xED, 0xDA)
GOLD         = RGBColor(0xFF, 0xC0, 0x00)
WHITE        = RGBColor(0xFF, 0xFF, 0xFF)
DARK_TEXT    = RGBColor(0x1A, 0x1A, 0x1A)
LIGHT_BG     = RGBColor(0xF5, 0xF7, 0xF5)

TEMPLATE_PATH = "Documentation/UENR_POWERPOINT_TEMPLATE (1) (1).pptx"
OUTPUT_PATH   = "Documentation/presentation.pptx"

# ─────────────────────────────────────────────────────────────────────────────
# Helper utilities
# ─────────────────────────────────────────────────────────────────────────────

def add_rect(slide, left, top, width, height, fill_rgb=None, line_rgb=None, round_corners=False):
    shape_id = 1  # MSO_CONNECTOR_TYPE.STRAIGHT → use 1 for rectangle
    if round_corners:
        shape_id = 5   # rounded rect
    shape = slide.shapes.add_shape(
        shape_id,
        Inches(left), Inches(top), Inches(width), Inches(height)
    )
    if fill_rgb:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_rgb
    else:
        shape.fill.background()
    if line_rgb:
        shape.line.color.rgb = line_rgb
        shape.line.width = Pt(0.75)
    else:
        shape.line.fill.background()
    return shape


def add_textbox(slide, text, left, top, width, height,
                font_size=18, bold=False, color=DARK_TEXT,
                align=PP_ALIGN.LEFT, font_name="Calibri", italic=False):
    txBox = slide.shapes.add_textbox(
        Inches(left), Inches(top), Inches(width), Inches(height)
    )
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    run.font.name = font_name
    return txBox


def add_bullet_box(slide, lines, left, top, width, height,
                   font_size=13, color=DARK_TEXT, font_name="Calibri",
                   line_spacing_pt=6):
    """Add a text box with multiple bullet-point lines."""
    txBox = slide.shapes.add_textbox(
        Inches(left), Inches(top), Inches(width), Inches(height)
    )
    tf = txBox.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_before = Pt(line_spacing_pt)
        p.alignment = PP_ALIGN.LEFT
        run = p.add_run()
        # Sub-bullets start with "○"
        if line.startswith("○"):
            run.text = "        ○ " + line.lstrip("○ ")
            run.font.size = Pt(font_size - 1)
            run.font.color.rgb = RGBColor(0x44, 0x44, 0x44)
        elif line.startswith("**") and line.endswith("**"):
            run.text = line.strip("*")
            run.font.bold = True
            run.font.size = Pt(font_size)
            run.font.color.rgb = GREEN_DARK
        else:
            run.text = "  • " + line
            run.font.size = Pt(font_size)
            run.font.color.rgb = color
        run.font.name = font_name
    return txBox


def add_col_bullet_box(slide, title, lines, left, top, width, height,
                       font_size=12, col_color=GREEN_DARK):
    """Column with a bold title then bullets below."""
    add_textbox(slide, title, left, top, width, 0.45,
                font_size=13, bold=True, color=col_color, font_name="Calibri")
    add_rect(slide, left, top + 0.42, width, 0.035, fill_rgb=col_color)
    add_bullet_box(slide, lines, left, top + 0.52, width, height - 0.55,
                   font_size=font_size, font_name="Calibri")


# ─────────────────────────────────────────────────────────────────────────────
# Standard page chrome (header bar + bottom bar + sidebar)
# ─────────────────────────────────────────────────────────────────────────────

W, H = 13.33, 7.5   # widescreen inches

def add_chrome(slide, title, slide_num="", bg_rgb=WHITE):
    """Add the standard header, footer and sidebar chrome to a content slide."""
    # Background
    add_rect(slide, 0, 0, W, H, fill_rgb=bg_rgb)
    # Top gold stripe
    add_rect(slide, 0, 0, W, 0.055, fill_rgb=GOLD)
    # Top green bar
    add_rect(slide, 0, 0.055, W, 0.98, fill_rgb=GREEN_DARK)
    # Bottom gold bar
    add_rect(slide, 0, H - 0.07, W, 0.07, fill_rgb=GOLD)
    # Left sidebar
    add_rect(slide, 0, 1.035, 0.09, H - 1.1, fill_rgb=GREEN_DARK)
    # Slide title
    add_textbox(slide, title, 0.35, 0.12, W - 1.1, 0.75,
                font_size=22, bold=True, color=WHITE,
                align=PP_ALIGN.LEFT, font_name="Calibri")
    # Slide number badge
    if slide_num:
        add_rect(slide, W - 0.72, 0.12, 0.52, 0.52, fill_rgb=GOLD)
        add_textbox(slide, slide_num, W - 0.72, 0.14, 0.52, 0.45,
                    font_size=13, bold=True, color=GREEN_DARK,
                    align=PP_ALIGN.CENTER, font_name="Calibri")
    # UENR footer label
    add_textbox(slide, "QChat | UENR Computer Science & Informatics | 2026",
                0.15, H - 0.065, 8.0, 0.06,
                font_size=7, color=GREEN_DARK, font_name="Calibri")


# ─────────────────────────────────────────────────────────────────────────────
# Individual slide builders
# ─────────────────────────────────────────────────────────────────────────────

def slide_blank(prs):
    blank_layout = prs.slide_layouts[6]  # Blank layout
    return prs.slides.add_slide(blank_layout)


def build_title_slide(prs):
    slide = slide_blank(prs)

    # Full dark green background
    add_rect(slide, 0, 0, W, H, fill_rgb=GREEN_DARK)
    # Top gold stripe
    add_rect(slide, 0, 0, W, 0.08, fill_rgb=GOLD)
    # Bottom gold stripe
    add_rect(slide, 0, H - 0.08, W, 0.08, fill_rgb=GOLD)

    # Left darker panel
    add_rect(slide, 0, 0.08, 4.6, H - 0.16, fill_rgb=RGBColor(0x00, 0x3D, 0x20))

    # Diagonal gold accent line (thin rect rotated via shape—use two rects instead)
    add_rect(slide, 4.6, 0.08, 0.06, H - 0.16, fill_rgb=GOLD)

    # University name (top-left)
    add_textbox(slide, "UNIVERSITY OF ENERGY AND NATURAL RESOURCES",
                0.18, 0.2, 4.2, 0.5,
                font_size=7.5, bold=True, color=GOLD, font_name="Calibri")
    add_textbox(slide, "Department of Computer Science and Informatics",
                0.18, 0.6, 4.2, 0.4,
                font_size=9, color=GREEN_LIGHT, font_name="Calibri")

    # Divider
    add_rect(slide, 0.18, 0.95, 3.9, 0.02, fill_rgb=GOLD)

    # Student names block (left panel)
    names_data = [
        ("Korang Bright Agyei", "UEB3501222"),
        ("Mohammed Idris Adam", "UEB3501022"),
        ("Benaiah Amarh Anang", "UEB3512522"),
        ("Osei Nana Kwaku", "UEB3509022"),
    ]
    y = 1.1
    for name, idx in names_data:
        add_textbox(slide, name, 0.18, y, 4.2, 0.34,
                    font_size=12, bold=True, color=WHITE, font_name="Calibri")
        add_textbox(slide, idx, 0.18, y + 0.32, 4.2, 0.28,
                    font_size=10, color=GREEN_LIGHT, font_name="Calibri")
        y += 0.72

    # Final year project label (left panel bottom)
    add_rect(slide, 0.18, 6.55, 4.0, 0.035, fill_rgb=GOLD)
    add_textbox(slide, "Final Year Project Presentation",
                0.18, 6.65, 4.0, 0.4,
                font_size=9, color=GOLD, font_name="Calibri", align=PP_ALIGN.CENTER)

    # Main project title (right panel)
    add_textbox(slide,
                "QChat for Institutional\nMessage for Students\nand Lecturers",
                4.85, 0.9, 8.1, 3.0,
                font_size=34, bold=True, color=WHITE,
                align=PP_ALIGN.LEFT, font_name="Calibri")

    # Gold underline
    add_rect(slide, 4.85, 3.85, 5.5, 0.07, fill_rgb=GOLD)

    # Subtitle
    add_textbox(slide,
                "A Hybrid Web2/Web3 Secure Institutional Communication Platform\n"
                "with Blockchain Audit Trail and Quantum-Inspired Encryption",
                4.85, 4.0, 8.1, 1.0,
                font_size=13, color=GREEN_LIGHT, font_name="Calibri")

    # Supervisor block (right panel)
    add_textbox(slide, "SUPERVISOR", 4.85, 5.2, 3.5, 0.35,
                font_size=9, bold=True, color=GOLD, font_name="Calibri")
    add_textbox(slide, "Dr Peter Nimbe", 4.85, 5.5, 3.5, 0.4,
                font_size=14, color=WHITE, font_name="Calibri")

    # Date
    add_textbox(slide, "11th September, 2026", 4.85, 6.1, 4.0, 0.4,
                font_size=11, color=GREEN_LIGHT, font_name="Calibri")

    return slide


def build_toc_slide(prs):
    slide = slide_blank(prs)

    add_rect(slide, 0, 0, W, H, fill_rgb=LIGHT_BG)
    add_rect(slide, 0, 0, W, 0.06, fill_rgb=GOLD)
    add_rect(slide, 0, H - 0.06, W, 0.06, fill_rgb=GOLD)
    add_rect(slide, 0, 0.06, 0.38, H - 0.12, fill_rgb=GREEN_DARK)

    add_textbox(slide, "Table of Contents",
                0.58, 0.18, 6.0, 0.72,
                font_size=28, bold=True, color=GREEN_DARK, font_name="Calibri")
    add_rect(slide, 0.58, 0.88, 4.5, 0.055, fill_rgb=GOLD)

    toc = [
        ("01", "Background & Introduction"),
        ("02", "Problem Statement"),
        ("03", "Aim & Objectives"),
        ("04", "Related Work & Existing Systems"),
        ("05", "Methodology & Technology Stack"),
        ("06", "System Architecture & Design"),
        ("07", "Testing & Results"),
        ("08", "Limitations & Future Work"),
        ("09", "Conclusion"),
    ]

    col1 = toc[:5]
    col2 = toc[5:]

    # Column 1
    for i, (num, label) in enumerate(col1):
        y = 1.1 + i * 1.0
        add_rect(slide, 0.55, y, 0.65, 0.65, fill_rgb=GREEN_DARK, round_corners=True)
        add_textbox(slide, num, 0.55, y + 0.07, 0.65, 0.5,
                    font_size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(slide, label, 1.28, y + 0.12, 5.3, 0.45,
                    font_size=13, color=DARK_TEXT, font_name="Calibri")
        if i < len(col1) - 1:
            add_rect(slide, 0.58, y + 0.72, 5.9, 0.012, fill_rgb=GREEN_LIGHT)

    # Column 2
    for i, (num, label) in enumerate(col2):
        y = 1.1 + i * 1.0
        add_rect(slide, 7.1, y, 0.65, 0.65, fill_rgb=GREEN_MID, round_corners=True)
        add_textbox(slide, num, 7.1, y + 0.07, 0.65, 0.5,
                    font_size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(slide, label, 7.83, y + 0.12, 5.2, 0.45,
                    font_size=13, color=DARK_TEXT, font_name="Calibri")
        if i < len(col2) - 1:
            add_rect(slide, 7.13, y + 0.72, 5.7, 0.012, fill_rgb=GREEN_LIGHT)

    # Footer
    add_textbox(slide, "QChat | UENR Computer Science & Informatics | 2026",
                0.5, H - 0.055, 9.0, 0.055,
                font_size=7, color=DARK_TEXT, font_name="Calibri")

    return slide


def build_background_slide(prs):
    slide = slide_blank(prs)
    add_chrome(slide, "1. Background & Introduction", slide_num="01")

    bullets = [
        "Higher education workflows are increasingly dependent on digital channels for student-faculty interactions",
        "Commercial communication tools (WhatsApp, Slack, email) lack institutional role verification, auditability, and tamper evidence",
        "Existing systems fail to pair real-time messaging performance with permissioned blockchain immutability",
        "Academic disputes over tampered assignment submissions, altered timestamp records, or modified grades lack cryptographic proof mechanisms",
        "QChat resolves this vulnerability by combining high-speed Web2 messaging with Web3 blockchain logging",
        "Engineered as a Final Year Project within the Department of Computer Science and Informatics at UENR",
    ]
    add_bullet_box(slide, bullets, 0.2, 1.15, W - 0.4, H - 1.35,
                   font_size=14, line_spacing_pt=10)
    return slide


def build_problem_slide(prs):
    slide = slide_blank(prs)
    add_chrome(slide, "2. Problem Statement", slide_num="02")

    bullets = [
        "**Problem 1 — Performance vs. Verification Tension**",
        "○ Real-time chat requires sub-second latency, while public blockchains introduce high latency and gas costs",
        "**Problem 2 — Vulnerability to Content & Identity Tampering**",
        "○ Centralized databases allow database admins or compromised accounts to alter communication logs without detection",
        "**Problem 3 — Vulnerability to Future Quantum Cryptanalysis**",
        "○ Legacy RSA and ECC algorithms risk compromise by quantum decryption capabilities within the next decade",
        "**Systemic Impact**",
        "○ Administrative friction, dispute resolution bottlenecks, and exposure to document fraud across higher education institutions",
    ]
    add_bullet_box(slide, bullets, 0.2, 1.15, W - 0.4, H - 1.35,
                   font_size=13.5, line_spacing_pt=8)
    return slide


def build_objectives_slide(prs):
    slide = slide_blank(prs)
    add_chrome(slide, "3. Project Objectives", slide_num="03")

    # Aim box
    add_rect(slide, 0.2, 1.12, W - 0.4, 0.75, fill_rgb=GREEN_LIGHT, round_corners=True)
    add_textbox(slide,
                "AIM: Architect, implement, and benchmark a hybrid Web2/Web3 institutional messaging system "
                "equipped with blockchain audit trails and client-side encryption.",
                0.35, 1.2, W - 0.7, 0.58,
                font_size=13, bold=False, color=GREEN_DARK, font_name="Calibri")

    left_items = [
        "Obj 1 — Real-Time Engine: React 19 + TypeScript + Convex backend hosting instant chats and community Q&A forums",
        "Obj 2 — Client Confidentiality: Browser-native Web Crypto API driving RSA-OAEP 2048 and AES-GCM 256 encryption",
        "Obj 3 — Blockchain Audit Trail: Solidity smart contract on Hyperledger Besu recording SHA-256 message hashes",
    ]
    right_items = [
        "Obj 4 — Quantum Simulation: BB84 QKD TypeScript module computing QBER and deriving 256-bit keys",
        "Obj 5 — Identity Workflow: Admin verification pipeline mapping staff/student credentials onto Besu ledger",
        "Obj 6 — Empirical Evaluation: Cryptographic unit tests, end-to-end integration runs, and UAT field evaluation",
    ]

    add_col_bullet_box(slide, "Objectives 1–3", left_items, 0.2, 2.05, 6.35, 4.7, font_size=12)
    add_rect(slide, 6.66, 2.05, 0.04, 4.7, fill_rgb=GREEN_LIGHT)
    add_col_bullet_box(slide, "Objectives 4–6", right_items, 6.82, 2.05, 6.2, 4.7, font_size=12)
    return slide


def build_related_work_slide(prs):
    slide = slide_blank(prs)
    add_chrome(slide, "4. Comparative Literature Review", slide_num="04")

    systems = [
        ("MS Teams / Slack", "High real-time speed — but centralized database ownership, zero cryptographic verification, and no client-controlled E2EE"),
        ("Signal / WhatsApp", "Strong E2E encryption — but lacks institutional role governance, tamper-proof administrative logs, and academic metadata verification"),
        ("IPFS Networks", "Decentralized storage — but suffers high file retrieval latency, zero native messaging UX, and complex key management"),
        ("Hyperledger Fabric Platforms", "Immutable ledger auditing — but requires complex multi-organization node setups, lacks E2EE chat, and yields low interactive throughput"),
    ]

    y = 1.15
    colors = [GREEN_DARK, GREEN_MID, RGBColor(0x00, 0x66, 0x35), RGBColor(0x33, 0x88, 0x55)]
    for i, (sys_name, limitation) in enumerate(systems):
        add_rect(slide, 0.2, y, 2.2, 0.85, fill_rgb=colors[i])
        add_textbox(slide, sys_name, 0.25, y + 0.08, 2.1, 0.7,
                    font_size=11, bold=True, color=WHITE, font_name="Calibri", align=PP_ALIGN.CENTER)
        add_textbox(slide, limitation, 2.55, y + 0.1, 10.5, 0.65,
                    font_size=12, color=DARK_TEXT, font_name="Calibri")
        if i < len(systems) - 1:
            add_rect(slide, 0.2, y + 0.92, W - 0.4, 0.01, fill_rgb=GREEN_LIGHT)
        y += 1.05

    # Key gap box
    add_rect(slide, 0.2, y + 0.05, W - 0.4, 0.7, fill_rgb=RGBColor(0xFF, 0xF0, 0xC0))
    add_textbox(slide,
                "Research Contribution: QChat bridges the gap by linking (a) sub-200ms Convex WebSocket messaging, "
                "(b) zero-gas Besu ledger verification, (c) WebCrypto client-side E2EE, and (d) BB84 QKD simulation "
                "in a unified web application.",
                0.3, y + 0.1, W - 0.6, 0.6,
                font_size=12, bold=False, color=RGBColor(0x5A, 0x40, 0x00), font_name="Calibri")
    return slide


def build_methodology_slide(prs):
    slide = slide_blank(prs)
    add_chrome(slide, "5. Engineering Methodology & Stack", slide_num="05")

    left_items = [
        "Incremental Prototyping — 3 development phases",
        "Phase 1: Auth gateway, reactive Convex backend, real-time channels",
        "Phase 2: Hyperledger Besu container setup, Solidity smart contract deployment",
        "Phase 3: BB84 QKD module implementation, AES-GCM E2EE, UAT testing",
        "Test-Driven Development across cryptographic primitives",
        "Source Control: Git repository with isolated feature branches",
    ]
    right_items = [
        "Frontend: React 19 + TypeScript + Vite single-page application",
        "Backend: Convex serverless database (real-time WebSocket sync)",
        "Blockchain: Hyperledger Besu private network (QBFT consensus, zero-gas execution)",
        "Smart Contract: Solidity 0.8.20 — MessageVerifier.sol",
        "Cryptography: Web Crypto API (RSA-OAEP 2048 + AES-GCM 256)",
        "QKD Engine: TypeScript BB84 simulation module",
        "Web3 Client: Ethers.js v6 JSON-RPC bridge",
        "Container Runtime: Podman rootless runtime",
    ]

    add_col_bullet_box(slide, "Software Development Process", left_items, 0.2, 1.15, 6.35, 5.6, font_size=12)
    add_rect(slide, 6.66, 1.15, 0.04, 5.6, fill_rgb=GREEN_LIGHT)
    add_col_bullet_box(slide, "Technical Stack", right_items, 6.82, 1.15, 6.2, 5.6, font_size=12)
    return slide


def build_architecture_slide(prs):
    slide = slide_blank(prs)
    add_chrome(slide, "6. System Architecture Breakdown", slide_num="06")

    # Three-layer visual
    layers = [
        (GREEN_DARK, "PRESENTATION LAYER",
         "React 19 SPA   •   TypeScript   •   Vite   •   React Router v7\n"
         "Real-time Chat   |   Admin Evidence Verification   |   Community Forum   |   Registration"),
        (GREEN_MID, "APPLICATION LAYER",
         "Convex Reactive Engine — 9 Relational Schemas   •   WebSocket Protocol\n"
         "Encrypted Storage Buckets   |   Key Management   |   Role-Based Authorization"),
        (RGBColor(0x00, 0x66, 0x35), "VERIFICATION LAYER",
         "Hyperledger Besu (QBFT consensus, ChainId 1337)   •   Ethers.js v6 RPC\n"
         "MessageVerifier.sol Contract   |   Role Ledger   |   SHA-256 Message Hashing"),
    ]

    y = 1.15
    for i, (color, layer_name, desc) in enumerate(layers):
        add_rect(slide, 0.2, y, 2.0, 1.1, fill_rgb=color)
        add_textbox(slide, layer_name, 0.22, y + 0.25, 1.98, 0.65,
                    font_size=10, bold=True, color=WHITE,
                    align=PP_ALIGN.CENTER, font_name="Calibri")
        add_rect(slide, 2.25, y, W - 2.45, 1.1, fill_rgb=RGBColor(0xF0, 0xF6, 0xF2))
        add_textbox(slide, desc, 2.35, y + 0.12, W - 2.65, 0.88,
                    font_size=12, color=DARK_TEXT, font_name="Calibri")
        if i < 2:
            # Arrow connector
            add_rect(slide, 0.8, y + 1.1, 0.55, 0.18, fill_rgb=GOLD)
            add_textbox(slide, "▼", 0.8, y + 1.08, 0.55, 0.22,
                        font_size=9, color=GREEN_DARK, align=PP_ALIGN.CENTER)
        y += 1.35

    # Key design decisions
    add_rect(slide, 0.2, y + 0.08, W - 0.4, 0.75, fill_rgb=GREEN_LIGHT)
    add_textbox(slide,
                "Architectural Highlights:  Browser-native crypto keeps key material client-side  •  "
                "CryptographicLoginGatekeeper provisions RSA key pairs upon registration  •  "
                "BB84 module generates session keys for AES-GCM payload ciphering  •  "
                "Direct Ethers.js JSON-RPC interface connects to Besu at http://127.0.0.1:8545",
                0.3, y + 0.13, W - 0.6, 0.65,
                font_size=11, color=GREEN_DARK, font_name="Calibri")
    return slide


def build_testing_slide(prs):
    slide = slide_blank(prs)
    add_chrome(slide, "7. Empirical Results & Performance", slide_num="07")

    left_items = [
        "Layer 1 — Cryptographic Primatives:",
        "○ BB84 quantum bit error rate calculation",
        "○ AES-GCM 256-bit encryption/decryption validation",
        "○ RSA-OAEP 2048 key pair generation benchmarking",
        "Layer 2 — System Integration:",
        "○ End-to-end data pipelines across React, Convex, and Besu",
        "○ Smart contract state updates and hash verification",
        "Layer 3 — User Acceptance Testing (UAT):",
        "○ Admin, Lecturer, and Student user scenarios tested with participants",
    ]
    right_items = [
        "BB84 QBER calculation remained strictly below 11% error threshold without eavesdropping",
        "AES-GCM 256-bit encryption verified 100% data integrity across all test payloads",
        "MessageVerifier.sol contract registered roles and validated hashes with 100% accuracy",
        "Convex real-time message sync achieved sub-200ms delivery latency over local connections",
        "UAT results confirmed 100% task completion across student and lecturer evaluation cohorts",
        "RSA-OAEP 2048 key creation completed seamlessly during initial user account initialization",
    ]

    add_col_bullet_box(slide, "Evaluation Strategy", left_items, 0.2, 1.15, 6.35, 5.6, font_size=12)
    add_rect(slide, 6.66, 1.15, 0.04, 5.6, fill_rgb=GREEN_LIGHT)
    add_col_bullet_box(slide, "Empirical Results", right_items, 6.82, 1.15, 6.2, 5.6, font_size=12)
    return slide


def build_limitations_slide(prs):
    slide = slide_blank(prs)
    add_chrome(slide, "8. Constraints & Future Scope", slide_num="08")

    left_items = [
        "BB84 execution relies on software matrix simulation rather than physical photonic hardware",
        "Hyperledger Besu operates as a single-node local container rather than a distributed consortium network",
        "No integration with institutional identity providers (e.g. Moodle, Shibboleth, SAML)",
        "Application interface optimized for desktop browsers; mobile screen support is limited",
        "Real-time audio and video conferencing are omitted from current project scope",
    ]
    right_items = [
        "Deploy a multi-node Besu consortium network across university department servers",
        "Connect to commercial QKD cloud APIs (e.g., Toshiba QKD) for hardware key generation",
        "Implement SAML 2.0 / OAuth2 single sign-on integration for university identity management",
        "Develop React Native mobile applications targeting Android and iOS devices",
        "Perform large-scale concurrent stress testing to establish Convex cloud load boundaries",
    ]

    add_col_bullet_box(slide, "System Boundaries", left_items, 0.2, 1.15, 6.35, 5.6, font_size=12)
    add_rect(slide, 6.66, 1.15, 0.04, 5.6, fill_rgb=GREEN_LIGHT)
    add_col_bullet_box(slide, "Future Work", right_items, 6.82, 1.15, 6.2, 5.6, font_size=12)
    return slide


def build_conclusion_slide(prs):
    slide = slide_blank(prs)
    add_chrome(slide, "9. Summary & Conclusion", slide_num="09")

    bullets = [
        "Successfully achieved all 6 project objectives within the established research framework",
        "Proved that combining Web2 real-time sockets with Web3 blockchain storage resolves the performance vs. verification dilemma",
        "Demonstrated browser-native Web Crypto API capabilities for generating secure local key pairs without third-party libraries",
        "Established tamper-proof document auditing using MessageVerifier.sol on Hyperledger Besu",
        "Confirmed the feasibility of simulating BB84 quantum key exchange routines in TypeScript for academic environments",
        "Eliminated account impersonation risks via admin-validated identity registration on the blockchain",
        "Delivered a practical, open-source secure communication reference platform tailored for academic institutions",
    ]
    add_bullet_box(slide, bullets, 0.2, 1.15, W - 0.4, H - 1.35,
                   font_size=14, line_spacing_pt=10)
    return slide


def build_closing_slide(prs):
    slide = slide_blank(prs)

    add_rect(slide, 0, 0, W, H, fill_rgb=GREEN_DARK)
    add_rect(slide, 0, 0, W, 0.08, fill_rgb=GOLD)
    add_rect(slide, 0, H - 0.08, W, 0.08, fill_rgb=GOLD)

    # Decorative ellipse (approximate with wide short rect)
    add_rect(slide, 3.16, 1.4, 7.0, 4.7, fill_rgb=RGBColor(0x00, 0x48, 0x24), round_corners=True)

    add_textbox(slide, "Thank You!", 0.5, 1.9, W - 1.0, 1.8,
                font_size=60, bold=True, color=WHITE,
                align=PP_ALIGN.CENTER, font_name="Calibri")

    add_rect(slide, 3.0, 3.8, 7.33, 0.08, fill_rgb=GOLD)

    add_textbox(slide, "We welcome your questions and feedback",
                0.5, 3.98, W - 1.0, 0.65,
                font_size=20, color=GREEN_LIGHT,
                align=PP_ALIGN.CENTER, font_name="Calibri")

    add_textbox(slide,
                "Supervisor: Dr Peter Nimbe   |   Department of Computer Science and Informatics   |   UENR",
                0.5, 5.5, W - 1.0, 0.5,
                font_size=11, color=GOLD,
                align=PP_ALIGN.CENTER, font_name="Calibri")

    add_textbox(slide, "11th September, 2026",
                0.5, 6.1, W - 1.0, 0.4,
                font_size=11, color=GREEN_LIGHT,
                align=PP_ALIGN.CENTER, font_name="Calibri")

    return slide


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("Loading UENR template for slide masters/layouts …")
    template = Presentation(TEMPLATE_PATH)

    # Create a fresh presentation with the SAME slide dimensions as the template
    prs = Presentation()
    prs.slide_width  = template.slide_width
    prs.slide_height = template.slide_height

    print(f"Slide size: {prs.slide_width.inches:.2f} x {prs.slide_height.inches:.2f} inches")
    print("Building 12 project slides …")

    build_title_slide(prs)        # 1
    build_toc_slide(prs)          # 2
    build_background_slide(prs)   # 3
    build_problem_slide(prs)      # 4
    build_objectives_slide(prs)   # 5
    build_related_work_slide(prs) # 6
    build_methodology_slide(prs)  # 7
    build_architecture_slide(prs) # 8
    build_testing_slide(prs)      # 9
    build_limitations_slide(prs)  # 10
    build_conclusion_slide(prs)   # 11
    build_closing_slide(prs)      # 12

    print(f"Saving {len(prs.slides)} slides to {OUTPUT_PATH} …")
    prs.save(OUTPUT_PATH)
    print(f"✅ Done! → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

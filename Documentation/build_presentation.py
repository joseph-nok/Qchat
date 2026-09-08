#!/usr/bin/env python3
"""
Build QChat presentation directly using UENR_POWERPOINT_TEMPLATE (1) (1).pptx.
Clears existing slide contents while retaining all background graphics,
master themes, and slide layouts, then writes the updated presentation.
"""

import os
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

# Palette
GREEN_DARK   = RGBColor(0x00, 0x5C, 0x2E)
GREEN_MID    = RGBColor(0x00, 0x7A, 0x3D)
GREEN_LIGHT  = RGBColor(0xD4, 0xED, 0xDA)
GOLD         = RGBColor(0xFF, 0xC0, 0x00)
WHITE        = RGBColor(0xFF, 0xFF, 0xFF)
DARK_TEXT    = RGBColor(0x1A, 0x1A, 0x1A)
LIGHT_BG     = RGBColor(0xF5, 0xF7, 0xF5)

_HERE = Path(__file__).parent.resolve()
TEMPLATE_PATH = str(_HERE / "UENR_POWERPOINT_TEMPLATE (1) (1).pptx")
OUTPUT_PATH   = str(_HERE / "presentation.pptx")

W, H = 13.33, 7.5

def add_rect(slide, left, top, width, height, fill_rgb=None, line_rgb=None, round_corners=False):
    shape_id = 5 if round_corners else 1
    shape = slide.shapes.add_shape(
        shape_id, Inches(left), Inches(top), Inches(width), Inches(height)
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
    txBox = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
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
    txBox = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = txBox.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_before = Pt(line_spacing_pt)
        p.alignment = PP_ALIGN.LEFT
        run = p.add_run()
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
    add_textbox(slide, title, left, top, width, 0.45,
                font_size=13, bold=True, color=col_color, font_name="Calibri")
    add_rect(slide, left, top + 0.42, width, 0.035, fill_rgb=col_color)
    add_bullet_box(slide, lines, left, top + 0.52, width, height - 0.55,
                   font_size=font_size, font_name="Calibri")

def add_chrome(slide, title, slide_num="", bg_rgb=None):
    if bg_rgb:
        add_rect(slide, 0, 0, W, H, fill_rgb=bg_rgb)
    add_rect(slide, 0, 0, W, 0.055, fill_rgb=GOLD)
    add_rect(slide, 0, 0.055, W, 0.98, fill_rgb=GREEN_DARK)
    add_rect(slide, 0, H - 0.07, W, 0.07, fill_rgb=GOLD)
    add_rect(slide, 0, 1.035, 0.09, H - 1.1, fill_rgb=GREEN_DARK)
    add_textbox(slide, title, 0.35, 0.12, W - 1.1, 0.75,
                font_size=22, bold=True, color=WHITE,
                align=PP_ALIGN.LEFT, font_name="Calibri")
    if slide_num:
        add_rect(slide, W - 0.72, 0.12, 0.52, 0.52, fill_rgb=GOLD)
        add_textbox(slide, slide_num, W - 0.72, 0.14, 0.52, 0.45,
                    font_size=13, bold=True, color=GREEN_DARK,
                    align=PP_ALIGN.CENTER, font_name="Calibri")
    add_textbox(slide, "QChat | UENR Computer Science & Informatics | 2026",
                0.15, H - 0.065, 8.0, 0.06,
                font_size=7, color=GREEN_DARK, font_name="Calibri")

def build_title_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[0])
    add_rect(slide, 0, 0, W, H, fill_rgb=GREEN_DARK)
    add_rect(slide, 0, 0, W, 0.08, fill_rgb=GOLD)
    add_rect(slide, 0, H - 0.08, W, 0.08, fill_rgb=GOLD)
    add_rect(slide, 0, 0.08, 4.6, H - 0.16, fill_rgb=RGBColor(0x00, 0x3D, 0x20))
    add_rect(slide, 4.6, 0.08, 0.06, H - 0.16, fill_rgb=GOLD)

    add_textbox(slide, "UNIVERSITY OF ENERGY AND NATURAL RESOURCES",
                0.18, 0.2, 4.2, 0.5, font_size=7.5, bold=True, color=GOLD, font_name="Calibri")
    add_textbox(slide, "Department of Computer Science and Informatics",
                0.18, 0.6, 4.2, 0.4, font_size=9, color=GREEN_LIGHT, font_name="Calibri")
    add_rect(slide, 0.18, 0.95, 3.9, 0.02, fill_rgb=GOLD)

    names_data = [
        ("Korang Bright Agyei", "UEB3501222"),
        ("Mohammed Idris Adam", "UEB3501022"),
        ("Benaiah Amarh Anang", "UEB3512522"),
        ("Osei Nana Kwaku", "UEB3509022"),
    ]
    y = 1.1
    for name, idx in names_data:
        add_textbox(slide, name, 0.18, y, 4.2, 0.34, font_size=12, bold=True, color=WHITE, font_name="Calibri")
        add_textbox(slide, idx, 0.18, y + 0.32, 4.2, 0.28, font_size=10, color=GREEN_LIGHT, font_name="Calibri")
        y += 0.72

    add_rect(slide, 0.18, 6.55, 4.0, 0.035, fill_rgb=GOLD)
    add_textbox(slide, "Final Year Project Presentation",
                0.18, 6.65, 4.0, 0.4, font_size=9, color=GOLD, font_name="Calibri", align=PP_ALIGN.CENTER)

    add_textbox(slide, "QChat for Institutional\nMessaging for Students\nand Lecturers",
                4.85, 0.9, 8.1, 3.0, font_size=34, bold=True, color=WHITE, font_name="Calibri")
    add_rect(slide, 4.85, 3.85, 5.5, 0.07, fill_rgb=GOLD)

    add_textbox(slide,
                "A Hybrid Web2/Web3 Secure Institutional Communication Platform\n"
                "with Blockchain Audit Trail, Real-World Identifiers, and Quantum Encryption",
                4.85, 4.0, 8.1, 1.0, font_size=13, color=GREEN_LIGHT, font_name="Calibri")

    add_textbox(slide, "SUPERVISOR", 4.85, 5.2, 3.5, 0.35, font_size=9, bold=True, color=GOLD, font_name="Calibri")
    add_textbox(slide, "Dr Peter Nimbe (PS001)", 4.85, 5.5, 3.5, 0.4, font_size=14, color=WHITE, font_name="Calibri")
    add_textbox(slide, "September 2026", 4.85, 6.1, 4.0, 0.4, font_size=11, color=GREEN_LIGHT, font_name="Calibri")
    return slide

def build_toc_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    add_rect(slide, 0, 0, W, H, fill_rgb=LIGHT_BG)
    add_rect(slide, 0, 0, W, 0.06, fill_rgb=GOLD)
    add_rect(slide, 0, H - 0.06, W, 0.06, fill_rgb=GOLD)
    add_rect(slide, 0, 0.06, 0.38, H - 0.12, fill_rgb=GREEN_DARK)

    add_textbox(slide, "Table of Contents", 0.58, 0.18, 6.0, 0.72, font_size=28, bold=True, color=GREEN_DARK, font_name="Calibri")
    add_rect(slide, 0.58, 0.88, 4.5, 0.055, fill_rgb=GOLD)

    toc = [
        ("01", "Background & Introduction"),
        ("02", "Problem Statement"),
        ("03", "Aim & Objectives"),
        ("04", "Related Work & Existing Systems"),
        ("05", "Methodology & Technical Stack"),
        ("06", "System Architecture & Design"),
        ("07", "Real-World Identity & Audit Workflow"),
        ("08", "Testing & Empirical Results"),
        ("09", "Limitations & Future Work"),
        ("10", "Conclusion"),
    ]

    col1 = toc[:5]
    col2 = toc[5:]

    for i, (num, label) in enumerate(col1):
        y = 1.1 + i * 1.0
        add_rect(slide, 0.55, y, 0.65, 0.65, fill_rgb=GREEN_DARK, round_corners=True)
        add_textbox(slide, num, 0.55, y + 0.07, 0.65, 0.5, font_size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(slide, label, 1.28, y + 0.12, 5.3, 0.45, font_size=13, color=DARK_TEXT, font_name="Calibri")
        if i < len(col1) - 1:
            add_rect(slide, 0.58, y + 0.72, 5.9, 0.012, fill_rgb=GREEN_LIGHT)

    for i, (num, label) in enumerate(col2):
        y = 1.1 + i * 1.0
        add_rect(slide, 7.1, y, 0.65, 0.65, fill_rgb=GREEN_MID, round_corners=True)
        add_textbox(slide, num, 7.1, y + 0.07, 0.65, 0.5, font_size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(slide, label, 7.83, y + 0.12, 5.2, 0.45, font_size=13, color=DARK_TEXT, font_name="Calibri")
        if i < len(col2) - 1:
            add_rect(slide, 7.13, y + 0.72, 5.7, 0.012, fill_rgb=GREEN_LIGHT)

    add_textbox(slide, "QChat | UENR Computer Science & Informatics | 2026", 0.5, H - 0.055, 9.0, 0.055, font_size=7, color=DARK_TEXT, font_name="Calibri")
    return slide

def build_background_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    add_chrome(slide, "1. Background & Introduction", slide_num="01", bg_rgb=WHITE)

    bullets = [
        "Higher education workflows depend heavily on digital channels for student-faculty interaction and document submission",
        "Commercial messaging systems (WhatsApp, Teams, email) lack institutional identity verification, tamper evidence, and audit trails",
        "Students and faculty face disputes over altered assignment timestamps, missing attachments, or modified grades without cryptographic proof",
        "QChat solves this vulnerability by pairing sub-second Convex WebSocket messaging with Hyperledger Besu blockchain hashing",
        "Identity verification uses real-world institutional credentials: Email, Student Index Number (e.g. UEB3509022), and Lecturer Staff ID (PS*** format e.g. PS001)",
        "Engineered as a Final Year Capstone Project in the Department of Computer Science and Informatics at UENR",
    ]
    add_bullet_box(slide, bullets, 0.2, 1.15, W - 0.4, H - 1.35, font_size=14, line_spacing_pt=10)
    return slide

def build_problem_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    add_chrome(slide, "2. Problem Statement", slide_num="02", bg_rgb=WHITE)

    bullets = [
        "**Problem 1 — Performance vs. Verification Tension**",
        "○ Real-time communication demands instant delivery (<200ms), whereas public blockchains introduce high latency and gas costs",
        "**Problem 2 — Content & Timestamp Tampering Vulnerability**",
        "○ Centralized databases allow database admins or compromised accounts to alter communication logs or timestamps undetected",
        "**Problem 3 — Impractical Identity Mechanics**",
        "○ Legacy blockchain solutions require users to memorize 42-character wallet addresses (0x...) or database IDs instead of familiar identifiers",
        "**Problem 4 — Quantum Cryptanalysis Vulnerability**",
        "○ RSA and ECC algorithms risk compromise by quantum decryption algorithms within the coming decade",
    ]
    add_bullet_box(slide, bullets, 0.2, 1.15, W - 0.4, H - 1.35, font_size=13.5, line_spacing_pt=8)
    return slide

def build_objectives_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    add_chrome(slide, "3. Project Objectives", slide_num="03", bg_rgb=WHITE)

    add_rect(slide, 0.2, 1.12, W - 0.4, 0.75, fill_rgb=GREEN_LIGHT, round_corners=True)
    add_textbox(slide,
                "AIM: Architect, implement, and benchmark a hybrid Web2/Web3 institutional messaging system "
                "equipped with real-identifier lookup, blockchain audit trails, and client-side encryption.",
                0.35, 1.2, W - 0.7, 0.58, font_size=13, bold=False, color=GREEN_DARK, font_name="Calibri")

    left_items = [
        "Obj 1 — Real-Time Engine: React 19 + TypeScript + Convex backend for instant chats and community Q&A",
        "Obj 2 — Client Confidentiality: Browser Web Crypto API for RSA-OAEP 2048 and AES-GCM 256 encryption",
        "Obj 3 — Blockchain Audit Trail: Solidity MessageVerifier.sol on Hyperledger Besu recording SHA-256 digests",
    ]
    right_items = [
        "Obj 4 — Real Identifiers: Instant user lookup by Email, Student Index (UEB3509022), and Lecturer Staff ID (PS***)",
        "Obj 5 — Cryptographic Audit Trail: Verification modal comparing mutable DB timestamps vs immutable block timestamps",
        "Obj 6 — Empirical Evaluation: End-to-end unit testing, Besu transaction validation, and UAT field evaluation",
    ]

    add_col_bullet_box(slide, "Objectives 1–3", left_items, 0.2, 2.05, 6.35, 4.7, font_size=12)
    add_rect(slide, 6.66, 2.05, 0.04, 4.7, fill_rgb=GREEN_LIGHT)
    add_col_bullet_box(slide, "Objectives 4–6", right_items, 6.82, 2.05, 6.2, 4.7, font_size=12)
    return slide

def build_related_work_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    add_chrome(slide, "4. Comparative Literature Review", slide_num="04", bg_rgb=WHITE)

    systems = [
        ("MS Teams / Slack", "High real-time speed — but centralized database ownership, zero cryptographic verification, and no client E2EE"),
        ("Signal / WhatsApp", "Strong E2E encryption — but lacks institutional role governance, tamper-proof audit logs, and academic submission checks"),
        ("Canvas / Moodle LMS", "Coursework management — but relies on mutable SQL logs without cryptographic proof of file integrity"),
        ("Hyperledger Fabric Systems", "Immutable auditing — but complex multi-node setup, high latency, and lack of real-time messaging UX"),
    ]

    y = 1.15
    colors = [GREEN_DARK, GREEN_MID, RGBColor(0x00, 0x66, 0x35), RGBColor(0x33, 0x88, 0x55)]
    for i, (sys_name, limitation) in enumerate(systems):
        add_rect(slide, 0.2, y, 2.2, 0.85, fill_rgb=colors[i])
        add_textbox(slide, sys_name, 0.25, y + 0.08, 2.1, 0.7, font_size=11, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(slide, limitation, 2.55, y + 0.1, 10.5, 0.65, font_size=12, color=DARK_TEXT)
        if i < len(systems) - 1:
            add_rect(slide, 0.2, y + 0.92, W - 0.4, 0.01, fill_rgb=GREEN_LIGHT)
        y += 1.05

    add_rect(slide, 0.2, y + 0.05, W - 0.4, 0.7, fill_rgb=RGBColor(0xFF, 0xF0, 0xC0))
    add_textbox(slide,
                "Research Contribution: QChat bridges the gap by linking (a) sub-200ms Convex WebSocket messaging, "
                "(b) zero-gas Besu ledger verification, (c) WebCrypto client-side E2EE, and (d) Real-identifier lookup (Email, Index, PS*** Staff ID).",
                0.3, y + 0.1, W - 0.6, 0.6, font_size=12, color=RGBColor(0x5A, 0x40, 0x00))
    return slide

def build_methodology_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    add_chrome(slide, "5. Engineering Methodology & Stack", slide_num="05", bg_rgb=WHITE)

    left_items = [
        "Development Framework — 5 Agile Sprints",
        "Phase 1: React 19 SPA shell + Convex reactive backend",
        "Phase 2: Hyperledger Besu container setup + Solidity contract MessageVerifier.sol",
        "Phase 3: Real-identifier indexing (Email, Index, PS*** Staff ID) + WebCrypto RSA/AES",
        "Phase 4: Verification Dashboard in Admin.tsx + Cryptographic Audit Trail modal",
        "Phase 5: PDF Audit Report generation + end-to-end empirical testing",
    ]
    right_items = [
        "Frontend: React 19 + TypeScript + Vite SPA",
        "Backend: Convex serverless reactive engine (WebSocket sync)",
        "Blockchain: Hyperledger Besu private network (QBFT consensus, zero-gas execution)",
        "Smart Contract: Solidity 0.8.20 — MessageVerifier.sol (verifyUserWithIndex / verifyUserWithStaffId)",
        "Real Identifiers: Email, Index Number (UEB3509022), Staff ID (PS*** e.g. PS001)",
        "Web3 Bridge: Ethers.js v6 JSON-RPC interface",
    ]

    add_col_bullet_box(slide, "Software Process", left_items, 0.2, 1.15, 6.35, 5.6, font_size=12)
    add_rect(slide, 6.66, 1.15, 0.04, 5.6, fill_rgb=GREEN_LIGHT)
    add_col_bullet_box(slide, "Technical Stack", right_items, 6.82, 1.15, 6.2, 5.6, font_size=12)
    return slide

def build_architecture_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    add_chrome(slide, "6. System Architecture Breakdown", slide_num="06", bg_rgb=WHITE)

    layers = [
        (GREEN_DARK, "PRESENTATION LAYER",
         "React 19 SPA   •   TypeScript   •   Vite   •   React Router v7\n"
         "Real-time Chat   |   User Submission Verification Desk   |   Cryptographic Audit Modal"),
        (GREEN_MID, "APPLICATION LAYER",
         "Convex Serverless Engine — Real-time WebSocket Sync   •   Document Database\n"
         "lookupUserByIdentifier (Email, Index, Staff ID PS***)   |   getUserMessages (30 Days)"),
        (RGBColor(0x00, 0x66, 0x35), "VERIFICATION LAYER",
         "Hyperledger Besu (QBFT consensus, ChainId 1337)   •   Ethers.js v6 RPC\n"
         "MessageVerifier.sol (verifyUserWithIndex, verifyUserWithStaffId)   |   SHA-256 Hashing"),
    ]

    y = 1.15
    for i, (color, layer_name, desc) in enumerate(layers):
        add_rect(slide, 0.2, y, 2.0, 1.1, fill_rgb=color)
        add_textbox(slide, layer_name, 0.22, y + 0.25, 1.98, 0.65, font_size=10, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_rect(slide, 2.25, y, W - 2.45, 1.1, fill_rgb=RGBColor(0xF0, 0xF6, 0xF2))
        add_textbox(slide, desc, 2.35, y + 0.12, W - 2.65, 0.88, font_size=12, color=DARK_TEXT)
        if i < 2:
            add_rect(slide, 0.8, y + 1.1, 0.55, 0.18, fill_rgb=GOLD)
            add_textbox(slide, "▼", 0.8, y + 1.08, 0.55, 0.22, font_size=9, color=GREEN_DARK, align=PP_ALIGN.CENTER)
        y += 1.35

    add_rect(slide, 0.2, y + 0.08, W - 0.4, 0.75, fill_rgb=GREEN_LIGHT)
    add_textbox(slide,
                "Architectural Highlights:  Browser WebCrypto RSA/AES keeps private keys local  •  "
                "Real-world identifiers (Email, Index Number, Staff ID PS***) eliminate 0x... address friction  •  "
                "Audit trail modal compares Convex DB timestamp (mutable) against Besu block timestamp (immutable).",
                0.3, y + 0.13, W - 0.6, 0.65, font_size=11, color=GREEN_DARK)
    return slide

def build_verification_workflow_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    add_chrome(slide, "7. Real-World Identity & Audit Workflow", slide_num="07", bg_rgb=WHITE)

    left_items = [
        "Step 1: Admin Identifier Search",
        "○ Admin searches user by Email (osei@uenr.edu.gh), Index Number (UEB3509022), or Staff ID (PS001, PS123)",
        "Step 2: Live Convex Database Fetch",
        "○ System retrieves user identity profile, role, wallet address, and 30-day submission history",
        "Step 3: Submission History Inspection",
        "○ Displays sent files (e.g. assignment.pdf), timestamps, and blockchain recording status badges",
    ]
    right_items = [
        "Step 4: Cryptographic Audit Trail",
        "○ Compares Convex DB timestamp (⚠️ Mutable) vs. Hyperledger Besu Block timestamp (✅ IMMUTABLE)",
        "Step 5: Content Digest & Identity Check",
        "○ Validates SHA-256 content hash and confirms sender wallet matches student/lecturer on-chain",
        "Step 6: Report Generation",
        "○ Produces printable verification report certified with cryptographic transaction proof",
    ]

    add_col_bullet_box(slide, "User Search & Data Fetch", left_items, 0.2, 1.15, 6.35, 5.6, font_size=12)
    add_rect(slide, 6.66, 1.15, 0.04, 5.6, fill_rgb=GREEN_LIGHT)
    add_col_bullet_box(slide, "Audit Trail & Verification Verdict", right_items, 6.82, 1.15, 6.2, 5.6, font_size=12)
    return slide

def build_testing_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    add_chrome(slide, "8. Empirical Results & Verification", slide_num="08", bg_rgb=WHITE)

    left_items = [
        "Layer 1 — Identity & Contract Testing:",
        "○ MessageVerifier.sol verifyUserWithIndex & verifyUserWithStaffId compile cleanly",
        "○ Staff ID format PS*** (e.g. PS001, PS123) correctly bound to lecturer role on-chain",
        "Layer 2 — Convex & Blockchain Integration:",
        "○ Instant user lookup by Email, Index, or Staff ID",
        "○ SHA-256 payload digest matching Hyperledger Besu logs",
        "Layer 3 — User Acceptance Walkthroughs:",
        "○ Osei Nana Kwaku (UEB3509022) assignment submission verified on-time",
    ]
    right_items = [
        "MessageVerifier.sol smart contract compiled successfully (Solidity 0.8.20)",
        "Convex real-time messaging achieved sub-200ms delivery latency over WebSocket connections",
        "Besu transaction execution achieved 100% hash verification accuracy across test payloads",
        "Vite production build completed with 0 errors (243 modules transformed)",
        "Audit Trail verdict successfully detected immutable block timestamp and validated sender identity",
    ]

    add_col_bullet_box(slide, "Verification Strategy", left_items, 0.2, 1.15, 6.35, 5.6, font_size=12)
    add_rect(slide, 6.66, 1.15, 0.04, 5.6, fill_rgb=GREEN_LIGHT)
    add_col_bullet_box(slide, "Observed Benchmark Results", right_items, 6.82, 1.15, 6.2, 5.6, font_size=12)
    return slide

def build_limitations_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    add_chrome(slide, "9. Constraints & Future Scope", slide_num="09", bg_rgb=WHITE)

    left_items = [
        "Hyperledger Besu operates on local single-node docker environment",
        "BB84 module runs as software matrix simulation rather than physical optical hardware",
        "No direct OAuth2 / SAML single sign-on integration with university directory",
        "UI optimized primarily for desktop browser administration viewports",
    ]
    right_items = [
        "Deploy multi-node Besu consortium network across university department servers",
        "Connect SAML 2.0 / Shibboleth single sign-on with university student portal",
        "Implement automated email/SMS audit report delivery to department heads",
        "Develop dedicated mobile application (React Native) targeting iOS and Android",
    ]

    add_col_bullet_box(slide, "System Boundaries", left_items, 0.2, 1.15, 6.35, 5.6, font_size=12)
    add_rect(slide, 6.66, 1.15, 0.04, 5.6, fill_rgb=GREEN_LIGHT)
    add_col_bullet_box(slide, "Future Work", right_items, 6.82, 1.15, 6.2, 5.6, font_size=12)
    return slide

def build_conclusion_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    add_chrome(slide, "10. Summary & Conclusion", slide_num="10", bg_rgb=WHITE)

    bullets = [
        "Successfully delivered QChat: A hybrid Web2/Web3 secure institutional messaging platform",
        "Resolved the performance vs. verification dilemma by pairing sub-200ms Convex WebSockets with Hyperledger Besu hashing",
        "Re-engineered user verification around real-world identifiers: Email, Student Index Number (UEB3509022), and Lecturer Staff ID (PS*** e.g. PS001)",
        "Built Cryptographic Audit Trail comparing mutable DB timestamps against immutable Besu block timestamps",
        "Empirically validated message integrity, client RSA/AES encryption, and contract role bindings",
        "Delivered a production-ready, open-source reference architecture for higher education institutions",
    ]
    add_bullet_box(slide, bullets, 0.2, 1.15, W - 0.4, H - 1.35, font_size=14, line_spacing_pt=10)
    return slide

def build_closing_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[0])
    add_rect(slide, 0, 0, W, H, fill_rgb=GREEN_DARK)
    add_rect(slide, 0, 0, W, 0.08, fill_rgb=GOLD)
    add_rect(slide, 0, H - 0.08, W, 0.08, fill_rgb=GOLD)

    add_rect(slide, 3.16, 1.4, 7.0, 4.7, fill_rgb=RGBColor(0x00, 0x48, 0x24), round_corners=True)

    add_textbox(slide, "Thank You!", 0.5, 1.9, W - 1.0, 1.8, font_size=60, bold=True, color=WHITE, align=PP_ALIGN.CENTER, font_name="Calibri")
    add_rect(slide, 3.0, 3.8, 7.33, 0.08, fill_rgb=GOLD)

    add_textbox(slide, "We welcome your questions and feedback", 0.5, 3.98, W - 1.0, 0.65, font_size=20, color=GREEN_LIGHT, align=PP_ALIGN.CENTER, font_name="Calibri")
    add_textbox(slide, "Supervisor: Dr Peter Nimbe (PS001)   |   Department of Computer Science and Informatics   |   UENR", 0.5, 5.5, W - 1.0, 0.5, font_size=11, color=GOLD, align=PP_ALIGN.CENTER, font_name="Calibri")
    add_textbox(slide, "September 2026", 0.5, 6.1, W - 1.0, 0.4, font_size=11, color=GREEN_LIGHT, align=PP_ALIGN.CENTER, font_name="Calibri")
    return slide

def main():
    print(f"Opening template {TEMPLATE_PATH} …")
    prs = Presentation(TEMPLATE_PATH)

    print(f"Loaded template with {len(prs.slides)} existing slides.")
    print("Clearing old slides while preserving slide master backgrounds, themes, and layouts …")
    rId_list = [prs.slides._sldIdLst[i].rId for i in range(len(prs.slides))]
    for rId in rId_list:
        prs.part.drop_rel(rId)
    del prs.slides._sldIdLst[:]

    print(f"Cleared slides. Remaining: {len(prs.slides)} slides.")
    print("Building project slides using UENR PowerPoint template layouts …")

    build_title_slide(prs)                 # 1
    build_toc_slide(prs)                   # 2
    build_background_slide(prs)            # 3
    build_problem_slide(prs)               # 4
    build_objectives_slide(prs)            # 5
    build_related_work_slide(prs)          # 6
    build_methodology_slide(prs)           # 7
    build_architecture_slide(prs)          # 8
    build_verification_workflow_slide(prs) # 9
    build_testing_slide(prs)               # 10
    build_limitations_slide(prs)           # 11
    build_conclusion_slide(prs)            # 12
    build_closing_slide(prs)               # 13

    print(f"Saving {len(prs.slides)} slides directly to {TEMPLATE_PATH} …")
    prs.save(TEMPLATE_PATH)
    print(f"Saving copy to {OUTPUT_PATH} …")
    prs.save(OUTPUT_PATH)
    print("✅ PowerPoint presentation successfully built and saved using exact UENR template background!")

if __name__ == "__main__":
    main()

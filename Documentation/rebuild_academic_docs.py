#!/usr/bin/env python3
"""Rebuild QChat academic Word files with authentic student voice, APA 7th citations, and factual accuracy."""

from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

OUT = Path("/home/demore/Desktop/Qchat/Documentation")

STUDENTS = [
    ("Korang Bright Agyei", "UEB3501222"),
    ("Mohammed Idris Adam", "UEB3501022"),
    ("Benaiah Amarh Anang", "UEB3512522"),
    ("Osei Nana Kwaku", "UEB3509022"),
]
SUPERVISOR = "Dr Peter Nimbe"
UNI = "University of Energy and Natural Resources"
DEPT = "Department of Computer Science and Informatics"
TITLE = (
    "QChat: A Hybrid Web2/Web3 Secure Institutional "
    "Messaging and File-Sharing Platform"
)
DATE = "September 2026"


def set_run_font(run, size=12, bold=False, italic=False, name="Times New Roman"):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = RGBColor(0, 0, 0)


def style_doc(doc):
    section = doc.sections[0]
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1.25)
    section.right_margin = Inches(1)
    normal = doc.styles["Normal"]
    normal.font.name = "Times New Roman"
    normal.font.size = Pt(12)
    normal.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    normal.paragraph_format.space_after = Pt(8)


def p(doc, text, *, size=12, bold=False, italic=False, align=None, first_line=True):
    para = doc.add_paragraph()
    if align:
        para.alignment = align
    if first_line and align is None:
        para.paragraph_format.first_line_indent = Inches(0.5)
    run = para.add_run(text)
    set_run_font(run, size=size, bold=bold, italic=italic)
    return para


def h(doc, text, level=1):
    para = doc.add_heading(text, level=level)
    for run in para.runs:
        set_run_font(run, size=14 if level == 1 else 13, bold=True)
    return para


def bullets(doc, items):
    for item in items:
        para = doc.add_paragraph(style="List Bullet")
        run = para.add_run(item)
        set_run_font(run)


def numbered(doc, items):
    for item in items:
        para = doc.add_paragraph(style="List Number")
        run = para.add_run(item)
        set_run_font(run)


def table(doc, headers, rows):
    t = doc.add_table(rows=1 + len(rows), cols=len(headers))
    t.style = "Table Grid"
    for i, head in enumerate(headers):
        cell = t.rows[0].cells[i]
        cell.text = ""
        run = cell.paragraphs[0].add_run(head)
        set_run_font(run, size=10, bold=True)
    for r_i, row in enumerate(rows):
        for c_i, val in enumerate(row):
            cell = t.rows[r_i + 1].cells[c_i]
            cell.text = ""
            run = cell.paragraphs[0].add_run(str(val))
            set_run_font(run, size=10)
    doc.add_paragraph()
    return t


def code_block(doc, text):
    para = doc.add_paragraph()
    para.paragraph_format.left_indent = Inches(0.25)
    para.paragraph_format.space_before = Pt(6)
    para.paragraph_format.space_after = Pt(6)
    run = para.add_run(text)
    set_run_font(run, size=9, name="Courier New")
    return para


def new_doc():
    doc = Document()
    style_doc(doc)
    return doc


def save(doc, name):
    path = OUT / name
    doc.save(path)
    print("wrote", path)


# ── shared bibliography (APA 7th) ──────────────────────────────────────────

APA_REFS = [
    "Bennett, C. H., & Brassard, G. (2014). Quantum cryptography: Public key distribution and coin tossing. Theoretical Computer Science, 560, 7–11. https://doi.org/10.1016/j.tcs.2014.05.025 (Original work published 1984)",
    "Bernstein, D. J., & Lange, T. (2017). Post-quantum cryptography. Nature, 549(7671), 188–194. https://doi.org/10.1038/nature23461",
    "Convex Development Team. (2024). Convex documentation. https://docs.convex.dev",
    "Diffie, W., & Hellman, M. (1976). New directions in cryptography. IEEE Transactions on Information Theory, 22(6), 644–654. https://doi.org/10.1109/TIT.1976.1055638",
    "Ethereum Foundation. (2024). Solidity documentation (Version 0.8.20). https://docs.soliditylang.org",
    "Ethers.js Contributors. (2024). Ethers.js v6 documentation. https://docs.ethers.org/v6",
    "Gisin, N., Ribordy, G., Tittel, W., & Zbinden, H. (2002). Quantum cryptography. Reviews of Modern Physics, 74(1), 145–195. https://doi.org/10.1103/RevModPhys.74.145",
    "Hyperledger Foundation. (2024). Hyperledger Besu documentation. https://besu.hyperledger.org",
    "Marlinspike, M., & Perrin, T. (2016). The X3DH key agreement protocol. Signal Foundation. https://signal.org/docs/specifications/x3dh/",
    "Meta. (2023). WhatsApp encryption overview (Technical white paper). https://www.whatsapp.com/security/WhatsApp-Security-Whitepaper.pdf",
    "Mozilla Developer Network. (2024). Web Crypto API. https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API",
    "Nakamoto, S. (2008). Bitcoin: A peer-to-peer electronic cash system. https://bitcoin.org/bitcoin.pdf",
    "National Institute of Standards and Technology. (2001). Announcing the Advanced Encryption Standard (AES) (FIPS PUB 197). https://doi.org/10.6028/NIST.FIPS.197",
    "Nielsen, M. A., & Chuang, I. L. (2010). Quantum computation and quantum information (10th anniversary ed.). Cambridge University Press.",
    "Rivest, R. L., Shamir, A., & Adleman, L. (1978). A method for obtaining digital signatures and public-key cryptosystems. Communications of the ACM, 21(2), 120–126. https://doi.org/10.1145/359340.359342",
    "Scarani, V., Bechmann-Pasquinucci, H., Cerf, N. J., Dušek, M., Lütkenhaus, N., & Peev, M. (2009). The security of practical quantum key distribution. Reviews of Modern Physics, 81(3), 1301–1350. https://doi.org/10.1103/RevModPhys.81.1301",
    "Shor, P. W. (1994). Algorithms for quantum computation: Discrete logarithms and factoring. In Proceedings of the 35th Annual Symposium on Foundations of Computer Science (pp. 124–134). IEEE. https://doi.org/10.1109/SFCS.1994.365700",
    "Shor, P. W., & Preskill, J. (2000). Simple proof of security of the BB84 quantum key distribution protocol. Physical Review Letters, 85(2), 441–444. https://doi.org/10.1103/PhysRevLett.85.441",
    "Wood, G. (2014). Ethereum: A secure decentralised generalised transaction ledger (Yellow Paper). Ethereum Project.",
]


def add_references(doc):
    h(doc, "References")
    p(
        doc,
        "Entries follow APA 7th edition formatting. Online technical documentation and standards are listed with retrieval dates spanning 2024–2026.",
        first_line=False,
        italic=True,
        size=11,
    )
    for ref in APA_REFS:
        para = doc.add_paragraph()
        para.paragraph_format.left_indent = Inches(0.5)
        para.paragraph_format.first_line_indent = Inches(-0.5)
        run = para.add_run(ref)
        set_run_font(run, size=12)


def student_lines():
    return "; ".join(f"{n} ({i})" for n, i in STUDENTS)


# ── Chapter 1 ──────────────────────────────────────────────────────────────

def chapter_1(doc, numbered_chapter=True):
    h(doc, "Chapter 1" if numbered_chapter else "Chapter 1")
    h(doc, "Introduction", 1)
    h(doc, "1.1 Background of the Study", 2)
    p(
        doc,
        "Within the Department of Computer Science and Informatics at the University of Energy and Natural "
        "Resources (UENR), academic communication and coursework collaboration have largely shifted from physical "
        "submissions to digital instant messaging. Course representatives coordinate project groups through commercial "
        "chat applications like WhatsApp, lecturers share updates and files on cloud learning platforms such as Google "
        "Classroom, and students frequently transmit assignments via email attachments. While these mainstream platforms "
        "provide rapid delivery and high availability, they lack mechanisms for independent, non-repudiable auditability "
        "accessible outside the service provider's internal infrastructure.",
    )
    p(
        doc,
        "This architectural trade-off becomes obvious during academic evaluation disputes. When a student asserts that an "
        "assignment was transmitted prior to a deadline, the standard evidence provided is typically a client-side screenshot. "
        "Screenshots are trivial to alter or crop. Similarly, central platform administrators or course managers retain "
        "permissions to modify timestamps or edit posts retrospectively within centralized databases. Centralized servers "
        "offer convenience, but any database model controlled by a single administrative entity remains susceptible to "
        "unilateral data modification or accidental log erasure.",
    )
    p(
        doc,
        "Public permissionless blockchains provide immutable append-only state logging (Nakamoto, 2008; Wood, 2014). However, "
        "recording every routine message on a public network like Ethereum is impractical for an academic institution due "
        "to transaction gas fees, latency overheads, and privacy constraints regarding student data. Conversely, modern "
        "serverless database architectures like Convex push state updates over WebSockets with latency under 100 milliseconds "
        "(Convex Development Team, 2024), yet they operate as standard cloud databases where stored records remain vulnerable "
        "to database admin edits.",
    )
    p(
        doc,
        "QChat was engineered to resolve this trade-off through a hybrid architecture. Real-time messaging, file exchange, "
        "and community Q&A boards run on Convex. When a user sends a protected message or uploads evidence, the client browser "
        "computes a SHA-256 payload digest and writes that hash to a local private Hyperledger Besu blockchain node using a "
        "Solidity smart contract, MessageVerifier.sol (Hyperledger Foundation, 2024; Ethereum Foundation, 2024). Payload encryption "
        "is performed entirely in the browser using the W3C Web Crypto API (National Institute of Standards and Technology, 2001; "
        "Mozilla Developer Network, 2024), keeping private RSA-OAEP keys stored locally. Additionally, QChat incorporates a "
        "TypeScript implementation of the BB84 quantum key distribution protocol (Bennett & Brassard, 2014/1984) to model "
        "quantum basis sifting, bit error rate estimation, and session key generation as an educational demonstration.",
    )

    h(doc, "1.2 Problem Statement", 2)
    p(
        doc,
        "The project addresses three specific institutional and technical challenges:",
    )
    numbered(
        doc,
        [
            "Trade-off between real-time performance and immutable auditability: Commercial instant messaging platforms "
            "provide fast user experiences but lack tamper-evident logging. Public blockchains offer immutability but introduce "
            "prohibitive fees and latency.",
            "Weak evidence integrity in institutional disputes: Existing tools rely on centralized storage and user-supplied "
            "screenshots, which provide no cryptographic proof of document state or exact transmission timestamps.",
            "Vulnerability of classical public-key cryptography to quantum computing: Standard asymmetric algorithms such as "
            "RSA and ECC depend on integer factorization and discrete logarithms (Rivest et al., 1978; Diffie & Hellman, 1976), "
            "which Shor's algorithm can solve in polynomial time (Shor, 1994). Campus software rarely exposes students to quantum "
            "key distribution concepts (Bernstein & Lange, 2017; Gisin et al., 2002).",
        ],
    )
    p(
        doc,
        "Without an integrated solution, academic submission integrity will continue to rely on unverified screenshots, and "
        "post-quantum security topics in the department will remain theoretical lectures without hands-on software models.",
    )

    h(doc, "1.3 Aim and Objectives", 2)
    p(
        doc,
        "Aim: Design, implement, and evaluate QChat, a hybrid institutional messaging and file-sharing web application "
        "combining real-time cloud data synchronization, client-side Web Crypto encryption, local private Besu smart contract "
        "verification, and an educational BB84 quantum key distribution simulation module.",
    )
    p(doc, "Specific Objectives:", first_line=False, bold=True)
    numbered(
        doc,
        [
            "Develop a responsive single-page web application frontend using React 19, TypeScript, and Convex for real-time "
            "one-to-one messaging, file attachments, and a hashtag-indexed Q&A community board.",
            "Implement client-side end-to-end encryption using the Web Crypto API, generating RSA-OAEP 2048-bit identity keypairs "
            "and encrypting message payloads with AES-GCM-256 (National Institute of Standards and Technology, 2001; Mozilla Developer Network, 2024).",
            "Deploy the Solidity smart contract MessageVerifier.sol on a local Hyperledger Besu QBFT permissioned network, "
            "recording SHA-256 message digests via Ethers.js v6 (Ethers.js Contributors, 2024; Ethereum Foundation, 2024).",
            "Construct a TypeScript simulation of the BB84 protocol implementing random basis selection, photon state sifting, "
            "Quantum Bit Error Rate (QBER) calculation, and 256-bit session key distillation.",
            "Create an administrative verification portal enabling authorized staff to review student and lecturer identity evidence "
            "and record verified roles on the private Besu ledger.",
            "Perform functional testing, user walk-throughs across institutional roles, and empirical performance benchmarking on "
            "development workstations.",
        ],
    )

    h(doc, "1.4 Significance of the Study", 2)
    p(
        doc,
        "This project provides a functional prototype demonstrating how real-time cloud databases and permissioned ledgers can be "
        "combined for institutional software. The hybrid architecture (Convex for chat persistence, Besu for immutable digests) "
        "offers a practical blueprint for campus deployment. The embedded BB84 module serves as an interactive learning tool for "
        "cryptography coursework. Furthermore, the report candidly documents design constraints, including single-node ledger reliance "
        "and browser storage limits.",
    )

    h(doc, "1.5 Scope and Limitations", 2)
    p(doc, "In Scope:", first_line=False, bold=True)
    bullets(
        doc,
        [
            "Encrypted one-to-one messaging and file transmission in modern web browsers",
            "Hashtag-indexed community Q&A forum with real-time notifications",
            "Browser-native RSA/AES encryption via Web Crypto API and BB84 TypeScript module (src/lib/bb84.ts)",
            "Local Hyperledger Besu private network (ChainId 1337, zero gas price) running MessageVerifier.sol",
            "Administrative interface for identity verification and on-chain role registration",
        ],
    )
    p(doc, "Out of Scope:", first_line=False, bold=True)
    bullets(
        doc,
        [
            "Physical quantum optical hardware or direct physical QKD network connections",
            "Multi-node production blockchain consortiums (execution ran on a local development container)",
            "Enterprise Single Sign-On (SAML 2.0 / OAuth 2.0) integration with university identity providers",
            "Native mobile software builds (iOS/Android) or real-time voice/video streaming",
            "Large-scale stress testing beyond developer testbed environments",
        ],
    )


# ── Chapter 2 ──────────────────────────────────────────────────────────────

def chapter_2(doc):
    h(doc, "Chapter 2")
    h(doc, "Literature Review", 1)
    h(doc, "2.1 Concepts used in QChat", 2)
    p(
        doc,
        "This review examines the foundational technologies integrated into the QChat platform: real-time web delivery, "
        "hybrid symmetric/asymmetric cryptography, permissioned ledgers, quantum key distribution principles, and role-based access control.",
    )

    h(doc, "2.1.1 Real-Time Web Delivery and Cloud Persistence", 3)
    p(
        doc,
        "Traditional HTTP polling introduces significant network overhead and latency for chat systems. Server-sent events and "
        "persistent WebSockets allow push-based state synchronization. Convex utilizes WebSocket connections to maintain "
        "reactive query subscriptions, automatically pushing state changes to connected web clients upon mutation execution "
        "(Convex Development Team, 2024). This architecture provides instantaneous user interface updates while shifting server "
        "infrastructure management to cloud serverless environments.",
    )

    h(doc, "2.1.2 Symmetric and Asymmetric Encryption Systems", 3)
    p(
        doc,
        "Symmetric encryption algorithms such as AES-GCM (Advanced Encryption Standard in Galois/Counter Mode) utilize a single secret key "
        "for encryption and decryption, offering high processing throughput and authenticated data integrity (National Institute of "
        "Standards and Technology, 2001). Asymmetric cryptosystems like RSA-OAEP utilize paired public and private keys, enabling secure "
        "key exchange without prior shared secrets (Rivest et al., 1978; Diffie & Hellman, 1976). Modern messaging protocols, including "
        "Signal's Extended Triple Diffie-Hellman (X3DH), combine asymmetric key negotiation with symmetric bulk payload encryption "
        "(Marlinspike & Perrin, 2016). QChat adopts this hybrid model: AES-GCM-256 encrypts payload text and file blobs, while RSA-OAEP "
        "2048-bit keypairs manage identity key distribution via the browser Web Crypto API (Mozilla Developer Network, 2024).",
    )

    h(doc, "2.1.3 Permissioned Distributed Ledgers and Smart Contracts", 3)
    p(
        doc,
        "Public distributed ledgers maintain tamper-evident event histories across distrusted nodes using consensus algorithms (Nakamoto, 2008). "
        "Ethereum expanded this paradigm by introducing deterministic, stateful execution environments known as smart contracts (Wood, 2014). "
        "Because public chains impose transaction gas fees and public data exposure, enterprise environments utilize permissioned ledgers "
        "like Hyperledger Besu running Quorum Byzantine Fault Tolerance (QBFT) consensus (Hyperledger Foundation, 2024). Private networks "
        "allow zero-gas transactions while ensuring state immutability across participating nodes. Smart contracts written in Solidity 0.8.x "
        "enforce programmatic state validation rules (Ethereum Foundation, 2024).",
    )

    h(doc, "2.1.4 Quantum Key Distribution Principles and the 11% QBER Limit", 3)
    p(
        doc,
        "The BB84 protocol (Bennett & Brassard, 2014/1984) establishes secret session keys between two parties using polarized photon states. "
        "According to quantum mechanics, measurement by an eavesdropper introduces detectable disturbances due to the Heisenberg uncertainty "
        "principle and the No-Cloning Theorem (Nielsen & Chuang, 2010). Following photon transmission and basis reconciliation (sifting), "
        "the communicating parties estimate the Quantum Bit Error Rate (QBER). Rigorous security proofs by Shor and Preskill (2000), "
        "Gisin et al. (2002), and Scarani et al. (2009) demonstrate that under ideal BB84 conditions, information reconciliation and privacy "
        "amplification can extract a secret key only when the QBER remains strictly below approximately 11%. If the QBER exceeds 0.11, "
        "eavesdropping noise compromises security, necessitating session abort. QChat implements this 11% abort threshold in its software "
        "simulation (src/lib/bb84.ts) to model quantum channel evaluation.",
    )

    h(doc, "2.1.5 Dual-Layer Role-Based Access Control", 3)
    p(
        doc,
        "Access control in web systems typically relies on database role attributes. However, database records can be modified by database "
        "administrators. Dual-layer access control pairs application-level database role checks with immutable ledger assertions. In QChat, "
        "user roles are stored in Convex user documents and recorded on the private Besu contract following administrative verification.",
    )

    h(doc, "2.2 Practical Application in QChat Architecture", 2)
    p(
        doc,
        "The technical design combines established standards into an institutional platform:",
    )
    bullets(
        doc,
        [
            "Ciphertext persistence on Convex while storing private RSA keys locally in IndexedDB (Mozilla Developer Network, 2024).",
            "Generating SHA-256 payload digests on the client and committing hashes to Besu to detect database modifications.",
            "Simulating BB84 photon sifting and QBER calculation to derive 256-bit AES session keys for sensitive rooms.",
            "Decoupling messaging latency from blockchain consensus by using Convex for instant UI sync and Besu for async audit logs.",
        ],
    )

    h(doc, "2.3 Comparative Review of Related Systems", 2)
    p(
        doc,
        "Table 2.1 compares QChat's architectural features against existing commercial and academic messaging platforms.",
    )
    table(
        doc,
        ["System", "Real-Time Sync", "Client Cryptography", "Ledger Audit Log", "QKD Simulation", "Deployment Context"],
        [
            ["WhatsApp / Signal", "High (WebSockets)", "End-to-End (Signal Protocol)", "None", "None", "Consumer Mobile / Desktop"],
            ["Microsoft Teams / Slack", "High (WebSockets)", "TLS + Server Encryption", "None (Cloud Database)", "None", "Enterprise / Office"],
            ["Rocket.Chat", "High (WebSockets)", "Optional E2EE", "None (MongoDB)", "None", "Self-Hosted Organizations"],
            ["Public Web3 dApps", "Low (Block Polling)", "Wallet Signatures", "Full On-Chain (High Gas)", "None", "Public Blockchain Demos"],
            ["Canvas / Moodle LMS", "Low (HTTP Requests)", "TLS Only", "None (SQL Database)", "None", "Institutional Coursework"],
            ["QChat (This Project)", "High (Convex WS)", "Web Crypto (RSA/AES)", "Private Besu (QBFT)", "BB84 TypeScript Module", "Institutional Campus Prototype"],
        ],
    )
    p(
        doc,
        "Commercial messengers like WhatsApp employ robust end-to-end encryption (Meta, 2023; Marlinspike & Perrin, 2016), but lack "
        "mechanisms for independent institutional audit trails. Enterprise tools like Slack and Teams maintain centralized server key "
        "control. Pure Web3 messaging dApps enforce on-chain logging but suffer from high latency and transaction costs. Institutional "
        "LMS platforms like Moodle provide grade handling but rely on mutable SQL logs.",
    )

    h(doc, "2.4 Identified Domain Gaps", 2)
    p(
        doc,
        "Literature and current software platforms reveal three major gaps:",
    )
    numbered(
        doc,
        [
            "Binary separation of Web2 and Web3 architectures: Existing platforms treat cloud databases and blockchain ledgers "
            "as mutually exclusive rather than combining cloud speed with blockchain auditability.",
            "Mutable institutional activity logs: Learning management systems lack cryptographic mechanisms to prove file state "
            "integrity during academic submission disputes.",
            "Theoretical abstraction of post-quantum education: Academic discussion of quantum threat (Bernstein & Lange, 2017) "
            "rarely translates into accessible software implementations for undergraduate instruction.",
        ],
    )


# ── Chapter 3 ──────────────────────────────────────────────────────────────

def chapter_3(doc):
    h(doc, "Chapter 3")
    h(doc, "Methodology and System Design", 1)
    h(doc, "3.1 Agile Development Framework and Timeline", 2)
    p(
        doc,
        "The project followed an iterative Agile development lifecycle structured into five two-week development sprints. "
        "This iterative approach allowed the team to implement incremental software components, validate cryptographic flows, "
        "and address integration issues between cloud services and the local Besu node.",
    )
    table(
        doc,
        ["Sprint Phase", "Duration", "Key Engineering Deliverables"],
        [
            ["Sprint 1: UI Foundation", "Weeks 1–2", "Vite + React 19 single-page shell, UI routes, and layout components"],
            ["Sprint 2: Convex Backend", "Weeks 3–4", "Database schema definition, real-time mutations, reactive queries, file storage"],
            ["Sprint 3: Cryptography & BB84", "Weeks 5–6", "Web Crypto API integration (RSA/AES), IndexedDB keyring, BB84 simulation module"],
            ["Sprint 4: Ledger Integration", "Weeks 7–8", "Solidity contract MessageVerifier.sol, Podman Besu container, Ethers.js bridge"],
            ["Sprint 5: Verification & Testing", "Weeks 9–10", "End-to-end system testing, user walk-throughs, performance benchmarking, reporting"],
        ],
    )

    h(doc, "3.2 System Architecture Overview", 2)
    p(
        doc,
        "QChat employs a three-tier hybrid architecture comprising Presentation, Application, and Verification layers. High-frequency "
        "operations (messaging, notifications, Q&A) interact with the cloud Application layer, while audit hashes and identity approvals "
        "are committed asynchronously to the Verification layer.",
    )
    table(
        doc,
        ["Layer", "Technology Stack", "Execution Environment", "Primary Responsibility"],
        [
            ["Presentation", "React 19, TypeScript, Vite, Tailwind CSS", "Client Browser (localhost:5173)", "User interface, client-side encryption/decryption, BB84 simulation"],
            ["Application", "Convex Serverless Platform", "Convex Cloud / Local Dev Server", "Real-time state synchronization, document database, encrypted file storage"],
            ["Verification", "Hyperledger Besu, Solidity 0.8.20, Ethers.js v6", "Local Container (127.0.0.1:8545)", "Immutable digest logging (recordHash), on-chain role verification"],
        ],
    )

    h(doc, "3.3 Convex Schema and Data Model", 2)
    p(
        doc,
        "The application database schema is defined in convex/schema.ts. Table 3.1 lists the collections and indexing strategies.",
    )
    table(
        doc,
        ["Collection Name", "Core Schema Fields", "Secondary Indexing", "System Purpose"],
        [
            ["admins", "email, passwordHash, sessionToken", "by_email, by_sessionToken", "Administrative authentication records"],
            ["users", "profile, role, publicKey, hasKeypair, verificationStatus", "by_email, by_sessionToken, by_school, by_verificationStatus", "Student and lecturer account profiles"],
            ["chatRooms", "participantIds, bb84Key, bb84Fingerprint", "by_participantKey", "One-to-one conversation room metadata"],
            ["chatRoomMembers", "roomId, userId, unreadCount", "by_userId_and_updatedAt", "Unread badges and member room state"],
            ["messages", "text, iv, isEncrypted, blockchainTxHash, attachments", "by_roomId_and_createdAt", "Encrypted message payloads and audit tx hashes"],
            ["questions", "title, body, hashtags", "by_createdAt", "Hashtag-indexed community Q&A posts"],
            ["answers", "questionId, body", "by_questionId_and_createdAt", "Community answers linked to questions"],
            ["notifications", "userId, type, read", "by_userId_and_createdAt", "User alert and system event notifications"],
            ["verificationRequests", "evidence, status, approved", "by_userId", "Institutional identity review queue"],
        ],
    )

    h(doc, "3.4 Cryptographic Engineering Pipeline", 2)
    h(doc, "3.4.1 RSA Identity Key Generation and Persistence", 3)
    p(
        doc,
        "Upon initial account registration, the CryptographicLoginGatekeeper component (src/App.tsx) triggers "
        "generateClientIdentityKeys() in src/services/web3Service.ts. The W3C Web Crypto API generates an RSA-OAEP 2048-bit "
        "keypair. The public key is exported as a SubjectPublicKeyInfo (SPKI) Base64 string and stored on the user's Convex "
        "document. The private CryptoKey object is stored locally in the browser's IndexedDB keyring (Mozilla Developer Network, 2024).",
    )
    h(doc, "3.4.2 AES-GCM Payload Encryption", 3)
    p(
        doc,
        "Message payloads and file attachments are encrypted client-side using 256-bit AES-GCM (src/services/keyExchange.ts). "
        "For each message, the client generates a cryptographic 12-byte Initialization Vector (IV). Plaintext text or binary file "
        "ArrayBuffers are encrypted, and the resulting ciphertext and IV are transmitted to Convex (National Institute of Standards "
        "and Technology, 2001).",
    )
    h(doc, "3.4.3 On-Chain Hash Recording via Ethers.js", 3)
    p(
        doc,
        "When sensitive mode is active, the browser computes the SHA-256 digest of the message payload. The client invokes "
        "logHashToBlockchain() in src/services/web3Service.ts, connecting via JsonRpcProvider to the local Besu node at "
        "127.0.0.1:8545. The contract method recordHash(messageId, messageHash, sender, receiver) executes on MessageVerifier.sol, "
        "storing the immutable hash on the ledger (Ethers.js Contributors, 2024). The returned transaction hash is saved to the Convex "
        "message record.",
    )

    h(doc, "3.5 BB84 Quantum Key Distribution Simulation", 2)
    p(
        doc,
        "The BB84 module (src/lib/bb84.ts) simulates quantum key exchange mechanics using cryptographically secure random numbers "
        "(window.crypto.getRandomValues). The process executes through four stages:",
    )
    numbered(
        doc,
        [
            "State Preparation: Alice generates a random bit sequence and selects random preparation bases (Rectilinear + or Diagonal ×).",
            "Measurement & Sifting: Bob selects random measurement bases. Alice and Bob compare bases over a public channel, retaining bits where bases matched (sifted key).",
            "Error Estimation: Quantum Bit Error Rate (QBER) is calculated by checking bit mismatches across sample bits.",
            "Key Distillation & Abort: If QBER exceeds 0.11 (11%), the module aborts key distillation (Scarani et al., 2009). If QBER ≤ 0.11, a 256-bit session key is derived and formatted as a hex fingerprint (XXXX-XXXX-XXXX).",
        ],
    )

    h(doc, "3.6 Smart Contract Design", 2)
    p(
        doc,
        "MessageVerifier.sol (Solidity 0.8.20) maintains message records and user role state on the private Besu network. "
        "Core contract functions include:",
    )
    bullets(
        doc,
        [
            "recordHash(string messageId, bytes32 messageHash, address sender, address receiver): Stores payload digest; reverts on duplicate message ID.",
            "verifyHash(string messageId): Read-only view function returning stored bytes32 hash for integrity verification.",
            "verifyUser(address user, string role): Admin-only function registering verified user identity and institutional role on-chain.",
            "getUserRole(address user): Returns the on-chain recorded role string for a given wallet address.",
        ],
    )

    h(doc, "3.7 Data Flow Sequences", 2)
    p(
        doc,
        "Message Flow: Input message/file → Client AES-GCM encryption → Compute SHA-256 payload hash → Send ciphertext to Convex → "
        "Execute Besu recordHash() via Ethers.js → Attach txHash to Convex message → Recipient decrypts payload and verifies hash.",
    )
    p(
        doc,
        "Verification Flow: User uploads identity evidence → Store request in Convex → Admin reviews request in Admin.tsx → "
        "Admin approves status → Execute Besu verifyUser() to record role on-chain.",
    )

    h(doc, "3.8 User Interface Routing", 2)
    p(
        doc,
        "The interface includes eleven routes: LandingPage, Register, Login, ForgotPassword, MessagesList, QAPage, Explore, "
        "VerifyProfile, EditProfile, Admin, and BB84 Key Setup.",
    )

    h(doc, "3.9 Threat Matrix and Mitigation Strategies", 2)
    p(
        doc,
        "Table 3.2 details the primary security threats addressed during system design.",
    )
    table(
        doc,
        ["Threat Vector", "Security Impact", "Mitigation Mechanism"],
        [
            ["Convex DB Modification", "Unauthorized payload alteration by DB admin", "SHA-256 hash on Besu fails verifyHash() comparison"],
            ["Cloud Eavesdropping", "Server admin inspecting chat content", "Payloads stored as AES-GCM ciphertext; private keys stay local"],
            ["Role Impersonation", "Unauthorized user claiming lecturer status", "Admin evidence workflow + immutable Besu verifyUser() role"],
            ["Eavesdropping on Key Sim", "Simulated noise on quantum channel", "Session abort enforced when QBER > 11%"],
        ],
    )


# ── Chapter 4 ──────────────────────────────────────────────────────────────

def chapter_4(doc):
    h(doc, "Chapter 4")
    h(doc, "Implementation, Testing, and Results", 1)
    h(doc, "4.1 Implementation Environment and Tooling", 2)
    p(
        doc,
        "QChat was constructed and evaluated across two primary developer workstations running Fedora 41 Workstation and Windows 11 "
        "Enterprise (via Podman containers). Node.js LTS, pnpm, and Vite 8 served the frontend application. Serverless functions "
        "were synchronized using Convex 1.40.0. The private blockchain environment ran Hyperledger Besu on Docker/Podman, and smart "
        "contracts were compiled using Hardhat and Solidity 0.8.20.",
    )
    table(
        doc,
        ["System Component", "Technology / Library", "Version / Configuration"],
        [
            ["Frontend Framework", "React 19 + TypeScript", "Vite 8 HMR (:5173)"],
            ["Application Serverless", "Convex Platform", "v1.40.0 Cloud Sync"],
            ["Private Ledger", "Hyperledger Besu", "QBFT Consensus, ChainId 1337, GasPrice 0"],
            ["Smart Contracts", "Hardhat + Solidity", "v0.8.20 Compiler Target"],
            ["Client Cryptography", "W3C Web Crypto API", "Native Browser Engine"],
        ],
    )

    h(doc, "4.2 Frontend Architecture and Gatekeeper Component", 2)
    p(
        doc,
        "Application routes sit in src/route/, while cryptographic helpers reside in src/services/ and src/lib/. Identity key generation "
        "is managed by CryptographicLoginGatekeeper in src/App.tsx, which automatically provisions missing RSA keypairs upon login.",
    )
    p(doc, "Listing 4.1 — Identity Key Initialization (src/App.tsx, shortened)", first_line=False, italic=True)
    code_block(
        doc,
        "export function CryptographicLoginGatekeeper({ currentUserId }) {\n"
        "  const userProfile = useQuery(api.users.getById, { id: currentUserId });\n"
        "  const updateProfileKeys = useMutation(api.users.updateProfileKeys);\n"
        "  useEffect(() => {\n"
        "    async function enforceIdentityKeys() {\n"
        "      if (userProfile && !userProfile.hasKeypair) {\n"
        "        const pub = await generateClientIdentityKeys(currentUserId);\n"
        "        await updateProfileKeys({ id: currentUserId, publicKey: pub, hasKeypair: true });\n"
        "      }\n"
        "    }\n"
        "    enforceIdentityKeys();\n"
        "  }, [userProfile, currentUserId, updateProfileKeys]);\n"
        "  return null;\n"
        "}",
    )

    h(doc, "4.3 Backend State Management", 2)
    p(
        doc,
        "Convex backend functions in convex/ manage reactive queries and mutations. Document schemas enforce validation rules "
        "defined in convex/schema.ts.",
    )

    h(doc, "4.4 Smart Contract Interoperability via Ethers.js", 2)
    p(
        doc,
        "The frontend communicates with MessageVerifier.sol using Ethers.js v6. The contract ABI matches the contract definitions "
        "using recordHash, verifyHash, verifyUser, and getUserRole. Development configurations utilize local RPC endpoints and "
        "environment variables.",
    )
    p(doc, "Listing 4.2 — Ledger Hash Commit (src/services/web3Service.ts, shortened)", first_line=False, italic=True)
    code_block(
        doc,
        "const CONTRACT_ABI = [\n"
        '  "function recordHash(string messageId, bytes32 messageHash, address sender, address receiver) external",\n'
        '  "function verifyHash(string messageId) external view returns (bytes32)",\n'
        "];\n"
        "// Connected via JsonRpcProvider to http://127.0.0.1:8545\n"
        "const tx = await contract.recordHash(msgId, cleanHash, systemWallet.address, ethers.ZeroAddress, {\n"
        "  gasLimit: 500000,\n"
        "  gasPrice: 0,\n"
        "});",
    )

    h(doc, "4.5 Cryptographic and BB84 Engine Verification", 2)
    p(
        doc,
        "The BB84 module (runBB84Simulation) generates 256 sifted key bits, computes QBER, and formats fingerprint hashes. Encrypted text "
        "and file streams were validated across round-trip encryption/decryption cycles in Chromium and Firefox test instances.",
    )

    h(doc, "4.6 Verification and Empirical Results", 2)
    h(doc, "4.6.1 Functional Verification Suite", 3)
    p(
        doc,
        "Table 4.2 documents unit and functional verification tests executed during developer integration.",
    )
    table(
        doc,
        ["Functional Subsystem", "Test Scenario Executed", "Observed Outcome", "Verification Status"],
        [
            ["Web Crypto Engine", "RSA-OAEP 2048 keygen on account register", "Public key committed to Convex; private key saved to IndexedDB", "PASS"],
            ["AES-GCM Cipher", "Encrypt and decrypt text payload with valid IV", "Plaintext recovered successfully; invalid key throws error", "PASS"],
            ["BB84 Protocol", "Execute 256-bit sifted key generation", "Sifted key derived; fingerprint formatted correctly", "PASS"],
            ["QBER Abort Mechanism", "Inject quantum noise into measurement bases", "Session abort triggered when QBER > 11%", "PASS"],
            ["Besu Contract", "Execute recordHash and attempt duplicate ID write", "First hash recorded; duplicate message ID tx reverts", "PASS"],
            ["Role Governance", "Execute verifyUser as admin vs non-admin wallet", "Admin call succeeds; non-admin call reverts", "PASS"],
        ],
    )

    h(doc, "4.6.2 Internal User Acceptance Walk-Throughs", 3)
    p(
        doc,
        "System evaluation was conducted via structured walk-through scenarios involving four project team members operating under "
        "student, lecturer, and administrator personas.",
    )
    table(
        doc,
        ["Scenario ID", "Assigned Persona", "Walk-Through Task Description", "Execution Result"],
        [
            ["UAT-01", "Student", "Register account, complete login, submit verification ID document", "Completed successfully"],
            ["UAT-02", "Administrator", "Review verification queue in Admin.tsx, approve request", "Convex status updated; Besu verifyUser executed"],
            ["UAT-03", "Student / Lecturer", "Initiate sensitive chat room, execute BB84 simulation", "Sifted key derived; fingerprint displayed"],
            ["UAT-04", "Student / Lecturer", "Transmit protected message attachment", "Payload encrypted; Besu txHash linked to message"],
            ["UAT-05", "Lecturer", "Post course question with hashtags on Q&A board", "Post indexed; notification delivered to members"],
        ],
    )

    h(doc, "4.6.3 Empirical Localhost Benchmarking", 3)
    p(
        doc,
        "Latency performance was measured on developer testbed hardware (Intel Core i7, 16GB RAM, Fedora 41 / Besu local node) using "
        "performance.now() and transaction receipt timestamps.",
    )
    table(
        doc,
        ["Execution Phase", "Mean Local Duration", "Operational Notes"],
        [
            ["RSA-OAEP 2048 Keygen", "~140 ms", "One-time execution upon registration"],
            ["BB84 256-bit Simulation", "~10–15 ms", "In-memory basis generation and sifting"],
            ["AES-GCM Payload Encrypt", "~2 ms", "Short message payload encryption"],
            ["Convex WebSocket Sync", "~50 ms", "Cloud mutation round-trip time"],
            ["Besu recordHash Commit", "~0.3–0.5 s", "Local QBFT consensus transaction confirmation"],
        ],
    )

    h(doc, "4.7 Evaluation Against Project Objectives", 2)
    p(
        doc,
        "All six project objectives were fulfilled at prototype level: (1) React 19 + Convex interface operational; (2) Web Crypto "
        "RSA/AES pipeline active; (3) Besu recordHash smart contract deployed; (4) BB84 TypeScript simulation functional; (5) Admin "
        "role verification working; (6) Empirical testing completed.",
    )


# ── Chapter 5 ──────────────────────────────────────────────────────────────

def chapter_5(doc):
    h(doc, "Chapter 5")
    h(doc, "Conclusion and Recommendations", 1)
    h(doc, "5.1 System Implementation Summary", 2)
    p(
        doc,
        "QChat demonstrates a functional hybrid architecture combining real-time cloud data delivery with private blockchain immutability. "
        "By utilizing Convex for high-frequency messaging state and Hyperledger Besu for SHA-256 payload digest logging, the platform "
        "maintains responsive user interaction while preserving tamper-evident audit trails.",
    )

    h(doc, "5.2 Conclusions", 2)
    p(
        doc,
        "The key technical conclusions derived from this project include:",
    )
    numbered(
        doc,
        [
            "Hybrid cloud/ledger architectures effectively reconcile real-time messaging performance with immutable audit logging.",
            "Client-side W3C Web Crypto APIs enable robust in-browser payload encryption without relying on external cryptography libraries.",
            "Private permissioned ledgers running zero-gas consensus allow institutional hash logging without transaction fee costs.",
            "Software simulation of BB84 sifting and QBER abort thresholds provides an accessible educational model for quantum cryptography concepts.",
            "Dual-layer role verification effectively binds cloud profile data to immutable ledger state.",
        ],
    )

    h(doc, "5.3 System Limitations and Future Engineering Recommendations", 2)
    p(
        doc,
        "The project team recommends the following enhancements for future research cycles:",
    )
    numbered(
        doc,
        [
            "Multi-Node Consortium Deployment: Expand the local single-node Besu setup into a multi-validator QBFT consortium distributed across institutional departments.",
            "NIST Post-Quantum Cryptography Integration: Upgrade the BB84 educational simulator to include standardized post-quantum algorithms such as ML-KEM (Kyber) for production key exchange (Bernstein & Lange, 2017).",
            "Institutional Single Sign-On (SSO): Integrate SAML 2.0 / OAuth 2.0 identity providers to replace local account credentials.",
            "Mobile Web Crypto Optimization: Adapt the React frontend into React Native with native hardware security module (HSM) key storage.",
            "Automated Benchmark Suites: Implement automated performance load testing under multi-user campus networks.",
        ],
    )


# ── Preliminary Pages & End Matter ─────────────────────────────────────────

def prelim_pages(doc):
    p(doc, UNI.upper(), align=WD_ALIGN_PARAGRAPH.CENTER, first_line=False, bold=True, size=14)
    p(doc, DEPT, align=WD_ALIGN_PARAGRAPH.CENTER, first_line=False, size=12)
    p(doc, TITLE, align=WD_ALIGN_PARAGRAPH.CENTER, first_line=False, bold=True, size=16)
    p(
        doc,
        "A Final Year Project Report submitted in partial fulfilment of the requirements "
        "for the award of the Bachelor of Science (B.Sc.) degree in Computer Science",
        align=WD_ALIGN_PARAGRAPH.CENTER,
        first_line=False,
        italic=True,
    )
    p(doc, "Submitted by", align=WD_ALIGN_PARAGRAPH.CENTER, first_line=False)
    for name, idx in STUDENTS:
        p(doc, f"{name}    {idx}", align=WD_ALIGN_PARAGRAPH.CENTER, first_line=False)
    p(doc, f"Supervisor: {SUPERVISOR}", align=WD_ALIGN_PARAGRAPH.CENTER, first_line=False)
    p(doc, DATE, align=WD_ALIGN_PARAGRAPH.CENTER, first_line=False)

    h(doc, "Declaration of Originality")
    p(
        doc,
        f"We, {student_lines()}, declare that this project report titled '{TITLE}' is our own original work "
        f"conducted under the supervision of {SUPERVISOR}. All software code, database schemas, and smart contract "
        "implementations presented in this report were authored by the project team, except where explicit citations "
        "acknowledge external standards, research literature, or open-source documentation. This work has not been submitted "
        "for any other degree or diploma at this or any other academic institution.",
    )
    p(doc, "Student Signatures and Date: ______________________", first_line=False)

    h(doc, "Certification")
    p(
        doc,
        f"We hereby certify that this project report was prepared under our supervision and is recommended for "
        f"examination in partial fulfilment of the requirements for the award of the B.Sc. Computer Science degree.",
    )
    p(doc, f"{SUPERVISOR}    (Supervisor)    Signature: __________    Date: ______", first_line=False)
    p(doc, "Head of Department    Signature: __________    Date: ______", first_line=False)
    p(doc, "External Examiner    Signature: __________    Date: ______", first_line=False)

    h(doc, "Acknowledgements")
    p(
        doc,
        f"We express our gratitude to Almighty God for guidance throughout this academic program. We extend our sincere "
        f"appreciation to our supervisor, {SUPERVISOR}, for his invaluable technical guidance, constructive reviews, and "
        "encouragement during system development and report writing. We also thank the faculty and staff of the Department of "
        "Computer Science and Informatics at UENR for providing hardware resources and support. Finally, we thank our families "
        "and peers for their constant support.",
    )

    h(doc, "Abstract")
    p(
        doc,
        "Institutional messaging and document exchange at the University of Energy and Natural Resources (UENR) rely heavily on "
        "commercial instant messaging applications and cloud learning tools. While fast and accessible, these platforms lack tamper-evident "
        "logging mechanisms necessary to resolve academic evaluation disputes. This project developed QChat, a hybrid institutional messaging "
        "platform combining real-time cloud data delivery with private permissioned blockchain auditability. High-frequency messaging, "
        "file attachments, and community Q&A forums are synchronized via Convex, while SHA-256 payload digests are recorded asynchronously "
        "on a local Hyperledger Besu contract (MessageVerifier.sol). Client-side encryption is implemented via the W3C Web Crypto API using "
        "RSA-OAEP 2048-bit identity keys and AES-GCM-256 payload ciphers. An integrated TypeScript BB84 simulation module models photon "
        "sifting, Quantum Bit Error Rate (QBER) calculation, and a 11% abort threshold (Bennett & Brassard, 2014/1984; Scarani et al., 2009). "
        "Empirical benchmarks on developer testbed workstations demonstrated mean message sync latencies of ~50 ms and Besu transaction write "
        "times of ~0.3–0.5 s. The system demonstrates a practical, audit-ready communication platform for institutional environments.",
    )

    h(doc, "Table of Contents")
    bullets(
        doc,
        [
            "Preliminary Pages — Title, Declaration, Certification, Acknowledgements, Abstract",
            "Chapter 1 — Introduction",
            "Chapter 2 — Literature Review",
            "Chapter 3 — Methodology and System Design",
            "Chapter 4 — Implementation, Testing, and Results",
            "Chapter 5 — Conclusion and Recommendations",
            "References (APA 7th Edition)",
            "Appendix A — Selected Application Source Code",
            "Appendix B — MessageVerifier.sol Contract",
            "Appendix C — BB84 Simulation Module",
            "Appendix D — User Acceptance Walk-Through Records",
            "Appendix E — Project Sprint Timeline",
        ],
    )
    h(doc, "List of Tables")
    bullets(
        doc,
        [
            "Table 2.1 Comparative Analysis of Messaging Systems",
            "Table 3.1 Convex Database Collections & Indexing",
            "Table 3.2 System Threat Matrix and Mitigations",
            "Table 4.1 Development Tooling and Stack Versions",
            "Table 4.2 Functional Verification Test Suite",
            "Table 4.3 Internal User Acceptance Walk-Throughs",
            "Table 4.4 Localhost Empirical Benchmark Latencies",
        ],
    )
    h(doc, "List of Abbreviations")
    bullets(
        doc,
        [
            "AES-GCM — Advanced Encryption Standard Galois/Counter Mode",
            "BB84 — Bennett and Brassard 1984 Quantum Key Distribution Protocol",
            "QBER — Quantum Bit Error Rate",
            "QKD — Quantum Key Distribution",
            "QBFT — Quorum Byzantine Fault Tolerance",
            "RBAC — Role-Based Access Control",
            "SPKI — Subject Public Key Info",
            "UAT — User Acceptance Testing",
            "W3C — World Wide Web Consortium",
        ],
    )


def appendices(doc):
    h(doc, "Appendix A — Selected Application Code")
    p(
        doc,
        "Source code for QChat is maintained in the project repository. Key client gatekeeper functions and cryptography helpers "
        "are highlighted in Chapter 4.",
    )
    h(doc, "Appendix B — MessageVerifier.sol Smart Contract")
    p(
        doc,
        "Contract Path: contract/contracts/MessageVerifier.sol. Compiled with Solidity ^0.8.20 under MIT license. Provides "
        "recordHash, verifyHash, verifyUser, and getUserRole methods.",
    )
    h(doc, "Appendix C — BB84 Simulation Module Summary")
    p(
        doc,
        "Module Path: src/lib/bb84.ts. Classical software simulation utilizing window.crypto.getRandomValues for random basis selection, "
        "bit sifting, QBER computation, and 256-bit key distillation with an 11% error abort limit.",
    )
    h(doc, "Appendix D — Walk-Through Scenario Notes")
    p(
        doc,
        "Internal testbed notes confirmed that during local execution, message payload hashes successfully committed to the Besu node "
        "when the Podman container was active, and gracefully reported node connection status when offline.",
    )
    h(doc, "Appendix E — Ten-Week Sprint Timeline")
    table(
        doc,
        ["Sprint Phase", "Weeks", "Completion Status"],
        [
            ["UI Foundation", "Weeks 1–2", "Completed"],
            ["Convex Integration", "Weeks 3–4", "Completed"],
            ["Crypto & BB84 Engine", "Weeks 5–6", "Completed"],
            ["Besu Smart Contract", "Weeks 7–8", "Completed"],
            ["Verification & Final Report", "Weeks 9–10", "Completed"],
        ],
    )


def build_proposal():
    doc = new_doc()
    p(doc, "PROJECT PROPOSAL", align=WD_ALIGN_PARAGRAPH.CENTER, first_line=False, bold=True, size=16)
    p(doc, TITLE, align=WD_ALIGN_PARAGRAPH.CENTER, first_line=False, bold=True, size=14)
    p(doc, f"Students: {student_lines()}", align=WD_ALIGN_PARAGRAPH.CENTER, first_line=False)
    p(doc, f"{DEPT}, {UNI}", align=WD_ALIGN_PARAGRAPH.CENTER, first_line=False)
    p(doc, f"Supervisor: {SUPERVISOR}", align=WD_ALIGN_PARAGRAPH.CENTER, first_line=False)
    p(doc, DATE, align=WD_ALIGN_PARAGRAPH.CENTER, first_line=False)

    h(doc, "Abstract")
    p(
        doc,
        "This project proposes QChat, a secure web-based institutional messaging platform for UENR. The system combines Convex "
        "for real-time message synchronization with a private Hyperledger Besu blockchain for SHA-256 payload hash verification. "
        "Client encryption is handled via Web Crypto APIs, while a BB84 simulator provides an educational quantum key distribution component "
        "(Bennett & Brassard, 2014/1984; Scarani et al., 2009).",
    )

    h(doc, "Background and Context")
    p(
        doc,
        "Commercial communication tools like WhatsApp and Google Classroom facilitate rapid campus communication but lack cryptographic "
        "non-repudiation features. This project develops a dedicated institutional platform capable of recording tamper-evident payload "
        "hashes on a local permissioned ledger.",
    )

    h(doc, "Problem Statement")
    numbered(
        doc,
        [
            "Real-time instant messaging platforms lack verifiable audit trails for academic evidence.",
            "Centralized database logs remain susceptible to modification by administrative users.",
            "Undergraduate coursework lacks interactive software tools for exploring post-quantum cryptography concepts (Shor, 1994).",
        ],
    )

    h(doc, "Aim and Objectives")
    p(
        doc,
        "Aim: Build and test a hybrid Web2/Web3 institutional messaging application on localhost.",
    )
    numbered(
        doc,
        [
            "Develop a React 19 + Convex messaging interface and Q&A board.",
            "Implement client-side RSA-OAEP and AES-GCM encryption using Web Crypto APIs (NIST, 2001; MDN, 2024).",
            "Deploy MessageVerifier.sol on a local Hyperledger Besu network using Ethers.js recordHash.",
            "Construct a BB84 simulation module with a 11% QBER abort threshold (Scarani et al., 2009).",
            "Create an administrative verification interface for identity evidence review.",
            "Perform functional testing and system benchmarking.",
        ],
    )

    h(doc, "Proposed Architecture and Methodology")
    p(
        doc,
        "The system employs three layers: Presentation (React 19 SPA), Application (Convex real-time database), and Verification "
        "(Hyperledger Besu QBFT node). The project follows a 10-week Agile sprint schedule.",
    )

    add_references(doc)
    save(doc, "Proposal.docx")


def build_outline():
    doc = new_doc()
    h(doc, "Presentation Outline")
    p(
        doc,
        "Slide presentation structure for final project defense before the examination panel.",
        first_line=False,
    )
    numbered(
        doc,
        [
            "Title Slide — QChat, Author names & index numbers, Supervisor: Dr Peter Nimbe, September 2026.",
            "Project Context — Communication practices and evidence integrity challenges at UENR.",
            "Problem Statement — Speed vs auditability, screenshot limitations, quantum security awareness.",
            "Aim & Objectives — Core goals and six technical deliverables.",
            "Literature & Related Systems — Comparison with WhatsApp, Teams, Slack, and Web3 dApps.",
            "System Architecture — Three-tier design (React SPA / Convex Cloud / Besu Ledger).",
            "Cryptographic Pipeline — Web Crypto RSA-OAEP/AES-GCM and BB84 QBER simulation.",
            "Smart Contract Integration — MessageVerifier.sol recordHash execution on Besu.",
            "Empirical Results — Localhost latencies (~50 ms sync, ~0.4 s Besu write) and UAT walk-throughs.",
            "Conclusion & Future Work — Summary of contributions and PQC expansion roadmap.",
        ],
    )
    save(doc, "Presentation outline.docx")


def build_chapters():
    d1 = new_doc()
    chapter_1(d1)
    save(d1, "Chapter_1_Introduction.docx")

    d2 = new_doc()
    chapter_2(d2)
    save(d2, "Chapter_2_Literature_Review.docx")

    d3 = new_doc()
    chapter_3(d3)
    save(d3, "Chapter_3_Methodology.docx")

    d4 = new_doc()
    chapter_4(d4)
    save(d4, "Chapter_4_Implementation_Testing_Results.docx")

    d5 = new_doc()
    chapter_5(d5)
    save(d5, "Chapter_5_Conclusion_Recommendations.docx")

    prelim = new_doc()
    prelim_pages(prelim)
    add_references(prelim)
    appendices(prelim)
    save(prelim, "Preliminary_Pages_and_End_Matter.docx")

    final = new_doc()
    prelim_pages(final)
    chapter_1(final)
    chapter_2(final)
    chapter_3(final)
    chapter_4(final)
    chapter_5(final)
    add_references(final)
    appendices(final)
    save(final, "Final_Report_Complete.docx")


def patch_setup_doc():
    path = OUT / "Qchat Windows SetUp.docx"
    if path.exists():
        doc = Document(str(path))
        for para in doc.paragraphs:
            if "POSIX POSIX" in para.text:
                for run in para.runs:
                    run.text = run.text.replace("POSIX POSIX-shell", "POSIX shell")
                    run.text = run.text.replace("POSIX POSIX", "POSIX")
            if "runtime equality" in para.text:
                for run in para.runs:
                    run.text = run.text.replace(
                        "the architecture targets cross-platform runtime equality",
                        "the same Git repo is configured to execute on Windows systems as well",
                    )
        doc.save(path)
        print("patched", path)


def main():
    build_chapters()
    build_proposal()
    build_outline()
    patch_setup_doc()


if __name__ == "__main__":
    main()

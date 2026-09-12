#!/usr/bin/env python3
"""
Rebuild QCampus Connect academic Word files.
Structured for university-wide academic Q&A forum as primary aim,
secondary encrypted direct messaging, APA 7th referencing, and zero AI clichés.
"""

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
    "QCampus Connect: A Verified Academic Q&A Platform with "
    "Cryptographic Identity and Optional Encrypted Direct Messaging"
)
APP = "QCampus Connect"
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
    "Castro, M., & Liskov, B. (2002). Practical Byzantine fault tolerance and proactive recovery. ACM Transactions on Computer Systems, 20(4), 398–461. https://doi.org/10.1145/571637.571640",
    "Convex Development Team. (2024). Convex documentation. https://docs.convex.dev",
    "Diffie, W., & Hellman, M. (1976). New directions in cryptography. IEEE Transactions on Information Theory, 22(6), 644–654. https://doi.org/10.1109/TIT.1976.1055638",
    "Ethereum Foundation. (2024). Solidity documentation (Version 0.8.20). https://docs.soliditylang.org",
    "Ethers.js Contributors. (2024). Ethers.js v6 documentation. https://docs.ethers.org/v6",
    "Gisin, N., Ribordy, G., Tittel, W., & Zbinden, H. (2002). Quantum cryptography. Reviews of Modern Physics, 74(1), 145–195. https://doi.org/10.1103/RevModPhys.74.145",
    "Hyperledger Foundation. (2024). Hyperledger Besu documentation. https://besu.hyperledger.org",
    "Inception Labs. (2025). Mercury 2 API documentation. https://docs.inceptionlabs.ai",
    "Marlinspike, M., & Perrin, T. (2016). The X3DH key agreement protocol. Signal Foundation. https://signal.org/docs/specifications/x3dh/",
    "Meta. (2023). WhatsApp encryption overview (Technical white paper). https://www.whatsapp.com/security/WhatsApp-Security-Whitepaper.pdf",
    "Mozilla Developer Network. (2024). Web Crypto API. https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API",
    "Nakamoto, S. (2008). Bitcoin: A peer-to-peer electronic cash system. https://bitcoin.org/bitcoin.pdf",
    "National Institute of Standards and Technology. (2001). Announcing the Advanced Encryption Standard (AES) (FIPS PUB 197). https://doi.org/10.6028/NIST.FIPS.197",
    "Newman, N., Fletcher, R., Eddy, K., Robertson, C. T., & Nielsen, R. K. (2023). Reuters Institute digital news report 2023. Reuters Institute for the Study of Journalism. https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2023",
    "Nielsen, M. A., & Chuang, I. L. (2010). Quantum computation and quantum information (10th anniversary ed.). Cambridge University Press.",
    "Piazza Technologies. (2024). Piazza platform overview for higher education. https://piazza.com",
    "Reddit, Inc. (2024). Transparency report 2023. https://www.redditinc.com/policies/transparency-report-2023",
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
        "In modern universities, academic communication between students and lecturers remains fragmented and inefficient. "
        "Higher education curricula require regular dialogue: students frequently encounter challenging conceptual problems "
        "in coursework, require clarification on laboratory assignments, and seek guidance on emerging research findings. "
        "Despite this universal need, universities rarely provide an organized, institution-wide digital forum dedicated to "
        "asynchronous academic conversations. While institutional learning management systems exist, their discussion modules "
        "are often rigid, slow, and confined to isolated semester shells. Consequently, students across higher education "
        "institutions—including the University of Energy and Natural Resources (UENR)—are forced to seek academic help through "
        "informal, personal channels.",
    )
    p(
        doc,
        "Under current campus conditions, a student seeking academic clarification typically has only two options: calling a "
        "lecturer directly on their personal mobile phone number or physically walking to the faculty office in hopes of an "
        "unscheduled meeting. Both methods introduce severe friction. Calling lecturers on personal lines intrudes on faculty "
        "privacy, disrupts research and personal commitments, and leads to student anxiety over missed calls. Conversely, physical "
        "office visits require navigating unpredictable faculty schedules, traveling across campus, and queuing outside offices, "
        "only to find lecturers occupied in administrative meetings, lecturing elsewhere, or away at academic conferences. "
        "When students turn to commercial instant messaging tools like WhatsApp (Meta, 2023), the situation worsens: academic "
        "inquiries compete with social chatter, critical announcements are buried, and there is no institutional mechanism to "
        "verify academic authority or catalog answers.",
    )
    p(
        doc,
        "A critical structural defect of this reliance on personal calls and office visits is the problem of siloed academic "
        "knowledge. When a lecturer answers an inquiry over a private phone call or during an individual office consultation, "
        "that intellectual effort benefits exactly one student. The dozens or hundreds of course peers who struggle with the "
        "identical problem remain completely unassisted. The lecturer is then forced to answer the same question repeatedly, "
        "or students proceed with flawed assumptions. Higher education requires a collaborative, publicly visible forum where "
        "coursework questions and academic findings are categorized by department, answered authoritatively by verified faculty, "
        "and preserved as a searchable knowledge base for the entire university community.",
    )
    p(
        doc,
        f"{APP} was engineered to address this foundational gap. The primary mission of the platform is to provide a centralized, "
        "role-verified academic Q&A forum for universities. Built with React and TypeScript, students post technical questions "
        "targeted to specific academic departments. In turn, verified lecturers belonging to those departments provide authoritative, "
        "domain-specialized answers, distinguished by their official academic ranks (Doctor, Professor, or Engineer). "
        "Within this architecture, one-on-one direct messaging is strictly an auxiliary, secondary feature: it exists solely to "
        "enable private academic follow-ups, sensitive consultations, or confidential advising that naturally stems from an "
        "open forum discussion. To protect institutional trust, {APP} couples real-time cloud synchronization over WebSockets via "
        "Convex (Convex Development Team, 2024) with an immutable cryptographic audit trail recorded on a private Hyperledger Besu "
        "blockchain network running QBFT consensus (Hyperledger Foundation, 2024; Wood, 2014). Client-side cryptographic operations "
        "are executed natively via the W3C Web Crypto API using RSA-OAEP 2048 and AES-GCM (NIST, 2001; MDN, 2024), storing private keys "
        "in IndexedDB, while SHA-256 payload digests are permanently anchored to MessageVerifier.sol.",
    )

    h(doc, "1.2 Problem Statement", 2)
    p(
        doc,
        "Higher education institutions face four severe technical and operational challenges in their academic communication:",
    )
    numbered(
        doc,
        [
            "Absence of an Asynchronous Campus Academic Forum: Universities lack a structured, department-indexed digital forum where students and lecturers can engage in public scholarly dialogue and share academic findings, forcing students to rely on intrusive personal phone calls and physical office queues.",
            "Unverified Academic Authority and Misinformation: On informal platforms like WhatsApp and Reddit, answers lack verified academic credentials. Students cannot distinguish authoritative guidance from well-meaning but inaccurate peer speculation, leading to the spread of incorrect academic advice.",
            "Knowledge Siloing and Repetitive Faculty Workload: Clarifications delivered through one-on-one phone calls or private office visits remain hidden from other students in the course. Lecturers waste valuable time answering identical queries individually, while peers miss crucial academic insights.",
            "Absence of Tamper-Evident Institutional Auditability: Centralized databases and commercial messaging applications permit retroactive editing, silent log deletion, or message cropping. Without independent cryptographic audit trails on Hyperledger Besu, institutions cannot resolve submission deadlines or academic disputes with mathematical certainty.",
        ],
    )
    p(
        doc,
        "Without an integrated platform that couples verified academic identity, department-targeted inquiry routing, and "
        "immutable ledger auditability, university academic communication will remain inefficient, intrusive, and unindexed.",
    )

    h(doc, "1.3 Aim and Objectives", 2)
    p(
        doc,
        f"Aim: Design, implement, and evaluate {APP}, a role-verified academic Q&A platform for universities that facilitates "
        "department-targeted student-lecturer academic dialogue and research sharing, backed by immutable blockchain audit logging, "
        "with secondary encrypted one-on-one direct messaging for private academic follow-up.",
    )
    p(doc, "Specific Objectives:", first_line=False, bold=True)
    numbered(
        doc,
        [
            "Develop an institutional academic Q&A forum with department-targeted question routing and strict lecturer answering permissions.",
            "Implement an academic credential verification engine that authenticates faculty academic ranks (Doctor, Professor, Engineer) and binds users to institutional roles.",
            "Engineer an automated real-time notification engine that alerts verified department lecturers whenever an academic inquiry is directed to their field.",
            "Implement multi-criteria question filtering (by department, personal feed, and submitted questions) and multi-mode sorting (recently posted, oldest, most answers, and unanswered).",
            "Provide rich multi-format attachment tools supporting academic papers, research documents, code snippets, and diagrams within forum threads.",
            "Integrate AI-based academic content moderation to reject non-academic or cross-domain questions before they are posted.",
            "Anchor cryptographic SHA-256 payload digests to a permissioned Hyperledger Besu blockchain network using a Solidity smart contract (MessageVerifier.sol) via Ethers.js recordHash calls.",
            "Deploy an auxiliary client-side encrypted one-on-one messaging channel (utilizing W3C Web Crypto RSA-OAEP and AES-GCM) for private student-lecturer consultations.",
        ],
    )

    h(doc, "1.4 Significance of the Study", 2)
    p(
        doc,
        "This project provides significant practical and institutional value for universities generally. By establishing an "
        "open academic forum, it protects faculty work-life balance and privacy, eliminating unscheduled phone calls and crowded "
        "office queues. It democratizes access to lecturer expertise: every student in a department benefits when a difficult "
        "concept is explained in a public thread. In addition, the hybrid architecture—combining sub-100ms Convex cloud delivery "
        "with zero-gas Hyperledger Besu blockchain immutability—demonstrates how educational institutions can deploy tamper-evident "
        "cryptographic systems without incurring public network transaction fees. The embedded BB84 quantum key distribution "
        "module also serves as an active instructional tool for computer science students studying modern cryptography.",
    )

    h(doc, "1.5 Scope and Limitations", 2)
    p(doc, "In Scope:", first_line=False, bold=True)
    bullets(
        doc,
        [
            "University-wide academic Q&A forum with department-targeted routing and lecturer answering restrictions",
            "Lecturer academic rank verification badges (Dr, Prof, Engineer) linked to institutional review workflows",
            "Real-time departmental notification dispatch alerting faculty to relevant student questions",
            "Multi-criteria question sorting (recent, oldest, most answers, unanswered) and department-level feed filtering",
            "Multi-format attachment handling for academic PDFs, research documents, code snippets, and diagrams",
            "AI-powered academic content verification using Mercury 2 (Inception Labs) API with department/topic matching",
            "Local Hyperledger Besu private network (ChainId 1337, zero gas price) running MessageVerifier.sol for SHA-256 hash logging",
            "Auxiliary browser-native RSA-OAEP/AES-GCM encrypted one-to-one messaging via the W3C Web Crypto API with IndexedDB storage",
            "Software simulation of the BB84 quantum key distribution protocol with an 11% QBER abort threshold (src/lib/bb84.ts)",
        ],
    )
    p(doc, "Out of Scope:", first_line=False, bold=True)
    bullets(
        doc,
        [
            "Physical quantum optical laser hardware or dedicated fiber-optic quantum channels",
            "Multi-node production blockchain consortiums across distributed campuses (prototype executed on a local container)",
            "Automated AI-driven portal scraping for instant identity verification (formulated under future engineering works)",
            "Native mobile operating system compilation (iOS/Android binary builds) or real-time voice and video streaming",
            "Enterprise Single Sign-On (SAML 2.0 / Shibboleth) integration with institutional Active Directory servers",
        ],
    )

    h(doc, "1.6 AI Academic Moderation", 2)
    p(
        doc,
        "To protect the scholarly focus of the forum and prevent spam, social chatter, or misplaced inquiries from diluting "
        "academic discussions, QCampus Connect incorporates automated AI academic moderation directly into the question "
        "submission pipeline. Before an inquiry is committed to the database or broadcast to faculty feeds, the Mercury 2 model "
        "(Inception Labs, 2025) inspects the question title and details against the user's selected Department and canonical Topic. "
        "The model verifies that the problem formulation is academically rigorous and strictly pertains to the designated discipline. "
        "If an inquiry is conversational, non-academic, or cross-domain, the verifier intercepts the post prior to publication, "
        "presenting targeted feedback that directs the student to refine their submission. This automated filtering safeguards "
        "faculty time and ensures that the platform functions strictly as an authoritative academic repository.",
    )


# ── Chapter 2 ──────────────────────────────────────────────────────────────

def chapter_2(doc):
    h(doc, "Chapter 2")
    h(doc, "Literature Review", 1)
    h(doc, f"2.1 Academic Communication and Scholarly Discussion Platforms", 2)
    p(
        doc,
        "Academic dialogue is the cornerstone of higher education. Historically, universities conducted coursework clarification "
        "through physical office hours, recitation sections, and lecture halls. As student enrollments expanded, institutions "
        "adopted digital communication tools to maintain student-lecturer contact. However, current software solutions in universities "
        "fall into two flawed categories: rigid Learning Management System (LMS) forums or informal commercial chat applications.",
    )
    p(
        doc,
        "Learning Management Systems such as Canvas, Moodle, and Blackboard provide built-in discussion boards. While these tools "
        "are institutionally managed, their user experience is notoriously cumbersome. LMS discussion boards suffer from rigid course "
        "silos, meaning students cannot discover discussions across related disciplines or consult faculty in adjacent departments. "
        "Traditional LMS boards also lack instant push delivery, operating on slow page refreshes that discourage lively "
        "academic debate. Consequently, student participation rates on LMS discussion forums remain low.",
    )
    p(
        doc,
        "Specialized academic question-and-answer tools such as Piazza (Piazza Technologies, 2024) and Stack Overflow demonstrated "
        "the power of threaded, upvoted academic inquiry. Piazza proved that students engage actively when discussion boards mimic "
        "modern social feeds. Nevertheless, commercial platforms operate as external third-party software vendors, frequently "
        "introducing paywalls, commercial advertisements, and data monetization practices. Crucially, they lack cryptographic "
        "identity verification tied to university roles and offer zero immutable auditability for institutional record preservation.",
    )
    p(
        doc,
        "Faced with these limitations, students and faculty universally default to commercial messaging applications like WhatsApp "
        "(Meta, 2023). While WhatsApp delivers instant mobile messaging, its adoption for higher education communication creates "
        "severe dysfunction. It requires lecturers to expose personal phone numbers, inviting late-night calls and unsolicited messages. "
        "In practice, WhatsApp groups are unstructured: questions and answers are buried in linear chat streams, academic files cannot "
        "be indexed, and answers cannot be referenced by future student cohorts. Most importantly, WhatsApp allows \"Delete for Everyone\" "
        "and offers no mechanism to cryptographically prove that an announcement, assignment instruction, or submission was made.",
    )

    h(doc, "2.1.6 AI-Based Content Moderation", 2)
    p(
        doc,
        "Automated content moderation is essential for maintaining the focus and intellectual standard of online academic "
        "environments. Traditional moderation architectures rely on static keyword blacklists and regular expressions to block "
        "unwanted text. However, rule-based filtering lacks semantic awareness, failing to distinguish between genuine technical "
        "inquiries that happen to use informal words and non-academic chatter disguised with academic terminology. Recent developments "
        "in Large Language Models (LLMs) have introduced contextual text classification capable of evaluating complex semantic intent "
        "(Inception Labs, 2025). Models such as Mercury 2 can read the full context of a question and determine whether both the "
        "title and body represent authentic academic coursework inquiries, while simultaneously verifying alignment with specific "
        "departmental subject domains.",
    )
    p(
        doc,
        "A vital consideration when deploying language models for programmatic content verification is the enforcement of structured "
        "JSON outputs. Conversational text generation produces variable prose that requires complex, brittle parsing logic on client "
        "applications. By utilizing structured JSON schemas (such as response_format: { type: 'json_object' }), the language model is "
        "constrained to output deterministic, machine-readable validation objects containing explicit boolean flags (such as titleOk, "
        "detailsOk, and departmentMatch) and classified topic strings. This enables deterministic programmatic evaluation in application "
        "logic without ambiguous natural language parsing.",
    )
    p(
        doc,
        "Additionally, OpenAI-compatible chat completion APIs (/v1/chat/completions) enable low-latency classification in modern web "
        "applications. Because these HTTP REST endpoints adhere to standardized request formats, single-page applications can invoke "
        "inference directly during the form validation cycle. High-throughput architectures such as Mercury 2 provide inference "
        "latencies of a few hundred milliseconds, ensuring that pre-submission academic screening occurs synchronously without degrading "
        "the responsiveness of the user interface.",
    )

    h(doc, "2.2 Real-Time Cloud Persistence and Reactive State", 2)
    p(
        doc,
        "Traditional HTTP polling introduces significant network latency and server overhead for interactive campus applications. "
        "Modern web systems utilize persistent WebSocket connections to enable push-based state synchronization. Convex utilizes "
        "an end-to-end reactive architecture where client components subscribe directly to database queries over WebSockets "
        "(Convex Development Team, 2024). When a mutation executes—such as a student posting a question or a lecturer submitting "
        "an answer—the database automatically recalculates affected query subscriptions and pushes minimal diffs to connected browsers "
        "within 50 to 100 milliseconds. This eliminates polling while providing instant user interface reactivity.",
    )

    h(doc, "2.3 Symmetric and Asymmetric Cryptography Systems", 2)
    p(
        doc,
        "Symmetric encryption ciphers such as AES-GCM (Advanced Encryption Standard in Galois/Counter Mode) utilize a single secret "
        "key for encryption and authenticated decryption, delivering high mathematical throughput and tamper detection (National "
        "Institute of Standards and Technology, 2001). Asymmetric cryptosystems like RSA-OAEP utilize distinct public and private "
        "key pairs, allowing parties to establish secure communication without sharing private credentials in advance (Rivest et al., "
        "1978; Diffie & Hellman, 1976). Established messaging protocols, such as Signal's Extended Triple Diffie-Hellman (Marlinspike "
        "& Perrin, 2016), combine asymmetric key negotiation with symmetric payload ciphers. {APP} adopts this hybrid approach: "
        "the browser W3C Web Crypto API executes AES-GCM-256 for message payload encryption, while 2048-bit RSA-OAEP keypairs manage "
        "user identity and key exchange (Mozilla Developer Network, 2024). Private keys remain strictly within client-side IndexedDB storage.",
    )

    h(doc, "2.4 Permissioned Distributed Ledgers and Smart Contracts", 2)
    p(
        doc,
        "Public distributed ledgers maintain tamper-evident event histories across decentralized networks (Nakamoto, 2008). "
        "Ethereum advanced distributed ledger technology by introducing deterministic smart contracts executed on the Ethereum "
        "Virtual Machine (Wood, 2014). However, public networks impose volatile transaction gas fees and expose student transactions "
        "to public scrutiny. In institutional environments, permissioned distributed ledgers like Hyperledger Besu running Quorum "
        "Byzantine Fault Tolerance (QBFT) consensus provide zero-gas transaction execution, high throughput, and deterministic finality "
        "(Hyperledger Foundation, 2024; Castro & Liskov, 2002). Smart contracts authored in Solidity 0.8.20 enforce programmatic state "
        "validation rules on-chain (Ethereum Foundation, 2024).",
    )

    h(doc, "2.5 Quantum Key Distribution and the 11% QBER Limit", 2)
    p(
        doc,
        "The BB84 protocol (Bennett & Brassard, 2014/1984) establishes secret session keys between two endpoints using polarized "
        "photon states. Under quantum mechanics principles, any interception by an unauthorized eavesdropper alters quantum states "
        "due to the Heisenberg uncertainty principle and the No-Cloning Theorem (Nielsen & Chuang, 2010). Following photon transmission "
        "and basis reconciliation (sifting), communicating parties evaluate the Quantum Bit Error Rate (QBER). Rigorous mathematical "
        "proofs by Shor and Preskill (2000), Gisin et al. (2002), and Scarani et al. (2009) prove that under ideal BB84 conditions, "
        "information reconciliation and privacy amplification can extract an uncompromised secret key only when the QBER remains "
        "strictly below approximately 11%. If the QBER exceeds 0.11, eavesdropping noise invalidates the channel, requiring session "
        "abort. {APP} models this mathematical threshold in its TypeScript simulation (src/lib/bb84.ts).",
    )

    h(doc, "2.6 Dual-Layer Role-Based Access Control", 2)
    p(
        doc,
        "Traditional web applications store role attributes in standard relational databases. However, database administrators "
        "retain capabilities to modify role tables arbitrarily. Dual-layer access control pairs fast application-level database "
        "permissions with immutable distributed ledger assertions. In {APP}, user roles are managed within Convex document collections "
        "and mirrored onto the private Besu blockchain through administrative smart contract invocations.",
    )

    h(doc, "2.7 Comparative Review of Related Systems", 2)
    p(
        doc,
        f"Table 2.1 contrasts the technical characteristics of {APP} against existing commercial and academic platforms.",
    )
    table(
        doc,
        ["System", "Academic Q&A Forum", "Lecturer Rank Badges", "Real-Time Push", "Ledger Audit Trail", "Private Follow-up DM"],
        [
            ["WhatsApp / Telegram", "No (Linear Chat)", "None (Unverified)", "High (WebSockets)", "None", "Native (Primary)"],
            ["Canvas / Moodle LMS", "Yes (Course Silo)", "Role Only (No Rank)", "Low (HTTP Polling)", "None (Mutable SQL)", "None / Email"],
            ["Piazza / Ed Discussion", "Yes (Proprietary)", "Instructor Tag", "Moderate (Cloud)", "None (Cloud Database)", "Limited"],
            ["Reddit / Stack Overflow", "Yes (Public)", "Karma Scores", "Moderate (Polling/WS)", "None (Silent Edits)", "Basic Chat"],
            ["Public Web3 dApps", "No (Token Chat)", "Wallet Address", "Low (Block Polling)", "Full On-Chain (High Gas)", "Wallet-to-Wallet"],
            ["Mercury 2 (Inception Labs)", "AI Academic Moderation", "N/A (Automated Filter)", "High (REST API)", "Deterministic JSON", "Pre-Submission Guard"],
            [f"{APP} (This Project)", "Yes (Department-Targeted)", "Verified (Dr, Prof, Eng)", "High (Convex WS)", "Private Besu (QBFT)", "End-to-End Encrypted"],
        ],
    )

    h(doc, "2.8 Identified Domain Gaps", 2)
    p(
        doc,
        "This literature review reveals three primary deficiencies in contemporary campus software:",
    )
    numbered(
        doc,
        [
            "Absence of an Open, Verified Academic Forum: Universities lack an accessible platform where students can seek coursework help and share findings without infringing on faculty personal phone numbers or standing in office queues.",
            "Lack of Verified Academic Authority: Existing social chat tools treat all members identically, failing to distinguish authoritative answers authored by verified departmental scholars from casual peer speculation.",
            "Vulnerability of Academic Records to Tampering: Current learning platforms rely exclusively on mutable cloud databases where audit logs can be altered, pruned, or disputed without cryptographic verification.",
        ],
    )


# ── Chapter 3 ──────────────────────────────────────────────────────────────

def chapter_3(doc):
    h(doc, "Chapter 3")
    h(doc, "Methodology and System Design", 1)
    h(doc, "3.1 Agile Development Framework and Timeline", 2)
    p(
        doc,
        "The project was executed using an iterative Agile development methodology organized into five two-week engineering sprints. "
        "This iterative framework allowed the team to construct software components incrementally, validate cryptographic pipelines, "
        "and refine the integration between cloud serverless functions and the local Besu node.",
    )
    table(
        doc,
        ["Sprint Phase", "Duration", "Core Engineering Deliverables"],
        [
            ["Sprint 1: UI Shell & Routes", "Weeks 1–2", "Vite + React 19 single-page shell, navigation bar, auth forms, responsive layout"],
            ["Sprint 2: Convex Backend & Q&A", "Weeks 3–4", "Database collections, department routing, reactive queries, mutations, file storage"],
            ["Sprint 3: Cryptography & BB84", "Weeks 5–6", "W3C Web Crypto integration (RSA-OAEP/AES-GCM), IndexedDB keyring, BB84 simulation"],
            ["Sprint 4: Smart Contract & Ledger", "Weeks 7–8", "Solidity contract MessageVerifier.sol, Podman Besu container, Ethers.js bridge"],
            ["Sprint 5: Verification & Department Features", "Weeks 9–10", "Department management, lecturer ranks, sorting/filtering, notifications, audit reporting"],
        ],
    )

    h(doc, "3.2 System Architecture Overview", 2)
    p(
        doc,
        f"{APP} employs a three-tier hybrid architecture comprising Presentation, Application, and Verification layers. High-frequency "
        "user interactions (such as browsing Q&A feeds, submitting coursework inquiries, and streaming answers) execute through the "
        "cloud Application layer. Cryptographic audit digests and institutional role registrations are committed asynchronously to the "
        "Verification layer.",
    )
    table(
        doc,
        ["Architecture Tier", "Technology Stack", "Execution Context", "Core Functional Responsibility"],
        [
            ["Presentation Layer", "React 19, TypeScript, Vite, Tailwind CSS", "Client Web Browser", "User interface, department filters, client encryption, BB84 simulation"],
            ["Application Layer", "Convex Serverless Platform", "Convex Cloud / Local Runtime", "Real-time reactive queries, document persistence, department routing, notifications"],
            ["Verification Layer", "Hyperledger Besu, Solidity 0.8.20, Ethers.js v6", "Local Container (127.0.0.1:8545)", "Immutable SHA-256 hash logging, on-chain role verification (MessageVerifier.sol)"],
        ],
    )

    h(doc, "3.3 Convex Schema and Data Model", 2)
    p(
        doc,
        "The application database schema is defined in convex/schema.ts. Table 3.1 details the collections and indexing strategies.",
    )
    table(
        doc,
        ["Collection Name", "Schema Fields", "Secondary Indexes", "System Purpose"],
        [
            ["departments", "name, code, description, isActive", "by_name", "Academic departments for question routing"],
            ["users", "fullName, email, role, rank, departmentId, departmentName, indexNumber, staffId, walletAddress, verificationStatus", "by_email, by_indexNumber, by_staffId, by_department, by_verificationStatus, by_walletAddress", "Student and lecturer profiles with academic ranks and department affiliations"],
            ["questions", "title, body, hashtags, departmentId, departmentName, topic, answerCount, answered, attachmentStorageId, attachmentName", "by_createdAt, by_department, by_departmentId_and_createdAt, by_topic, by_authorId_and_createdAt", "Department-targeted academic inquiries and research discussions"],
            ["answers", "questionId, authorId, body, departmentId, departmentName, attachmentStorageId, attachmentName", "by_questionId_and_createdAt", "Authoritative academic answers restricted to department faculty"],
            ["notifications", "userId, actorId, questionId, type, title, body, read", "by_userId_and_createdAt", "Real-time alerts for department questions and answer replies"],
            ["verificationRequests", "userId, school, idNumber, departmentId, departmentName, evidenceStorageId, approved", "by_userId", "Queue for vetting student IDs and lecturer academic credentials"],
            ["chatRooms", "participantIds, bb84Key, bb84Fingerprint", "by_participantKey", "Auxiliary 1-on-1 private rooms for individual consultations"],
            ["chatRoomMembers", "roomId, userId, unreadCount", "by_userId_and_updatedAt", "Member room status and unread counters"],
            ["messages", "text, iv, isEncrypted, blockchainTxHash, attachments", "by_roomId_and_createdAt", "Encrypted private messages and payload transaction hashes"],
            ["admins", "email, passwordHash, sessionToken", "by_email, by_sessionToken", "Administrative credentials and audit session governance"],
        ],
    )

    h(doc, "3.4 Cryptographic Engineering Pipeline", 2)
    h(doc, "3.4.1 RSA Identity Key Generation and Storage", 3)
    p(
        doc,
        "When an account is registered or authenticated, CryptographicLoginGatekeeper (src/App.tsx) triggers "
        "generateClientIdentityKeys() in src/services/web3Service.ts. The browser W3C Web Crypto API generates an RSA-OAEP 2048-bit "
        "keypair. The public key is exported as a SubjectPublicKeyInfo (SPKI) Base64 string and persisted to the user's Convex "
        "profile. The private CryptoKey object is stored securely within the browser's local IndexedDB keyring (Mozilla Developer "
        "Network, 2024).",
    )
    h(doc, "3.4.2 AES-GCM Payload Encryption", 3)
    p(
        doc,
        "Direct message payloads and attached files are encrypted client-side using 256-bit AES-GCM (src/services/keyExchange.ts). "
        "The client generates a 12-byte Initialization Vector (IV) for each message. Ciphertext and IV are transmitted to Convex, "
        "preventing plaintext exposure on database servers (National Institute of Standards and Technology, 2001).",
    )
    h(doc, "3.4.3 On-Chain Hash Recording via Ethers.js", 3)
    p(
        doc,
        "When an academic answer or sensitive record requires non-repudiation, the client computes the SHA-256 digest of the payload. "
        "The application invokes logHashToBlockchain() in src/services/web3Service.ts, connecting to the local Besu node at "
        "127.0.0.1:8545 via JsonRpcProvider. The smart contract method recordHash(messageId, messageHash, sender, receiver) executes "
        "on MessageVerifier.sol, permanently committing the digest to the ledger (Ethers.js Contributors, 2024).",
    )

    h(doc, "3.5 BB84 Quantum Key Distribution Simulation", 2)
    p(
        doc,
        "The educational BB84 simulation module (src/lib/bb84.ts) models quantum key generation using cryptographically secure random "
        "numbers (window.crypto.getRandomValues). The process executes across four distinct stages:",
    )
    numbered(
        doc,
        [
            "State Preparation: Alice generates random bits and selects random preparation bases (Rectilinear + or Diagonal ×).",
            "Measurement & Sifting: Bob measures incoming qubits using randomly chosen bases; bases are compared publicly to retain matching instances (sifted key).",
            "Error Estimation: Quantum Bit Error Rate (QBER) is determined by calculating discrepancies across a published sample subset.",
            "Key Distillation & Abort: If QBER exceeds 0.11 (11%), the module aborts key distillation (Scarani et al., 2009). If QBER ≤ 0.11, a 256-bit AES key is distilled and displayed as a hexadecimal fingerprint (XXXX-XXXX-XXXX).",
        ],
    )

    h(doc, "3.6 Smart Contract Design", 2)
    p(
        doc,
        "MessageVerifier.sol (Solidity 0.8.20) maintains immutable hash logs and role bindings on the private Besu blockchain. "
        "Key contract methods include:",
    )
    bullets(
        doc,
        [
            "recordHash(string messageId, bytes32 messageHash, address sender, address receiver): Commits payload digest; reverts on duplicate ID.",
            "verifyHash(string messageId): Read-only view returning recorded bytes32 digest for tamper verification.",
            "verifyUser(address user, string role): Admin-restricted method recording verified institutional role on-chain.",
            "verifyUserWithIndex(address user, string role, string indexNumber): Binds student index number (e.g., UEB3509022) to wallet address on-chain.",
            "verifyUserWithStaffId(address user, string role, string staffId): Binds lecturer staff ID (e.g., PS123) to wallet address on-chain.",
            "getUserRole(address user), getUserIndexNumber(address user), getUserStaffId(address user): View functions returning on-chain identity records.",
        ],
    )

    h(doc, "3.7 Data Flow Sequences", 2)
    p(
        doc,
        "Question Submission Flow (with AI Verification): Student enters question title and details → Form enforces client-side hard character constraints (Title: 100 max, Details: 500 max with 12-character minimum, Hashtags: 100 max) with real-time reactive counter telemetry → Pre-flight guards validate lengths prior to network dispatch to prevent token waste → Student selects target department and topic → Optionally attaches research document or code file → Client triggers AI academic verification via verifyAcademicQuestion() → Inputs are defensively truncated before payload construction → Mercury 2 API evaluates title, details, department, and topic within a 1500-token budget at temperature 0.5 → If validation fails, specific inline field errors or length warnings are displayed and submission is blocked → If verified, client generates SHA-256 payload digest and commits hash to local Hyperledger Besu blockchain → Convex askQuestion mutation executes and persists question → Real-time department_question notification dispatched to verified lecturers in target department.",
    )
    p(
        doc,
        "Academic Q&A Workflow (Primary): Verified lecturer reviews inquiry on QAPage → Verified lecturer posts academic answer with rank badge (Doctor, Professor, Engineer) → Answer saved and broadcast to forum feed via Convex reactive subscription → Student receives question_reply notification → Optional: Student clicks \"Direct Message\" to initiate private encrypted follow-up consultation.",
    )
    p(
        doc,
        "Verification & Audit Workflow: User submits institutional credentials and ID photo → Administrator reviews request in Admin portal → Admin assigns department and approves verification → System records role and identity on Besu contract → For audited interactions, client computes SHA-256 payload digest → Besu executes recordHash() → Transaction hash saved to Convex record → Administrator inspects audit desk, comparing mutable Convex timestamp against immutable Besu block timestamp.",
    )

    h(doc, "3.8 User Interface Routing", 2)
    p(
        doc,
        "The interface includes eleven primary routes: LandingPage, Register, Login, ForgotPassword, QAPage (academic forum), "
        "Explore, MessagesList (auxiliary chat), VerifyProfile, EditProfile, Admin, and BB84 Key Setup.",
    )

    h(doc, "3.9 Threat Matrix and Mitigation Strategies", 2)
    p(
        doc,
        "Table 3.2 details the primary security threats addressed during system design.",
    )
    table(
        doc,
        ["Threat Vector", "Institutional Risk", "Engineering Mitigation"],
        [
            ["Convex DB Modification", "Unauthorized payload alteration by database admin", "SHA-256 digest on Besu ledger fails verifyHash() comparison"],
            ["Unverified Lecturer Impersonation", "Malicious user masquerading as faculty member", "Strict admin identity review + immutable Besu verifyUser() role binding"],
            ["Cross-Department Answering", "Unqualified users answering domain-specific inquiries", "Convex addAnswer mutation strictly verifies user is a lecturer in target department"],
            ["Non-academic or cross-domain question", "Forum pollution, spam, and misdirection of faculty attention", "Mercury 2 AI moderation with department/topic whitelist check"],
            ["Oversized / DoS payload injection", "Exhaustion of LLM inference tokens and memory bloat", "Client maxLength + pre-flight JS guards + defensive verifier slicing (100/500 chars)"],
            ["Cloud Eavesdropping", "Server administrator inspecting private consultation", "Payloads encrypted via AES-GCM-256; private keys stay in client IndexedDB"],
            ["Quantum Channel Eavesdropping", "Interception of simulated quantum exchange", "Session abort automatically enforced whenever QBER exceeds 11%"],
        ],
    )

    h(doc, "3.10 AI Academic Moderation Pipeline", 2)
    p(
        doc,
        "To safeguard the academic standard of the forum and prevent irrelevant or non-academic submissions, QCampus Connect "
        "implements an automated AI content moderation pipeline in src/services/academicVerifier.ts, invoked during question submission in src/route/QAPage.tsx.",
    )
    p(
        doc,
        "The core verification routine is verifyAcademicQuestion(title, details, department, userSelectedTopic). "
        "The function takes the user-provided title, extended body details, selected target department name, and the user's selected topic.",
    )
    p(
        doc,
        "During execution, verifyAcademicQuestion constructs an HTTP POST request to the Mercury 2 completion endpoint "
        "(https://api.inceptionlabs.ai/v1/chat/completions) with temperature 0.5 and max_tokens 1500. The call employs a comprehensive "
        "system prompt enforcing four strict academic criteria: titleOk (must name a specific, real academic subject), detailsOk (must state a real "
        "academic question or problem a lecturer can answer), departmentMatch (subject matter must belong to the selected department), and "
        "topicMatch (the selected topic must be academic and match the inquiry content). By specifying response_format: { type: 'json_object' }, "
        "the model returns a deterministic JSON evaluation schema:",
    )
    code_block(
        doc,
        "{\n"
        "  \"isAcademic\": boolean,\n"
        "  \"titleOk\": boolean,\n"
        "  \"detailsOk\": boolean,\n"
        "  \"departmentMatch\": boolean,\n"
        "  \"topicMatch\": boolean,\n"
        "  \"reason\": string\n"
        "}",
    )
    p(
        doc,
        "The verifier evaluates isAcademic as true strictly when titleOk, detailsOk, departmentMatch, and topicMatch are all true. "
        "If the Mercury 2 service experiences network failure, HTTP error codes, or invalid payloads, the system sets error: true and "
        "informs the student that the verification service is temporarily unavailable, prompting a retry without silently allowing unverified content.",
    )
    p(
        doc,
        "When an inquiry fails verification, QAPage halts submission and displays actionable user-facing rejection messages targeting the exact failing field:",
    )
    bullets(
        doc,
        [
            "If titleOk is false: \"Your title doesn't look like a real academic topic. Please use a clear subject name like 'RSA encryption' or 'Operating Systems scheduling'.\"",
            "If detailsOk is false: \"Your details don't contain a real academic question. Please describe what you're trying to understand so a lecturer can help.\"",
            "If departmentMatch is false: \"Your question doesn't match the selected Department. Please choose the correct department or rewrite your question.\"",
            "If topicMatch is false: \"Your question doesn't match the selected Topic. Please pick a different topic or edit your question.\"",
            "If token length limit is hit: \"Your question is too long to verify — please shorten it.\"",
        ],
    )

    h(doc, "3.10.1 Input Boundaries, Character Limits, and Counter Telemetry", 3)
    p(
        doc,
        "To guarantee interface responsiveness, prevent token depletion, and maintain high pedagogical signal-to-noise ratios, the "
        "question submission form in src/route/QAPage.tsx enforces strict character boundaries across all user inputs:",
    )
    bullets(
        doc,
        [
            "Question Title (100 Characters Maximum): Enforces a hard limit of 100 characters on the title input via the HTML5 maxLength attribute. A live reactive counter ({currentLength}/100) provides continuous visual feedback, rendering in subtle outline grey under standard conditions, transitioning to alert red when reaching 90% capacity (90+ characters), and escalating to bold red at exactly 100 characters.",
            "Question Details (500 Characters Maximum, 12 Characters Minimum): Enforces a hard limit of 500 characters on the details textarea via maxLength={500}. A right-aligned live counter ({currentLength}/500) displays character progress, turning red at 450+ characters (90%) and bold red at 500 characters. Keystrokes beyond 500 are blocked automatically by the browser engine, preventing paste overflow attacks. Concurrently, a pre-flight validation check enforces a minimum threshold of 12 characters, rejecting one-word or empty inquiries before network transmission.",
            "Question Hashtags (100 Characters Maximum): Implements a 100-character ceiling on optional indexing tags via maxLength={100}, backed by a live ({currentLength}/100) reactive counter with 90% and 100% color escalation.",
            "Multi-Layer Client Validation Guards: Before triggering verifyAcademicQuestion, the handleAsk submission handler runs defensive JavaScript checks on trimmed strings. If title.trim().length === 0, details.trim().length < 12, title.length > 100, body.length > 500, or hashtags.length > 100, submission is halted instantly and descriptive alerts are rendered in the moderation error banner.",
            "Defensive Moderation Area Telemetry: Even if a malicious actor bypasses browser maxLength attributes (e.g., via browser developer tools or DOM manipulation), the form's error container defensively computes string lengths and renders explicit character overflow diagnostics (for example, 'Your details are too long (564/500). Please shorten to 500 characters.') alongside standard moderation alerts.",
        ],
    )

    h(doc, "3.10.2 Architectural and Token Budget Rationales", 3)
    p(
        doc,
        "The introduction of rigorous text boundaries and live counter telemetry addresses four critical architectural and economic imperatives:",
    )
    numbered(
        doc,
        [
            "Inference Token Budget Optimization: Large language model verification charges and processing latencies are directly proportional to token counts in the prompt payload. Without input bounds, students could paste multi-page laboratory manuals or uncompiled codebase dumps, incurring massive token costs per submission. Limiting titles to 100 characters and details to 500 characters bounds the input token consumption to a predictable, minimal envelope.",
            "Elimination of Completion Truncation (finish_reason === 'length'): Mercury 2 operates with a maximum generation budget of max_tokens: 1500 (expanded from an initial prototype budget of 256). In early testing, unbounded user questions consumed disproportionate token headroom, leaving insufficient capacity for the model to generate its structured JSON output. This resulted in the API returning finish_reason: 'length' and truncating the JSON string mid-stream. Enforcing 100-character and 500-character boundaries guarantees that the model has ample generation budget to return a complete, valid JSON object.",
            "Defensive In-Depth Payload Sanitization: In src/services/academicVerifier.ts, inputs are defensively sliced before constructing the JSON payload (title to 100 chars, details to 500 chars, department to 200 chars, and topic to 100 chars). Furthermore, if the Mercury 2 completion endpoint ever signals finish_reason === 'length', the verifier catches the condition gracefully, logs the event, and returns isAcademic: false with the clear directive: 'Your question is too long to verify — please shorten it.'",
            "Scholarly Brevity and Faculty Reading Efficiency: On a university-wide forum, faculty members review dozens of inquiries daily across departmental feeds. Unbounded, rambling prose impedes quick triage. Restricting titles to 100 characters forces students to synthesize their inquiry into a precise academic subject (e.g., 'Cache Coherence in Multi-Core Architectures'), while 500-character details encourage clear, problem-focused explanations without irrelevant narrative padding.",
        ],
    )

    p(
        doc,
        "Environment Variable and Security Limitation: The integration authenticates using the VITE_MERCURY_KEY environment variable. "
        "In the prototype, accessing this key directly via import.meta.env on the client exposes the credential in client-side JavaScript bundles. "
        "While acceptable for prototype testing and evaluation, production deployments must proxy the verification request through a secure "
        "Convex serverless action so that API credentials never reach the browser.",
    )


# ── Chapter 4 ──────────────────────────────────────────────────────────────

def chapter_4(doc):
    h(doc, "Chapter 4")
    h(doc, "Implementation, Testing, and Results", 1)
    h(doc, "4.1 Implementation Environment and Tooling", 2)
    p(
        doc,
        f"{APP} was implemented and evaluated on development workstations running Fedora 41 Workstation and Windows 11 Enterprise "
        "(via Podman and Docker container engines). The application frontend was constructed using React 19, TypeScript, and Vite 8. "
        "The backend serverless layer ran on Convex 1.40.0. The private blockchain was instantiated using Hyperledger Besu running QBFT "
        "consensus, with smart contracts compiled via Hardhat targeting Solidity 0.8.20.",
    )
    table(
        doc,
        ["Subsystem", "Technology / Library", "Operational Role"],
        [
            ["Frontend Framework", "React 19 + TypeScript", "Single-page interface with Vite 8 HMR (localhost:5173)"],
            ["Application Backend", "Convex Platform (v1.40.0)", "Real-time reactive queries, department routing, document storage"],
            ["Permissioned Ledger", "Hyperledger Besu (v24.x)", "QBFT consensus, ChainId 1337, zero gas price (localhost:8545)"],
            ["Smart Contract Engine", "Hardhat + Solidity 0.8.20", "MessageVerifier.sol compilation and contract deployment"],
            ["Client Cryptography", "W3C Web Crypto API", "In-browser RSA-OAEP 2048 and AES-GCM-256 cryptographic operations"],
        ],
    )

    h(doc, "4.2 Frontend Implementation and Q&A Engine", 2)
    p(
        doc,
        "The primary user experience resides in src/route/QAPage.tsx, which implements the academic question-and-answer workspace. "
        "The page integrates several key architectural components:",
    )
    bullets(
        doc,
        [
            "Department Routing and Filtering: Students can filter their feed by \"My Feed\", \"My Questions\", or select a specific academic department from a dynamic dropdown. Lecturers are automatically directed to questions targeted to their verified department.",
            "Multi-Criteria Question Sorting: Users can sort question feeds by Recently Posted, Oldest First, Most Answers, or Unanswered (questions awaiting lecturer response), optimizing discoverability.",
            "Input Character Boundary Controls and Real-Time Telemetry: The question submission modal in src/route/QAPage.tsx implements hard constraints across all input surfaces (Title: 100 characters max, Details: 500 characters max with a 12-character minimum threshold, Hashtags: 100 characters max). Interactive live counters render real-time character metrics with three-phase reactive styling (neutral grey → red at 90% → bold red at 100%), backed by client-side pre-flight validation and HTML5 maxLength constraints to eliminate paste overflow and conserve AI verification tokens.",
            "Lecturer Profile Badges: The LecturerProfileBadge component (src/components/LecturerProfileBadge.tsx) displays the lecturer's verified academic rank (\"Dr.\", \"Prof.\", \"Eng.\") alongside their department label, establishing authority.",
            "Multi-Format Attachment Tools: The AttachmentTools component (src/components/AttachmentTools.tsx) allows users to upload and preview research PDFs, documents, code files, and images within questions and answers.",
            "Departmental Administration: Admin.tsx provides administrative tools to create, edit, activate, or deactivate academic departments, and review student and faculty identity credentials.",
        ],
    )
    p(doc, "Listing 4.1 — Department Question Dispatch and Notification (convex/qchat.ts, shortened)", first_line=False, italic=True)
    code_block(
        doc,
        "export const askQuestion = mutation({\n"
        "  args: { title: v.string(), body: v.string(), departmentId: v.id('departments'), ... },\n"
        "  handler: async (ctx, args) => {\n"
        "    const currentUser = await requireUser(ctx, args.sessionToken);\n"
        "    const questionId = await ctx.db.insert('questions', {\n"
        "      authorId: currentUser._id, title: args.title, body: args.body,\n"
        "      departmentId: args.departmentId, departmentName: dept.name, answerCount: 0, answered: false\n"
        "    });\n"
        "    // Notify all lecturers in this department\n"
        "    const lecturers = await ctx.db.query('users')\n"
        "      .withIndex('by_department', q => q.eq('departmentId', args.departmentId))\n"
        "      .filter(q => q.eq(q.field('role'), 'lecturer')).collect();\n"
        "    for (const lecturer of lecturers) {\n"
        "      await ctx.db.insert('notifications', {\n"
        "        userId: lecturer._id, type: 'department_question', title: `New Question in ${dept.name}`\n"
        "      });\n"
        "    }\n"
        "    return { questionId };\n"
        "  }\n"
        "});",
    )

    h(doc, "4.3 Backend State Management and Security Enforcements", 2)
    p(
        doc,
        "Convex backend functions enforce strict institutional business logic. Crucially, the addAnswer mutation validates that "
        "the responder is a verified lecturer belonging to the question's target department. If a student or a lecturer from an "
        "unrelated department attempts to submit an answer, the mutation throws an exception, preventing unverified advice from "
        "diluting academic threads.",
    )

    h(doc, "4.4 Smart Contract Interoperability via Ethers.js", 2)
    p(
        doc,
        "Client browsers connect to MessageVerifier.sol using Ethers.js v6 over JSON-RPC. When an academic answer or sensitive record "
        "is submitted, logHashToBlockchain() transmits the SHA-256 digest to Besu. The contract verifies that the message ID is unique "
        "and writes the payload hash to permanent ledger state.",
    )
    p(doc, "Listing 4.2 — On-Chain Hash Recording (src/services/web3Service.ts, shortened)", first_line=False, italic=True)
    code_block(
        doc,
        "const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);\n"
        "const tx = await contract.recordHash(msgId, sha256Digest, wallet.address, ethers.ZeroAddress, {\n"
        "  gasLimit: 500000,\n"
        "  gasPrice: 0,\n"
        "});\n"
        "const receipt = await tx.wait();\n"
        "return receipt.hash;",
    )

    h(doc, "4.5 Cryptographic and BB84 Verification", 2)
    p(
        doc,
        "The BB84 engine generates 256 sifted key bits and evaluates quantum channel noise. During simulated eavesdropping tests, "
        "when bit discrepancies exceed 11%, the simulation triggers an immediate session abort, mirroring theoretical quantum channel bounds.",
    )

    h(doc, "4.5.1 AI Academic Moderation and Input Constraint Verification", 3)
    p(
        doc,
        "The Mercury 2 academic verification engine (src/services/academicVerifier.ts) and the associated client form controls "
        "(src/route/QAPage.tsx) were subjected to rigorous functional and boundary testing. Testing encompassed valid coursework inquiries, "
        "informal social messages, cross-domain edge cases, and boundary-condition stress tests.",
    )
    p(
        doc,
        "In positive test scenarios, legitimate academic questions (for example, Department: 'Computer Science And Informatics', "
        "Title: 'Time Complexity of QuickSort with Median-of-Three Partitioning', Details: 'Analyzing best, average, and worst case Big-O bounds...', "
        "Topic: 'Algorithms') were evaluated. Mercury 2 returned { isAcademic: true, titleOk: true, detailsOk: true, departmentMatch: true, "
        "topicMatch: true }, allowing the submission to proceed to on-chain hash anchoring and Convex database persistence.",
    )
    p(
        doc,
        "In negative and adversarial scenarios, the verification pipeline intercepted invalid inquiries. For example, when submitting "
        "an inquiry under the Department 'Cyber Security' with the Title 'Who has the Cyber Securities courses?' and the Topic 'Human Read', "
        "Mercury 2 evaluated the inquiry against strict academic relevance rules. Because 'Human Read' is not a legitimate academic "
        "topic, Mercury 2 returned { isAcademic: false, titleOk: false, detailsOk: false, departmentMatch: false, topicMatch: false }. "
        "The interface immediately blocked submission and displayed specific inline field errors. Similarly, conversational greetings "
        "('Hey anyone free for drinks tonight?') were rejected with titleOk: false, confirming that non-academic postings cannot penetrate the forum.",
    )
    p(
        doc,
        "Boundary and Token Budget Stress Testing: Form input bounds were systematically tested. When typing in the Title field, the browser "
        "strictly prevented entry beyond 100 characters; the live counter transitioned from grey to red at 90 characters, and bold red at 100 characters. "
        "When attempting to paste a 1,200-character abstract into the Details textarea, the input was automatically truncated at exactly 500 characters, "
        "with the counter reaching 500/500 in bold red. Submitting empty titles or details with fewer than 12 characters was immediately intercepted "
        "by client-side pre-flight guards without invoking the Mercury 2 API, thereby conserving inference tokens. Furthermore, test payloads with "
        "artificially restricted completion headroom confirmed that any potential finish_reason: 'length' response was safely trapped by the verifier, "
        "returning a user-friendly error message ('Your question is too long to verify — please shorten it.') rather than throwing an unhandled exception.",
    )

    h(doc, "4.6 Verification and Empirical Results", 2)
    h(doc, "4.6.1 Production Build Verification", 3)
    p(
        doc,
        "A full production build was executed from the project root using `pnpm build`. Vite 8 compiled 245 TypeScript/React modules "
        "successfully in 3.53 seconds. The output comprised dist/index.html (0.73 kB), a minified CSS bundle (17.23 kB gzipped), and a "
        "minified JavaScript bundle (262.88 kB gzipped). All academic Q&A, department filtering, lecturer badge, input boundary controls, and "
        "administrative screens compiled cleanly into a single distributable bundle.",
    )
    h(doc, "4.6.2 Functional Verification Suite", 3)
    p(
        doc,
        "Table 4.2 documents the functional test cases executed across system components.",
    )
    table(
        doc,
        ["Functional Subsystem", "Test Scenario", "Observed Outcome", "Result"],
        [
            ["Department Routing", "Student posts question targeting Computer Science", "Question tagged with department; only visible to CS feed and general browse", "PASS"],
            ["Answer Access Control", "Non-CS lecturer attempts to answer CS question", "Mutation throws security error: Only department lecturers can answer", "PASS"],
            ["Department Notifications", "Question posted to target department", "Real-time notification arrives on department lecturers' dashboards", "PASS"],
            ["Lecturer Rank Badges", "Lecturer with Dr/Prof/Eng rank answers", "Rank badge renders beside lecturer name with verified icon", "PASS"],
            ["Question Sorting", "User switches between Recent, Oldest, Unanswered", "Feed reorders instantly according to selected sort criteria", "PASS"],
            ["Attachment Engine", "User attaches PDF research paper to question", "File uploaded to Convex storage; download link available in thread", "PASS"],
            ["Input Length Hard Limits", "Enter >100 chars in Title or >500 chars in Details", "HTML5 maxLength blocks keyboard/paste overflow; live counter turns bold red", "PASS"],
            ["Minimum Detail Guard", "Submit question details with fewer than 12 characters", "Client pre-flight guard halts submission: 'Your question details are too short'", "PASS"],
            ["AI Academic Verifier", "Post a non-academic or cross-domain question", "Rejected with topicMatch=false and inline red error message", "PASS"],
            ["Verifier Token Budgeting", "Submit maximum-capacity 500-character academic question", "Mercury 2 responds within 1500-token budget without truncation", "PASS"],
            ["Besu Hash Commit", "Commit SHA-256 digest of response to Besu", "recordHash executes on-chain; transaction receipt returned", "PASS"],
            ["BB84 Error Abort", "Inject noise into quantum simulation", "Simulation aborts key distillation when QBER > 11%", "PASS"],
        ],
    )

    h(doc, "4.6.3 User Acceptance Walk-Throughs", 3)
    p(
        doc,
        "User acceptance testing was conducted using structured personas representing students, lecturers, and department administrators.",
    )
    table(
        doc,
        ["ID", "Persona", "Walk-Through Task Description", "Observed System Behavior"],
        [
            ["UAT-01", "Student", "Submit question with department selection and code attachment", "Question published with attachment; routed to target department"],
            ["UAT-02", "Lecturer", "Receive notification and post authoritative answer", "Answer published with verified Doctor/Professor rank badge"],
            ["UAT-03", "Student", "Sort questions by \"Unanswered\" to find open problems", "Feed reorders displaying unanswered questions at the top"],
            ["UAT-04", "Student", "Initiate encrypted 1-on-1 direct message from lecturer answer", "Navigates to private room; AES-GCM session initialized"],
            ["UAT-05", "Administrator", "Review audit desk and verify content hash on Besu ledger", "SHA-256 hash verified against immutable block timestamp"],
        ],
    )

    h(doc, "4.6.4 Localhost Latency Benchmarks", 3)
    p(
        doc,
        "Latency benchmarks were gathered on developer hardware (Intel Core i7, 16GB RAM, Fedora 41 with local Besu node) using "
        "performance.now() and block timestamp deltas.",
    )
    table(
        doc,
        ["Operation", "Mean Latency", "Operational Characteristics"],
        [
            ["RSA-OAEP 2048 Keygen", "~140 ms", "Executed once during account registration"],
            ["BB84 256-bit Simulation", "~12 ms", "In-memory basis generation, sifting, and error estimation"],
            ["AES-GCM Payload Encrypt", "~2 ms", "Client-side encryption of text and attachments"],
            ["Convex Reactive Query Sync", "~50 ms", "Cloud WebSocket round-trip state synchronization"],
            ["Mercury 2 Verification Call", "~300–600 ms", "Remote REST API round trip to Inception Labs inference engine"],
            ["Besu recordHash Commit", "~0.35 s", "Local QBFT consensus transaction confirmation"],
        ],
    )

    h(doc, "4.7 Evaluation Against Project Objectives", 2)
    p(
        doc,
        "The prototype successfully fulfilled all eight engineering objectives: (1) Department-targeted academic Q&A operational; "
        "(2) Lecturer academic rank verification functioning; (3) Real-time department notification dispatch active; (4) Multi-criteria "
        "sorting and filtering implemented; (5) Multi-format file attachments operational; (6) AI-based academic content moderation active via Mercury 2; "
        "(7) Hyperledger Besu audit logging confirmed; and (8) Auxiliary encrypted direct messaging working smoothly.",
    )


# ── Chapter 5 ──────────────────────────────────────────────────────────────

def chapter_5(doc):
    h(doc, "Chapter 5")
    h(doc, "Conclusion and Recommendations", 1)
    h(doc, "5.1 System Implementation Summary", 2)
    p(
        doc,
        f"{APP} demonstrates an effective, role-verified academic Q&A platform tailored for higher education institutions. "
        "By replacing intrusive personal phone calls and physical office queues with a structured, department-indexed digital forum, "
        "the platform bridges the academic communication gap between students and lecturers. Authoritative guidance from verified faculty "
        "is democratized across entire student cohorts, while private encrypted direct messaging provides an auxiliary channel for "
        "confidential consultations. The hybrid integration of Convex real-time persistence (Convex Development Team, 2024) and "
        "Hyperledger Besu blockchain immutability (Hyperledger Foundation, 2024; Wood, 2014) proves that institutional communication "
        "can achieve sub-100ms user interface reactivity alongside mathematically non-repudiable SHA-256 audit logs in MessageVerifier.sol.",
    )

    h(doc, "5.2 Conclusions", 2)
    p(
        doc,
        "The project yielded the following key conclusions:",
    )
    numbered(
        doc,
        [
            "Centralized academic Q&A forums resolve the systemic communication bottlenecks of personal phone calls and office queuing in universities, preserving faculty privacy while preventing knowledge siloing.",
            "Restricting answer permissions to verified lecturers within targeted departments ensures high academic quality and eliminates the spread of misinformation.",
            "Displaying verified academic ranks (Doctor, Professor, Engineer) establishes clear intellectual authority in digital campus dialogue.",
            "AI-based moderation using Mercury 2 with a closed topic whitelist effectively prevents non-academic and cross-domain questions from entering the academic forum.",
            "Hybrid cloud/ledger architectures deliver both real-time WebSocket responsiveness (via Convex) and immutable non-repudiable audit logging (via Hyperledger Besu with QBFT consensus).",
            "In-browser cryptography utilizing the W3C Web Crypto API provides robust client-side confidentiality via RSA-OAEP 2048 and AES-GCM (NIST, 2001; MDN, 2024) without relying on untrusted third-party servers.",
        ],
    )

    h(doc, "5.3 System Limitations and Future Engineering Works", 2)
    p(
        doc,
        "To advance the prototype into a comprehensive enterprise platform for universities, the project team outlines six "
        "strategic future engineering works:",
    )
    numbered(
        doc,
        [
            "Program-Specific Niching: Transition the platform from broad department-level categorizations down to granular, degree-program-specific feeds (for example, within the Department of Computer Science: B.Sc. Computer Science, B.Sc. Information Technology, and B.Sc. Data Science). This will allow students and lecturers to conduct highly specialized technical discussions, receive tailored curriculum updates, and address program-specific academic requirements.",
            "Dedicated Single Course Chatrooms: Implement unified, course-code-specific virtual collaborative rooms (such as CS 301 Database Systems) where the assigned course lecturer and registered students can interact in real time. These synchronized rooms will support virtual office hours, live review sessions, and collaborative problem-solving directly tied to active semester courses.",
            "Automated AI-Driven Identity Verification: Integrate multimodal artificial intelligence and Optical Character Recognition (OCR) pipelines capable of reading physical student and staff identity cards, extracting credential fields (full name, identification number, and department), and cross-referencing this data against the university student information system (SIS) portal. This automated pipeline will verify new user registrations within 7 days, eliminating administrative bottlenecks.",
            "Departmental Notice Board and News Sidebar: Add a dedicated faculty broadcast panel in the navigation sidebar where verified lecturers can publish official departmental circulars, seminar announcements, and research calls. This feature will include search by title, hashtags, and recency; restricted visibility strictly to students and lecturers in that department; multi-format image and document attachments; and interactive comment sections for student inquiries.",
            "Backend AI Moderation Action: Move Mercury API calls from the frontend to a Convex action so the API key never reaches the browser in production. While direct browser calls via VITE_MERCURY_KEY enabled rapid prototyping and evaluation, production architectures require encapsulating third-party credentials within serverless backend actions to eliminate client-side credential exposure.",
            "Multi-Node Blockchain Consortium Scaling: Scale the current single-node Hyperledger Besu deployment into a multi-node, multi-validator private consortium distributed across autonomous university units (such as the Central Administration/Registrar, School of Sciences, School of Engineering, and University Library). Running Quorum Byzantine Fault Tolerance (QBFT) consensus across independent institutional nodes ensures that no single department or server administrator can alter academic records, provides fault tolerance capable of withstanding up to f = (N - 1) / 3 compromised or offline nodes (Castro & Liskov, 2002), and enables secure peer-to-peer ledger replication across multi-campus university environments with Solidity 0.8.20 smart contracts (Ethereum Foundation, 2024).",
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
        "In universities today, academic communication between students and faculty suffers from critical structural bottlenecks. "
        "Lacking a dedicated, institution-wide scholarly discussion platform, students seeking coursework clarification or project "
        "guidance are forced to call lecturers' personal phone numbers or physically queue outside faculty offices. This practice "
        "intrudes on faculty privacy, causes scheduling delays, and silos valuable explanations in private 1-on-1 exchanges where peer "
        "students cannot benefit. This project developed QCampus Connect, an institutional, role-verified academic Q&A platform for "
        "universities. The platform enables students to post coursework inquiries classified by department, while verified lecturers "
        "distinguished by academic ranks (Doctor, Professor, Engineer) provide authoritative answers. Real-time notifications alert "
        "lecturers to incoming departmental questions, while multi-format attachment tools support research documents, code, and diagrams. "
        "One-on-one direct messaging is provided as an auxiliary, encrypted channel for private consultations. To guarantee non-repudiation, "
        "SHA-256 payload digests are committed asynchronously to a local Hyperledger Besu blockchain running QBFT consensus via the "
        "MessageVerifier.sol smart contract. Client encryption is handled via the W3C Web Crypto API (RSA-OAEP 2048 and AES-GCM-256), "
        "supplemented by a simulated BB84 quantum key distribution module enforcing an 11% QBER abort threshold (Bennett & Brassard, 2014/1984). "
        "Empirical benchmarks demonstrated mean message delivery latencies of ~50 ms and blockchain hash confirmation in ~0.35 s. "
        "QCampus Connect provides an accessible, audit-ready framework that eliminates personal channel intrusion and democratizes academic knowledge across campuses.",
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
            "Appendix B — MessageVerifier.sol Smart Contract",
            "Appendix C — BB84 Simulation Module",
            "Appendix D — User Acceptance Walk-Through Records",
            "Appendix E — Project Sprint Timeline",
        ],
    )
    h(doc, "List of Tables")
    bullets(
        doc,
        [
            "Table 2.1 Comparative Analysis of Academic Communication Platforms",
            "Table 3.1 Convex Database Collections & Indexing Strategies",
            "Table 3.2 System Threat Matrix and Mitigations",
            "Table 4.1 Development Tooling and Subsystem Versions",
            "Table 4.2 Functional Verification Test Suite",
            "Table 4.3 User Acceptance Testing Walk-Throughs",
            "Table 4.4 Localhost Latency Benchmarks",
        ],
    )
    h(doc, "List of Abbreviations")
    bullets(
        doc,
        [
            "AES-GCM — Advanced Encryption Standard Galois/Counter Mode",
            "API — Application Programming Interface",
            "BB84 — Bennett and Brassard 1984 Quantum Key Distribution Protocol",
            "LLM — Large Language Model",
            "LMS — Learning Management System",
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
    h(doc, "Appendix A — Selected Application Source Code")
    p(
        doc,
        f"Source code for {APP} is maintained in the project repository. Key client gatekeeper functions, department routing queries, "
        "and cryptography helpers are detailed in Chapter 4.",
    )
    h(doc, "Appendix B — MessageVerifier.sol Smart Contract")
    p(
        doc,
        "Contract Path: contract/contracts/MessageVerifier.sol. Compiled with Solidity 0.8.20 under the MIT license. Provides "
        "recordHash, verifyHash, verifyUser, and getUserRole methods.",
    )
    h(doc, "Appendix C — BB84 Simulation Module Summary")
    p(
        doc,
        "Module Path: src/lib/bb84.ts. Software simulation utilizing window.crypto.getRandomValues for random basis selection, "
        "bit sifting, QBER computation, and 256-bit AES key distillation with an 11% error abort threshold.",
    )
    h(doc, "Appendix D — Walk-Through Scenario Notes")
    p(
        doc,
        "Walk-through test notes confirmed that message payload hashes successfully committed to the Besu node when the Podman "
        "container was active, and gracefully alerted the interface when the ledger node was offline.",
    )
    h(doc, "Appendix E — Ten-Week Sprint Timeline")
    table(
        doc,
        ["Sprint Phase", "Duration", "Completion Status"],
        [
            ["UI Shell & Routes", "Weeks 1–2", "Completed"],
            ["Convex Backend & Q&A", "Weeks 3–4", "Completed"],
            ["Crypto & BB84 Engine", "Weeks 5–6", "Completed"],
            ["Besu Smart Contract", "Weeks 7–8", "Completed"],
            ["Verification & Department Features", "Weeks 9–10", "Completed"],
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
        f"This project proposes {APP}, an institutional, role-verified academic Q&A platform for universities. The system "
        "addresses the acute lack of an open academic discussion forum in higher education, eliminating the need for students to "
        "call lecturers' personal numbers or queue outside offices. The platform combines Convex for real-time question-and-answer "
        "synchronization with a private Hyperledger Besu blockchain for immutable SHA-256 payload hash verification. Client-side "
        "encryption is implemented via Web Crypto APIs, while an educational BB84 simulator demonstrates quantum key distribution "
        "(Bennett & Brassard, 2014/1984; Scarani et al., 2009).",
    )

    h(doc, "Background and Problem Statement")
    p(
        doc,
        "Universities lack an asynchronous digital forum dedicated to coursework inquiries and academic discussions. When students "
        "need clarification on lectures, assignments, or research, their only avenues are calling lecturers directly on personal "
        "phones or visiting offices in person. This intrudes on faculty privacy, produces scheduling friction, and silos valuable "
        "academic explanations in private 1-on-1 calls where course peers cannot learn from them. Commercial tools like WhatsApp "
        "fail to provide academic role verification, department categorization, or tamper-evident audit trails.",
    )

    h(doc, "Aim and Objectives")
    p(
        doc,
        f"Aim: Design and evaluate {APP}, a hybrid Web2/Web3 academic Q&A platform for universities, with auxiliary encrypted direct "
        "messaging for private academic consultation.",
    )
    numbered(
        doc,
        [
            "Develop an academic Q&A interface with department routing and verified lecturer responses.",
            "Implement academic rank verification (Doctor, Professor, Engineer) and role governance.",
            "Engineer real-time departmental notifications alerting faculty to incoming student questions.",
            "Implement multi-criteria question filtering and multi-mode sorting across department feeds.",
            "Provide rich multi-format attachment tools supporting academic papers, research documents, and code.",
            "Integrate AI-based academic content moderation to reject non-academic or cross-domain questions before they are posted.",
            "Deploy MessageVerifier.sol on a local Hyperledger Besu network using Ethers.js recordHash.",
            "Implement client-side RSA-OAEP and AES-GCM encryption using W3C Web Crypto APIs (NIST, 2001; MDN, 2024).",
            "Construct an educational BB84 quantum key simulation module with an 11% QBER abort threshold (Scarani et al., 2009).",
            "Execute functional verification and latency benchmarking.",
        ],
    )

    h(doc, "Proposed Architecture and Methodology")
    p(
        doc,
        "The system uses a three-tier architecture: Presentation (React 19 SPA), Application (Convex real-time platform with Mercury 2 AI moderation), "
        "and Verification (Hyperledger Besu QBFT blockchain). Development follows a ten-week Agile sprint methodology.",
    )

    add_references(doc)
    save(doc, "Proposal.docx")


def build_outline():
    doc = new_doc()
    h(doc, "Presentation Outline")
    p(
        doc,
        "Slide presentation structure for the final project defense examination panel.",
        first_line=False,
    )
    numbered(
        doc,
        [
            "Title Slide — QCampus Connect: A Verified Academic Q&A Platform with Cryptographic Identity and Optional Encrypted Direct Messaging; Student team details, Supervisor: Dr Peter Nimbe, September 2026.",
            "Institutional Context — The academic communication gap in universities: lack of an open academic discussion forum, intrusion of personal phone calls on faculty privacy, and physical office queues.",
            "The Problem — Knowledge siloing in private 1-on-1 calls, unverified authority on commercial chat apps, and lack of tamper-evident audit trails.",
            "Main Aim & Scope — QCampus Connect as the campus academic forum for coursework questions and research sharing; 1-on-1 direct messaging as an auxiliary tool.",
            "System Architecture — Three-tier hybrid design: React 19 Frontend, Convex Serverless Backend, and Hyperledger Besu Private Blockchain.",
            "Core Features — Department-targeted question routing, Mercury 2 AI academic moderation with input character limits and token budgeting, lecturer academic ranks (Dr, Prof, Eng), real-time departmental notifications, multi-criteria sorting, and multi-format attachments.",
            "Cryptographic Pipeline — Client-side Web Crypto (RSA-OAEP/AES-GCM), on-chain SHA-256 hash anchoring via MessageVerifier.sol, and BB84 QBER simulation.",
            "Empirical Results — Vite 8 production build (256 kB bundle), sub-50ms query sync, 300-600ms Mercury 2 check, 0.35s Besu commit, and comprehensive UAT walk-throughs.",
            "Demonstration Flow — Live presentation path: Browse department feed → Student posts question with attachment → Mercury 2 AI validates academic relevance and closed topic whitelist → Lecturer receives notification → Lecturer answers with Doctor/Professor rank badge → Verify SHA-256 hash on Besu ledger → Optional encrypted 1-on-1 follow-up.",
            "Strategic Future Works Roadmap — Six key extensions: (1) Program-specific niching; (2) Dedicated single course chatrooms; (3) Automated AI identity verification in <7 days; (4) Departmental news sidebar; (5) Backend Convex AI moderation action proxy; (6) Multi-node blockchain consortium scaling.",
        ],
    )
    h(doc, "Defence Strategy Note", 2)
    p(
        doc,
        "The project defense must begin with the Academic Q&A Forum, not the direct messaging screen. Demonstrate a student "
        "selecting a target department, the real-time notification reaching the lecturer, the lecturer answering with their verified "
        "Doctor or Professor badge, and the SHA-256 digest committed to Hyperledger Besu. Direct messaging should be introduced as a "
        "natural private continuation of that scholarly exchange. Emphasize that the system eliminates phone calls and office queues "
        "while democratizing knowledge across the campus.",
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


def main():
    build_chapters()
    build_proposal()
    build_outline()
    print("All documentation files regenerated successfully.")


if __name__ == "__main__":
    main()

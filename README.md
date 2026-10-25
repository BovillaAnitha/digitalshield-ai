# 🛡️ DigitalShield AI

### An Explainable Digital Safety and Evidence Management Platform

DigitalShield AI is a digital safety prototype designed to help individuals, particularly women experiencing online harassment, recognize potentially harmful communication patterns, organize supporting evidence, and document incidents in a structured way.

The platform combines explainable conversation analysis, multi-message escalation detection, evidence integrity checks, incident tracking, and safety resources in one application.

## The Problem

Digital harassment does not always begin with an obvious threat. It can emerge through repeated unwanted messages, increasing pressure, attempts to bypass personal boundaries, or intimidation.

Identifying these patterns and preserving relevant information can be challenging when conversations, screenshots, recordings, and incident details are stored separately.

DigitalShield AI explores a practical approach to bringing these activities together.

## Our Solution

The application helps users identify potential warning signs in conversations, preserve digital evidence, maintain incident records, and generate organized reports.

Rather than making definitive judgments about a person's intentions, DigitalShield AI highlights predefined risk indicators and provides explanations that users can review in context.

## Key Features

### 1. Explainable Conversation Analysis

Uses Python regular expressions and predefined detection rules to identify language potentially associated with coercion, physical threats, intimidation, and persistent unwanted contact.

Each finding includes a category, severity level, message reference, and explanation.

### 2. Multi-Message Escalation Detection

Analyzes message sequences to recognize repeated communication pressure, possible attempts to bypass blocking, and threatening language that follows earlier pressure.

The analyzer assigns low, medium, or high severity based on the highest detected warning level.

### 3. Evidence Vault

Supports image and PDF uploads, evidence organization, and SHA-256 integrity verification to help detect changes to stored files.

### 4. Audio and Video Evidence

Supports uploading and managing audio and video recordings as supplementary evidence.

### 5. Incident Timeline

Allows users to record incidents with titles, descriptions, categories, timestamps, and optional evidence references.

### 6. PDF Report Generation

Produces downloadable reports containing documented incident information and relevant evidence details.

### 7. Emergency and Safety Resources

Provides access to emergency helplines, trusted-contact features, and safety guidance.

### 8. Privacy and Safety Center

Displays privacy guidance and confirmation prompts before sensitive evidence uploads.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Python, FastAPI |
| Data Storage | SQLite |
| Conversation Analysis | Python Regular Expressions |
| Escalation Detection | Rule-Based Sequential Analysis |
| Evidence Integrity | SHA-256 |
| PDF Generation | ReportLab |
| Version Control | Git and GitHub |

## How DigitalShield AI Works

1. **Analyze:** Submit conversation text for analysis.
2. **Review:** Examine flagged messages, severity levels, and explanations.
3. **Document:** Create an incident record with relevant information.
4. **Attach:** Upload and associate supporting evidence.
5. **Organize:** Review incidents through the chronological timeline.
6. **Export:** Generate a structured PDF report.

## Getting Started

### Prerequisites

- Python
- Node.js and npm
- Git

### Clone the Repository

```bash
git clone https://github.com/BovillaAnitha/digitalshield-ai.git
cd digitalshield-ai
```

### Backend Setup

Navigate to the backend directory:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Backend URL: `https://digitalshield-ai-api.onrender.com`

### Frontend Setup

Open a separate terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local address displayed by Vite.

## Analysis Approach

DigitalShield AI uses an explainable, rule-based approach rather than a trained machine learning classifier or external large language model.

The analyzer examines each nonempty input line as a message, checks predefined warning patterns, and evaluates certain behaviors across multiple messages.

Its results are designed to support human interpretation. They are not predictions of future behavior or definitive determinations of harassment.

## Project Limitations

DigitalShield AI is a hackathon prototype and is not intended for production use with sensitive personal information.

- Detection rules may miss concerning language or flag harmless messages.
- Analysis depends on the message order and predefined patterns.
- The system does not independently identify speakers or establish intent.
- Authentication and production-grade access controls are not implemented.
- SHA-256 verification can detect file changes but cannot establish the authenticity of the original content.
- Generated reports are informational and are not legal conclusions.

Demonstrations should use fictional or appropriately consented test data.

## Future Improvements

Potential improvements include:

- Secure authentication and role-based access
- Encrypted evidence storage
- Multilingual conversation analysis
- More advanced contextual language understanding
- Secure deployment and stronger data protection
- Expanded reporting and accessibility features

## Project Vision

DigitalShield AI explores how explainable technology and organized evidence management can help people recognize concerning digital interactions and maintain clearer records of their experiences.

The long-term goal is to make digital safety tools more accessible, transparent, and practical.

---

**Project:** DigitalShield AI  
**Type:** Hackathon Prototype  
**GitHub:** https://github.com/BovillaAnitha/digitalshield-ai

*Supporting digital safety through awareness, documentation, and explainable technology.*
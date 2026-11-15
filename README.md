# IEEE Access Automated Submission Assistant (ieee-access-uploader)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Playwright%20%7C%20Node.js-green.svg)]()
[![Target](https://img.shields.io/badge/Target-IEEE%20Access%20%2F%20ScholarOne-orange.svg)]()

An automated manuscript submission tool and Antigravity skill for **IEEE Access** (IEEE Research Exchange / ScholarOne). Designed specifically for Computer Science and IT researchers to eliminate the repetitive, time-consuming manual entry of metadata, subject categories, and the lengthy **Additional Information** compliance questionnaire.

---

## 🌟 Key Features

- 📑 **Comprehensive File Uploads**: Automates uploading of Manuscript PDF/Word, Cover Letter, Highlights, and Supplementary data.
- ⏱️ **Auto "Additional Information" Completion**:
  - Automatically answers the 10+ time-consuming compliance questions:
    - Gold Open Access APC acknowledgment ($1,950 publication fee)
    - Originality and conference prior publication declaration
    - IEEE-compliant Generative AI usage statement
    - Conflict of interest declaration
    - Data & Code Availability statement
    - Author approval certifications
- 🎯 **CS / IT Subject Category Presets**:
  - Pre-configured for CS & IT fields:
    1. *Computational and artificial intelligence*
    2. *Computers and information processing*
    3. *Communications technology*
  - Supports choosing specific presets or selecting random CS topics.
- 🏷️ **Smart Keywords**:
  - Built-in defaults: `Benchmark evaluation`, `Computer vision`, `Machine learning`
  - Fully customizable via configuration.
- 📸 **Timestamped Screenshot Audit Gallery**:
  - Takes a high-resolution, full-page screenshot at every single milestone:
    - `01_login_page.png`
    - `02_submission_dashboard.png`
    - `03_files_uploaded.png`
    - `04_metadata_filled.png`
    - `05_categories_and_keywords.png`
    - `06_authors_affiliations.png`
    - `07_additional_information_filled.png`
    - `08_final_review_proof.png`
  - Automatically compiles an interactive `index.html` report inside the screenshot directory for instant verification.
- 🛡️ **Safety Gate**:
  - Default `--dry-run` safe mode executes all form filling and screenshot logging but halts right before the final irreversibly binding submission button.
  - `--auto-submit` enables completely autonomous submission when desired.

---

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/lowchoonkeat/ieee-access-uploader.git
cd ieee-access-uploader

# Install dependencies
npm install
```

---

## ⚙️ Configuration

Copy `config.example.json` to `config.json`:

```bash
cp config.example.json config.json
```

Edit `config.json` with your manuscript details:

```json
{
  "portal": {
    "url": "https://ieee.submission.researchexchange.com/submission/dashboard?siteName=ieee-access",
    "email": "lowck@tarc.edu.my",
    "password": "YOUR_PASSWORD"
  },
  "paper": {
    "title": "Your Paper Title",
    "abstract": "Your abstract here...",
    "manuscriptType": "Regular Paper"
  },
  "files": {
    "manuscriptPdf": "./submission_package/MANUSCRIPT.pdf",
    "coverLetterPdf": "./submission_package/COVER_LETTER.pdf"
  },
  "subjectCategory": {
    "selected": [
      "Computational and artificial intelligence",
      "Computers and information processing"
    ]
  },
  "keywords": [
    "Benchmark evaluation",
    "Computer vision",
    "Machine learning"
  ]
}
```

---

## 💻 Usage

### 1. Interactive Visual Run (Recommended)
Fills the forms visibly on screen, logs all step screenshots, and pauses on the review page:
```bash
node uploader.js --config config.json
```

### 2. Headless Background Mode
Runs silently in the background:
```bash
node uploader.js --headless --config config.json
```

### 3. Full Autonomous Submission
Executes all steps and clicks the final submit confirmation:
```bash
node uploader.js --auto-submit --config config.json
```

---

## 🤖 Calling from Antigravity / AI Agent

This tool is packaged as an Antigravity custom skill (`SKILL.md`). You can trigger it naturally by prompting:
- *"Upload this manuscript to IEEE Access"*
- *"Auto submit the current project to IEEE Access with CS categories and save screenshots"*
- *"Fill the IEEE Access additional information and show me the screenshots"*

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

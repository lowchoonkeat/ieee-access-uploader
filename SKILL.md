---
name: ieee-access-uploader
description: >
  Automated submission assistant for IEEE Access on IEEE Research Exchange / ScholarOne.
  Automates the entire submission lifecycle: file uploads, metadata extraction, CS/IT
  subject categories ("Computational and artificial intelligence", "Computers and information processing",
  "Communications technology"), default and custom keywords ("Benchmark evaluation", "Computer vision",
  "Machine learning"), and the lengthy "Additional Information" questionnaire (APC agreement,
  conflict of interest, AI usage disclosure, data availability). Automatically captures full-page
  screenshots at every milestone into a timestamped audit folder with an HTML review gallery.
  Triggers: submit to ieee access, upload to ieee access, ieee access upload, ieee access submission,
  投稿 ieee access, ieee access 自动投稿, upload paper to ieee.
agent_created: true
---

# IEEE Access Automated Submission Skill

An end-to-end automation engine and Antigravity skill for submitting computer science and IT manuscripts to **IEEE Access** via the IEEE Research Exchange / ScholarOne submission portal.

## Key Capabilities

1. **Full-Pipeline Automation**: Handles file uploads (Manuscript, Cover Letter, Highlights, Supplementary materials), metadata entry (Title, Abstract), and author affiliations.
2. **Automated "Additional Information" Questionnaire**: Eliminates the most tedious, repetitive part of IEEE Access submissions:
   - Gold Open Access APC acknowledgment ($1,950 agreement)
   - Original work / Prior conference version declaration
   - IEEE-compliant Generative AI usage disclosure
   - Conflict of Interest declaration
   - Data & Code Availability statement
   - Mandatory compliance checks
3. **CS/IT Subject Category & Keyword Presets**:
   - Default Categories:
     1. `Computational and artificial intelligence`
     2. `Computers and information processing` (or `Communications technology`)
     - Supports picking 1, 2, or random 3 among CS/IT categories.
   - Default Keywords:
     - `Benchmark evaluation`
     - `Computer vision`
     - `Machine learning`
4. **Visual Audit Trail & Screenshot Gallery**:
   - Every single step is automatically photographed (full-page screenshot) and stored into a timestamped session folder: `./screenshots/YYYYMMDD_HHMMSS/`
   - Generates an instant HTML gallery (`index.html`) so you can review all filled forms and visual proofs before the final submission.
5. **Safety Gate**:
   - By default runs in `--dry-run` safe mode: automates all 6 steps, verifies form validity, saves full audit screenshots, and pauses at the final "Submit" confirmation page without irreversibly submitting.
   - Use `--auto-submit` when you want 100% hands-free submission.

---

## Quick Start

### 1. Installation & Dependencies

From the skill directory (`C:\Users\Chi\ieee-access-uploader`):

```bash
cd C:\Users\Chi\ieee-access-uploader
npm install
```

### 2. Configuration (`config.json`)

Create `config.json` (copy from `config.example.json`):

```json
{
  "portal": {
    "url": "https://ieee.submission.researchexchange.com/submission/dashboard?siteName=ieee-access",
    "email": "lowck@tarc.edu.my",
    "password": "YOUR_PORTAL_PASSWORD"
  },
  "paper": {
    "title": "Your Paper Title",
    "abstract": "Your paper abstract text..."
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

### 3. Run Commands

- **Safe Inspection Run (Visual Audit)**:
  ```bash
  node uploader.js --config config.json
  ```
  *Opens browser, fills every step, saves all screenshots to `./screenshots/<timestamp>/index.html`, and pauses at final review.*

- **Headless Background Mode**:
  ```bash
  node uploader.js --headless --config config.json
  ```

- **Full Auto-Submit Mode**:
  ```bash
  node uploader.js --auto-submit --config config.json
  ```

---

## How to Call This Skill in Antigravity Chat

Whenever you want the agent to handle IEEE Access submissions, you can simply say:
- *"Upload this paper to IEEE Access"*
- *"Auto submit the current manuscript to IEEE Access using the CS categories"*
- *"Submit to IEEE Access and take screenshots of each step"*
- *"Fill the IEEE Access additional information and save screenshots"*

The agent will read the metadata from your active project (e.g. `submission_package/`), configure `config.json`, run `uploader.js`, and provide you with clickable links to the screenshot gallery and audit report.

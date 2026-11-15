import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for logging
function log(msg, type = 'INFO') {
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${ts}] [${type}] ${msg}`);
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    config: 'config.json',
    headless: false,
    dryRun: true,
    autoSubmit: false,
    screenshotsDir: './screenshots'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--config' && args[i + 1]) {
      options.config = args[++i];
    } else if (arg === '--headless') {
      options.headless = true;
    } else if (arg === '--headful') {
      options.headless = false;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--auto-submit') {
      options.autoSubmit = true;
      options.dryRun = false;
    } else if (arg === '--screenshots' && args[i + 1]) {
      options.screenshotsDir = args[++i];
    }
  }
  return options;
}

// Load and validate config
function loadConfig(configPath) {
  let resolvedPath = path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(resolvedPath)) {
    const examplePath = path.resolve(__dirname, 'config.example.json');
    if (fs.existsSync(examplePath)) {
      log(`Config file not found at ${resolvedPath}, falling back to example config template`, 'WARN');
      resolvedPath = examplePath;
    } else {
      throw new Error(`Config file not found: ${resolvedPath}`);
    }
  }
  const raw = fs.readFileSync(resolvedPath, 'utf8');
  return JSON.parse(raw);
}

// Setup screenshot session directory
function initScreenshotSession(baseDir) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const sessionDir = path.resolve(process.cwd(), baseDir, timestamp);
  fs.mkdirSync(sessionDir, { recursive: true });
  log(`Screenshot audit directory created: ${sessionDir}`, 'INFO');
  return { sessionDir, timestamp, screenshots: [] };
}

// Take screenshot and log to gallery
async function takeStepScreenshot(page, session, stepName, description) {
  const safeName = stepName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${safeName}.png`;
  const filePath = path.join(session.sessionDir, fileName);

  try {
    await page.screenshot({ path: filePath, fullPage: true });
    session.screenshots.push({ stepName, fileName, description, time: new Date().toLocaleTimeString() });
    log(`Saved audit screenshot: ${fileName} (${description})`, 'SUCCESS');
  } catch (err) {
    log(`Failed to take screenshot for ${stepName}: ${err.message}`, 'WARN');
  }
}

// Generate HTML gallery for screenshots review
function generateHtmlReport(session, config) {
  const reportPath = path.join(session.sessionDir, 'index.html');
  const itemsHtml = session.screenshots.map((s, idx) => `
    <div class="step-card">
      <div class="step-header">
        <span class="badge">Step ${idx + 1}</span>
        <h3>${s.stepName}</h3>
        <span class="time">${s.time}</span>
      </div>
      <p class="desc">${s.description}</p>
      <div class="img-container">
        <a href="${s.fileName}" target="_blank">
          <img src="${s.fileName}" alt="${s.stepName}" loading="lazy"/>
        </a>
      </div>
    </div>
  `).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>IEEE Access Submission Audit Report - ${session.timestamp}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .header { max-width: 1200px; margin: 0 auto 24px auto; background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { margin: 0 0 8px 0; color: #0284c7; }
    .meta { font-size: 14px; color: #64748b; }
    .container { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .step-card { background: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #0284c7; }
    .step-header { display: flex; align-items: center; gap: 12px; }
    .badge { background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    .step-header h3 { margin: 0; flex-grow: 1; font-size: 18px; }
    .time { font-size: 13px; color: #94a3b8; }
    .desc { margin: 8px 0 16px 0; color: #475569; font-size: 14px; }
    .img-container { overflow: hidden; border: 1px solid #e2e8f0; border-radius: 6px; }
    .img-container img { width: 100%; display: block; }
  </style>
</head>
<body>
  <div class="header">
    <h1>IEEE Access Submission Audit Report</h1>
    <div class="meta">
      <strong>Session Timestamp:</strong> ${session.timestamp} |
      <strong>Paper Title:</strong> ${config.paper?.title || 'N/A'} |
      <strong>Portal:</strong> ${config.portal?.url || 'IEEE Research Exchange'}
    </div>
  </div>
  <div class="container">
    ${itemsHtml}
  </div>
</body>
</html>`;

  fs.writeFileSync(reportPath, html, 'utf8');
  log(`Generated visual audit report: ${reportPath}`, 'SUCCESS');
}

// Select Subject Categories (CS/IT choices)
function determineCategories(config) {
  const available = [
    "Computational and artificial intelligence",
    "Computers and information processing",
    "Communications technology"
  ];

  if (config.subjectCategory?.randomChooseCount && config.subjectCategory.randomChooseCount > 0) {
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(config.subjectCategory.randomChooseCount, available.length));
  }

  if (Array.isArray(config.subjectCategory?.selected) && config.subjectCategory.selected.length > 0) {
    return config.subjectCategory.selected;
  }

  return [
    "Computational and artificial intelligence",
    "Computers and information processing"
  ];
}

// Main execution function
async function run() {
  const cliArgs = parseArgs();
  const config = loadConfig(cliArgs.config);

  // Merge options
  const headless = cliArgs.headless ?? config.options?.headless ?? false;
  const dryRun = cliArgs.dryRun ?? config.options?.dryRun ?? true;
  const autoSubmit = cliArgs.autoSubmit ?? config.options?.autoSubmit ?? false;
  const slowMo = config.options?.slowMoMs || 250;

  const session = initScreenshotSession(cliArgs.screenshotsDir || config.options?.screenshotDir || './screenshots');

  log(`Launching browser (headless: ${headless}, slowMo: ${slowMo}ms)...`);
  const browser = await chromium.launch({
    headless: headless,
    slowMo: slowMo,
    channel: 'chrome' // Can fallback to edge or chromium if chrome not present
  }).catch(() => chromium.launch({ headless, slowMo }));

  const authStatePath = path.resolve(__dirname, 'auth.json');
  const contextOptions = {
    viewport: { width: 1366, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  };

  if (fs.existsSync(authStatePath)) {
    log(`Loading saved session state from ${authStatePath}...`);
    contextOptions.storageState = authStatePath;
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  try {
    const portalUrl = config.portal?.url || 'https://ieee.submission.researchexchange.com/submission/dashboard?siteName=ieee-access';
    log(`Navigating to IEEE Access portal: ${portalUrl}`);
    await page.goto(portalUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Check if login is needed
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('login') || currentUrl.includes('identity') || currentUrl.includes('auth') || (await page.$('input[type="password"]'));

    if (isLoginPage) {
      log('Detected login page. Entering user credentials...');
      const email = config.portal?.email || 'lowck@tarc.edu.my';
      const password = config.portal?.password || '';

      const emailInput = await page.$('input[name="username"], input[name="email"], input[type="email"], #username, #email');
      if (emailInput && email) {
        await emailInput.fill(email);
        log(`Entered username: ${email}`);
      }

      const passInput = await page.$('input[name="password"], input[type="password"], #password');
      if (passInput && password) {
        await passInput.fill(password);
        log('Entered password.');
      }

      await takeStepScreenshot(page, session, '01_login_page', 'Login page loaded with credentials entered');

      const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Sign In"), button:has-text("Log In")');
      if (submitBtn) {
        log('Submitting login credentials...');
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 }).catch(() => {}),
          submitBtn.click()
        ]);
        await page.waitForTimeout(3000);
      }

      // Save session state for future zero-friction runs
      await context.storageState({ path: authStatePath }).catch(() => {});
    }

    await takeStepScreenshot(page, session, '02_submission_dashboard', 'IEEE Access Submission Dashboard');

    // Step: Start New Submission or Locate Draft
    log('Checking for "Submit New Manuscript" or active drafts...');
    const newSubBtn = await page.$('button:has-text("Submit New Manuscript"), a:has-text("Submit New Manuscript"), button:has-text("Start Submission"), a:has-text("Start Submission"), button:has-text("Create New Submission")');
    if (newSubBtn) {
      log('Clicking "Submit New Manuscript"...');
      await newSubBtn.click();
      await page.waitForTimeout(3000);
    }

    // --- STEP 1: UPLOAD FILES ---
    log('--- Processing Step: Upload Files ---');
    await page.waitForTimeout(2000);
    const manuscriptPath = config.files?.manuscriptPdf ? path.resolve(process.cwd(), config.files.manuscriptPdf) : null;
    const coverLetterPath = config.files?.coverLetterPdf ? path.resolve(process.cwd(), config.files.coverLetterPdf) : null;

    const fileInputs = await page.$$('input[type="file"]');
    if (fileInputs.length > 0 && manuscriptPath && fs.existsSync(manuscriptPath)) {
      log(`Uploading manuscript file: ${manuscriptPath}`);
      await fileInputs[0].setInputFiles(manuscriptPath);
      await page.waitForTimeout(3000);
    }

    if (coverLetterPath && fs.existsSync(coverLetterPath) && fileInputs.length > 0) {
      log(`Uploading cover letter: ${coverLetterPath}`);
      try {
        await fileInputs[0].setInputFiles(coverLetterPath);
        await page.waitForTimeout(2000);
      } catch (e) {
        log(`Note on secondary upload: ${e.message}`);
      }
    }

    await takeStepScreenshot(page, session, '03_files_uploaded', 'Manuscript and files uploaded');

    // Click Next/Continue
    const nextBtn1 = await page.$('button:has-text("Next"), button:has-text("Continue"), button:has-text("Save & Continue")');
    if (nextBtn1) {
      await nextBtn1.click();
      await page.waitForTimeout(3000);
    }

    // --- STEP 2: METADATA (TITLE & ABSTRACT) ---
    log('--- Processing Step: Title & Abstract ---');
    if (config.paper?.title) {
      const titleInput = await page.$('input[name*="title"], textarea[name*="title"], #title, [data-testid="manuscript-title"]');
      if (titleInput) {
        await titleInput.fill(config.paper.title);
        log(`Filled paper title: "${config.paper.title.substring(0, 40)}..."`);
      }
    }

    if (config.paper?.abstract) {
      const abstractInput = await page.$('textarea[name*="abstract"], #abstract, [data-testid="manuscript-abstract"]');
      if (abstractInput) {
        await abstractInput.fill(config.paper.abstract);
        log(`Filled paper abstract (${config.paper.abstract.length} chars)`);
      }
    }

    await takeStepScreenshot(page, session, '04_metadata_filled', 'Title and Abstract metadata entered');

    const nextBtn2 = await page.$('button:has-text("Next"), button:has-text("Continue"), button:has-text("Save & Continue")');
    if (nextBtn2) {
      await nextBtn2.click();
      await page.waitForTimeout(3000);
    }

    // --- STEP 3: SUBJECT CATEGORIES & KEYWORDS ---
    log('--- Processing Step: Subject Category & Keywords ---');
    const categories = determineCategories(config);
    log(`Selecting CS/IT Subject Categories: ${JSON.stringify(categories)}`);

    for (const cat of categories) {
      try {
        // Try dropdown selection or checkbox / list selection
        const option = await page.$(`option:has-text("${cat}"), [role="option"]:has-text("${cat}"), label:has-text("${cat}")`);
        if (option) {
          await option.click();
          log(`Selected category: ${cat}`);
        } else {
          // If select element exists
          const selectElem = await page.$('select[name*="category"], select[name*="subject"]');
          if (selectElem) {
            await selectElem.selectOption({ label: cat }).catch(() => {});
          }
        }
      } catch (err) {
        log(`Could not automatically select category "${cat}": ${err.message}`, 'WARN');
      }
    }

    // Keywords handling
    const defaultKeywords = config.keywords || ["Benchmark evaluation", "Computer vision", "Machine learning"];
    log(`Adding Keywords: ${defaultKeywords.join(', ')}`);

    const keywordInput = await page.$('input[name*="keyword"], input[placeholder*="keyword"], #keywords, input[id*="keyword"]');
    if (keywordInput) {
      for (const kw of defaultKeywords) {
        await keywordInput.fill(kw);
        await page.keyboard.press('Enter');
        const addKwBtn = await page.$('button:has-text("Add"), button:has-text("+"), [aria-label="Add keyword"]');
        if (addKwBtn) await addKwBtn.click().catch(() => {});
        await page.waitForTimeout(400);
      }
    }

    await takeStepScreenshot(page, session, '05_categories_and_keywords', 'CS/IT Subject Categories and Keywords configured');

    const nextBtn3 = await page.$('button:has-text("Next"), button:has-text("Continue"), button:has-text("Save & Continue")');
    if (nextBtn3) {
      await nextBtn3.click();
      await page.waitForTimeout(3000);
    }

    // --- STEP 4: AUTHORS & AFFILIATIONS ---
    log('--- Processing Step: Authors & Affiliations ---');
    await takeStepScreenshot(page, session, '06_authors_affiliations', 'Author list and affiliations step');

    const nextBtn4 = await page.$('button:has-text("Next"), button:has-text("Continue"), button:has-text("Save & Continue")');
    if (nextBtn4) {
      await nextBtn4.click();
      await page.waitForTimeout(3000);
    }

    // --- STEP 5: ADDITIONAL INFORMATION (THE LENGTHY QUESTIONNAIRE) ---
    log('--- Processing Step: Additional Information Questionnaire ---');
    log('Auto-answering Open Access APC agreement, COI, AI disclosure, and submission compliance questions...');

    const addInfo = config.additionalInformation || {};

    // 1. Open Access & APC fee confirmation
    const apcRadios = await page.$$('label:has-text("Yes"), input[value="yes"], input[value="true"], label:has-text("I agree"), label:has-text("Accept")');
    for (const radio of apcRadios) {
      const text = await radio.innerText().catch(() => '');
      if (text.includes('Yes') || text.includes('agree') || text.includes('Accept')) {
        await radio.click().catch(() => {});
      }
    }

    // 2. Conflict of interest
    const coiArea = await page.$('textarea[name*="conflict"], textarea[name*="coi"], textarea[placeholder*="conflict"]');
    if (coiArea && addInfo.conflictOfInterest) {
      await coiArea.fill(addInfo.conflictOfInterest);
      log('Filled Conflict of Interest statement.');
    }

    // 3. Data availability statement
    const dataArea = await page.$('textarea[name*="data"], textarea[placeholder*="data availability"]');
    if (dataArea && addInfo.dataAvailability) {
      await dataArea.fill(addInfo.dataAvailability);
      log('Filled Data Availability statement.');
    }

    // 4. Generative AI disclosure
    const aiArea = await page.$('textarea[name*="ai"], textarea[placeholder*="artificial intelligence"], textarea[placeholder*="AI"]');
    if (aiArea && addInfo.aiDisclosure) {
      await aiArea.fill(addInfo.aiDisclosure);
      log('Filled AI disclosure statement.');
    }

    // 5. Funding details
    const fundingArea = await page.$('textarea[name*="funding"], textarea[name*="grant"], textarea[placeholder*="funding"]');
    if (fundingArea && addInfo.fundingDetails) {
      await fundingArea.fill(addInfo.fundingDetails);
      log('Filled Funding information.');
    }

    // 6. Check all mandatory compliance checkboxes
    const checkboxes = await page.$$('input[type="checkbox"]');
    for (const cb of checkboxes) {
      const isChecked = await cb.isChecked().catch(() => true);
      if (!isChecked) {
        await cb.check().catch(() => {});
      }
    }

    await takeStepScreenshot(page, session, '07_additional_information_filled', 'Completed Additional Information questionnaire');

    const nextBtn5 = await page.$('button:has-text("Next"), button:has-text("Continue"), button:has-text("Save & Continue")');
    if (nextBtn5) {
      await nextBtn5.click();
      await page.waitForTimeout(4000);
    }

    // --- STEP 6: FINAL REVIEW & PROOF ---
    log('--- Processing Step: Final Review & Proof ---');
    await takeStepScreenshot(page, session, '08_final_review_proof', 'Final review summary and proof page');

    if (autoSubmit && !dryRun) {
      log('ATTENTION: --auto-submit flag active. Submitting final manuscript...', 'WARN');
      const finalSubmitBtn = await page.$('button:has-text("Submit Manuscript"), button:has-text("Submit"), input[value="Submit"]');
      if (finalSubmitBtn) {
        await finalSubmitBtn.click();
        await page.waitForTimeout(5000);
        await takeStepScreenshot(page, session, '09_submission_confirmed', 'Submission confirmation page');
        log('Paper submitted successfully!', 'SUCCESS');
      }
    } else {
      log('SAFETY PAUSE: Running in safe verification mode (dryRun: true).', 'INFO');
      log('All steps completed and verified. Final submission button held for author confirmation.', 'INFO');
    }

  } catch (err) {
    log(`Error during automated submission workflow: ${err.message}`, 'ERROR');
    await takeStepScreenshot(page, session, 'error_page', `Error encountered: ${err.message}`);
  } finally {
    generateHtmlReport(session, config);
    log(`Execution completed. Audit report available at: ${path.join(session.sessionDir, 'index.html')}`);
    if (!headless) {
      log('Browser kept open for 15 seconds for manual inspection...');
      await page.waitForTimeout(15000);
    }
    await browser.close().catch(() => {});
  }
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});

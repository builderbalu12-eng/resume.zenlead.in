import { APIClient } from "@/services/api";
import { getMasterResume, setMasterResume, getSettings } from "@/utils/storage";
import { downloadResume, downloadResumePDF } from "@/services/resumeGenerator";
import { ResumeData, JobDescription, ATSScore } from "@/types";

interface SidebarState {
  masterResume: ResumeData | null;
  pageHTML: string | null;
  pageURL: string | null;
  jobData: JobDescription | null;
  tailoredResume: ResumeData | null;
  atsScore: ATSScore | null;
  masterAtsScore: ATSScore | null;
  isJobPosting?: boolean | null;
}

let state: SidebarState = {
  masterResume: null,
  pageHTML: null,
  pageURL: null,
  jobData: null,
  tailoredResume: null,
  atsScore: null,
  masterAtsScore: null,
  isJobPosting: null,
};

const APP_URL = "https://landyourjob.zenlead.in";

// ─── DOM helpers ────────────────────────────────────────────────────────────
const $ = (id: string) => document.getElementById(id);
const mainContentEl = () => $("main-content");

// ─── Dynamic API URL ─────────────────────────────────────────────────────────
async function getApiBaseUrl(): Promise<string> {
  return new Promise((resolve) =>
    chrome.storage.sync.get(["resumematch_api_url"], (r) =>
      resolve(
        r["resumematch_api_url"] ||
          (import.meta.env.VITE_API_URL as string) ||
          "http://localhost:8000",
      ),
    ),
  );
}

// ─── Standard inner HTML ────────────────────────────────────────────────────
const STANDARD_CONTENT = `
  <div id="status" class="status">
    <div class="status-icon">⏳</div>
    <div class="status-text"><strong>Initializing…</strong><span></span></div>
  </div>

  <div id="job-info" class="card hidden">
    <div class="job-field"><strong>Role</strong><span id="job-title">-</span></div>
    <div class="job-field"><strong>Company</strong><span id="job-company">-</span></div>
    <div id="ats-score-wrap" style="margin-top:4px"></div>
  </div>

  <div id="stats-card" class="card hidden">
    <div class="stats-row">
      <div class="stat-box">
        <div id="stat-matched" class="stat-num green">0</div>
        <div class="stat-label">Keywords<br>Matched</div>
      </div>
      <div class="stat-box">
        <div id="stat-added" class="stat-num blue">0</div>
        <div class="stat-label">Keywords<br>Added</div>
      </div>
      <div class="stat-box">
        <div id="stat-changes" class="stat-num amber">0</div>
        <div class="stat-label">Sections<br>Updated</div>
      </div>
    </div>
    <div class="bar-header">
      <span style="font-size:11px;color:hsl(215.4,16.3%,46.9%)">Keyword match</span>
      <span id="bar-pct" class="bar-pct">0%</span>
    </div>
    <div class="bar-track">
      <div id="bar-fill" class="bar-fill" style="width:0%"></div>
    </div>
  </div>

  <div id="source-card" class="card hidden">
    <div class="source-row">
      <div class="source-domain">
        <span>🔗</span>
        <span id="source-domain-text">—</span>
      </div>
      <a id="open-job-link" href="#" target="_blank" rel="noopener" class="open-job-link">Open Job Post ↗</a>
    </div>
  </div>

  <div id="keywords-card" class="card hidden">
    <div class="chips-section">
      <div class="chips-label">Matched Keywords</div>
      <div id="matched-chips" class="chips-wrap"></div>
    </div>
    <div class="divider"></div>
    <div class="chips-section">
      <div class="chips-label">Missing Keywords</div>
      <div id="missing-chips" class="chips-wrap"></div>
    </div>
  </div>

  <div id="improvements-card" class="card hidden">
    <div class="chips-label">Suggested Improvements</div>
    <ul id="improvements-list" class="improvements-list"></ul>
  </div>

  <div id="loading" class="loading hidden">
    <div class="skel" style="width:55%"></div>
    <div class="skel" style="width:100%;height:48px;border-radius:8px;margin:4px 0"></div>
    <div class="skel" style="width:80%"></div>
    <div class="skel" style="width:90%"></div>
    <div class="skel" style="width:65%"></div>
    <div class="skel" style="width:100%;height:36px;border-radius:8px;margin-top:4px"></div>
  </div>
  <div id="error" class="error hidden"></div>
  <div id="success" class="success hidden"></div>

  <div id="buttons" class="hidden" style="display:flex;flex-direction:column;gap:8px">
    <button class="button button-primary" id="tailor-btn">⚡ Analyze &amp; Tailor Resume</button>
    <button class="button button-secondary" id="download-btn" disabled>⬇️ Download DOCX</button>
    <button class="button button-secondary" id="download-pdf-btn" disabled>📄 Download PDF</button>
  </div>

  <div id="idle-actions" class="card hidden">
    <button class="button button-secondary" id="custom-analyse-btn">
      Custom Analyse for current page
    </button>
  </div>
`;

const CONNECT_CONTENT = `
  <div id="connect-screen" style="text-align:center;padding:28px 16px;">
    <div style="font-size:38px;margin-bottom:14px;">🔗</div>
    <h2 style="font-size:15px;font-weight:700;margin-bottom:8px;">Connect Your Account</h2>
    <p style="font-size:12px;color:#888;margin-bottom:20px;line-height:1.5;">
      Sign in to ZenLead so the extension can load your resume.
      Once logged in, this panel updates automatically.
    </p>
    <button id="open-app-btn" style="width:100%;padding:11px;border:none;border-radius:6px;
      font-size:13px;font-weight:600;cursor:pointer;margin-bottom:10px;
      background:linear-gradient(135deg,hsl(262,80%,50%) 0%,hsl(218,92%,50%) 100%);color:white;">
      🚀 Open ZenLead &amp; Sign In
    </button>
    <button id="retry-btn" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;
      font-size:13px;font-weight:600;cursor:pointer;background:#f5f5f5;color:#333;">
      🔄 Already logged in — Retry
    </button>
    <p style="font-size:11px;color:#aaa;margin-top:14px;line-height:1.5;">
      After signing in, click Retry or this panel auto-refreshes.
    </p>
  </div>
`;

// ─── Resume chip ──────────────────────────────────────────────────────────────
function updateResumeChip() {
  const chip = $("resume-chip");
  if (!chip) return;
  if (state.masterResume?.contact?.name) {
    const firstName = state.masterResume.contact.name.split(" ")[0];
    chip.textContent = `✓ ${firstName}`;
    chip.className = "loaded";
  } else {
    chip.textContent = "⚠ No resume";
    chip.className = "missing";
  }
}

// ─── Keyword chip renderer ────────────────────────────────────────────────────
function renderChips(containerId: string, keywords: string[], cssClass: string) {
  const el = $(containerId);
  if (!el) return;
  el.innerHTML = keywords.length
    ? keywords.map((k) => `<span class="chip ${cssClass}">${k}</span>`).join("")
    : `<span style="font-size:11px;color:hsl(215.4,16.3%,46.9%)">None</span>`;
}

// ─── Render helpers ──────────────────────────────────────────────────────────

function showConnectScreen() {
  const mc = mainContentEl();
  if (!mc) return;
  mc.innerHTML = CONNECT_CONTENT;

  $("open-app-btn")?.addEventListener("click", () => {
    chrome.tabs.create({ url: APP_URL });
  });

  $("retry-btn")?.addEventListener("click", async () => {
    const btn = $("retry-btn") as HTMLButtonElement | null;
    if (btn) { btn.textContent = "⏳ Checking…"; btn.disabled = true; }
    await loadMasterResume();
    renderUI();
  });
}

function ensureStandardContent() {
  const mc = mainContentEl();
  if (!mc) return;
  if (!$("status")) {
    mc.innerHTML = STANDARD_CONTENT;
    bindButtons();
  }
}

function renderUI() {
  updateResumeChip();

  // ── No resume: show connect screen ─────────────────────────────────────
  if (!state.masterResume) {
    showConnectScreen();
    return;
  }

  ensureStandardContent();

  const statusEl       = $("status");
  const jobInfoEl      = $("job-info");
  const statsCardEl    = $("stats-card");
  const sourceCardEl   = $("source-card");
  const keywordsCardEl = $("keywords-card");
  const improveCardEl  = $("improvements-card");
  const buttonsEl      = $("buttons");
  const idleActionsEl  = $("idle-actions");
  const tailorBtn      = $("tailor-btn")   as HTMLButtonElement | null;
  const downloadBtn    = $("download-btn") as HTMLButtonElement | null;
  const errorEl        = $("error");
  const successEl      = $("success");

  // Hide everything first
  statusEl?.classList.add("hidden");
  jobInfoEl?.classList.add("hidden");
  statsCardEl?.classList.add("hidden");
  sourceCardEl?.classList.add("hidden");
  keywordsCardEl?.classList.add("hidden");
  improveCardEl?.classList.add("hidden");
  errorEl?.classList.add("hidden");
  successEl?.classList.add("hidden");
  buttonsEl?.classList.add("hidden");
  idleActionsEl?.classList.add("hidden");

  // ── Results ready ──────────────────────────────────────────────────────
  if (state.jobData && state.tailoredResume && state.atsScore) {
    // Status bar
    statusEl?.classList.remove("hidden");
    const icon = statusEl?.querySelector(".status-icon");
    const text = statusEl?.querySelector(".status-text");
    if (icon) icon.textContent = "✅";
    if (text) text.innerHTML = `<strong>Resume Tailored</strong><span>${state.jobData.title} at ${state.jobData.company}</span>`;

    // Job info card
    jobInfoEl?.classList.remove("hidden");
    const jobTitleEl   = $("job-title");
    const jobCompanyEl = $("job-company");
    const atsWrapEl    = $("ats-score-wrap");

    if (jobTitleEl)  jobTitleEl.textContent  = state.jobData.title   || "—";
    if (jobCompanyEl) {
      const loc = (state.jobData as any).location;
      jobCompanyEl.textContent = [state.jobData.company, loc].filter(Boolean).join(" • ") || "—";
    }

    const masterScore   = state.masterAtsScore?.score || 0;
    const tailoredScore = state.atsScore.score        || 0;
    const improvement   = tailoredScore - masterScore;
    const color         = improvement >= 0 ? "#10b981" : "#ef4444";

    if (atsWrapEl) {
      const arcLen = 157;
      const filled = ((tailoredScore / 100) * arcLen).toFixed(1);
      atsWrapEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-top:4px">
          <div style="position:relative;flex-shrink:0;width:90px;height:50px">
            <svg viewBox="0 0 120 64" width="90" height="50">
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#ef4444"/>
                  <stop offset="60%" stop-color="#eab308"/>
                  <stop offset="100%" stop-color="#22c55e"/>
                </linearGradient>
              </defs>
              <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="#e5e7eb" stroke-width="10" stroke-linecap="round"/>
              <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="url(#sg)" stroke-width="10" stroke-linecap="round"
                stroke-dasharray="${filled} ${arcLen}"/>
            </svg>
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:2px">
              <span style="font-size:13px;font-weight:700;line-height:1">${tailoredScore}/100</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <div>
              <div style="font-size:10px;color:#999">Before</div>
              <div style="font-size:18px;font-weight:700;color:#666">${masterScore}%</div>
            </div>
            <div style="font-size:16px;color:#ccc">→</div>
            <div>
              <div style="font-size:10px;color:#999">After</div>
              <div style="font-size:18px;font-weight:700;color:#667eea">${tailoredScore}%</div>
            </div>
            <div style="padding:3px 6px;background:${color}20;border-radius:4px;align-self:flex-end;margin-bottom:2px">
              <span style="font-size:10px;color:${color};font-weight:600">${improvement >= 0 ? "+" : ""}${improvement}%</span>
            </div>
          </div>
        </div>`;
    }

    // ── Stats card ───────────────────────────────────────────────────────
    statsCardEl?.classList.remove("hidden");

    const matchedKws  = state.atsScore.keywordMatches || [];
    const masterKws   = state.masterAtsScore?.keywordMatches || [];
    const addedKws    = matchedKws.filter((k) => !masterKws.some((m) => m.toLowerCase() === k.toLowerCase()));
    const matchPct    = state.atsScore.matchPercentage || 0;

    // Count sections updated
    let changesCount = 0;
    if (state.masterResume && state.tailoredResume) {
      if (state.tailoredResume.summary !== state.masterResume.summary) changesCount++;
      state.masterResume.experience?.forEach((exp, i) => {
        const t = state.tailoredResume!.experience?.[i];
        if (t && JSON.stringify(t.description) !== JSON.stringify(exp.description)) changesCount++;
      });
      state.masterResume.projects?.forEach((proj, i) => {
        const t = state.tailoredResume!.projects?.[i];
        if (t && t.description !== proj.description) changesCount++;
      });
    }

    const statMatchedEl = $("stat-matched");
    const statAddedEl   = $("stat-added");
    const statChangesEl = $("stat-changes");
    const barPctEl      = $("bar-pct");
    const barFillEl     = $("bar-fill");

    if (statMatchedEl)  statMatchedEl.textContent  = String(matchedKws.length);
    if (statAddedEl)    statAddedEl.textContent    = String(addedKws.length);
    if (statChangesEl)  statChangesEl.textContent  = String(changesCount);
    if (barPctEl)       barPctEl.textContent       = `${matchPct}%`;
    if (barFillEl)      barFillEl.style.width      = `${Math.min(100, matchPct)}%`;

    // ── Source card ──────────────────────────────────────────────────────
    if (state.pageURL) {
      sourceCardEl?.classList.remove("hidden");
      try {
        const parsed = new URL(state.pageURL);
        const domainEl   = $("source-domain-text");
        const openLinkEl = $("open-job-link") as HTMLAnchorElement | null;
        if (domainEl)   domainEl.textContent = parsed.hostname.replace(/^www\./, "");
        if (openLinkEl) openLinkEl.href = state.pageURL;
      } catch { /* invalid URL — keep card hidden */ sourceCardEl?.classList.add("hidden"); }
    }

    // ── Keyword chips ────────────────────────────────────────────────────
    keywordsCardEl?.classList.remove("hidden");
    renderChips("matched-chips", matchedKws.slice(0, 15), "chip-green");
    renderChips("missing-chips", (state.atsScore.missingKeywords || []).slice(0, 15), "chip-red");

    // ── Improvements ─────────────────────────────────────────────────────
    const improvements = state.atsScore.improvements || [];
    if (improvements.length > 0) {
      improveCardEl?.classList.remove("hidden");
      const listEl = $("improvements-list");
      if (listEl) {
        listEl.innerHTML = improvements
          .slice(0, 5)
          .map((imp) => `<li>${imp}</li>`)
          .join("");
      }
    }

    // ── Action buttons ───────────────────────────────────────────────────
    buttonsEl?.classList.remove("hidden");
    if (downloadBtn) { downloadBtn.disabled = false; downloadBtn.style.opacity = "1"; }
    const downloadPdfBtn = $("download-pdf-btn") as HTMLButtonElement | null;
    if (downloadPdfBtn) { downloadPdfBtn.disabled = false; downloadPdfBtn.style.opacity = "1"; }
    return;
  }

  // ── Page captured, not yet analyzed ────────────────────────────────────
  if (state.pageHTML && !state.jobData) {
    statusEl?.classList.remove("hidden");
    const icon = statusEl?.querySelector(".status-icon");
    const text = statusEl?.querySelector(".status-text");

    if (state.isJobPosting === false) {
      if (icon) icon.textContent = "ℹ️";
      if (text) text.innerHTML = "<strong>No Job Posting Found</strong><span>Navigate to a specific job listing page and click Analyse</span>";
      idleActionsEl?.classList.remove("hidden");
    } else {
      if (icon) icon.textContent = "📄";
      if (text) text.innerHTML = "<strong>Job Posting Detected</strong><span>Click below to analyze and tailor your resume</span>";
      buttonsEl?.classList.remove("hidden");
      if (tailorBtn) { tailorBtn.textContent = "⚡ Analyze & Tailor Resume"; tailorBtn.disabled = false; }
    }
    return;
  }

  // ── Default idle ────────────────────────────────────────────────────────
  statusEl?.classList.remove("hidden");
  const icon = statusEl?.querySelector(".status-icon");
  const text = statusEl?.querySelector(".status-text");
  if (icon) icon.textContent = "✅";
  if (text) text.innerHTML = `<strong>Ready</strong><span>Go to a job listing and click the Analyse button, or use the button below</span>`;
  idleActionsEl?.classList.remove("hidden");
}

// ─── Button bindings ─────────────────────────────────────────────────────────

function bindButtons() {
  ($("tailor-btn")         as HTMLButtonElement | null)?.addEventListener("click", handleTailor);
  ($("download-btn")       as HTMLButtonElement | null)?.addEventListener("click", handleDownload);
  ($("download-pdf-btn")   as HTMLButtonElement | null)?.addEventListener("click", handleDownloadPDF);
  ($("custom-analyse-btn") as HTMLButtonElement | null)?.addEventListener("click", handleCustomAnalyse);
}

// ─── Auth / Resume loading ───────────────────────────────────────────────────

async function getAuthTokenFromWebApp(): Promise<string | null> {
  const patterns = [
    "*://*.zenlead.in/*",
    "https://landyourjob.zenlead.in/*",
    "http://localhost:*/*",
    "http://127.0.0.1:*/*",
  ];

  for (const pattern of patterns) {
    const tabs: chrome.tabs.Tab[] = await new Promise((resolve) =>
      chrome.tabs.query({ url: pattern }, resolve),
    );
    for (const tab of tabs) {
      if (!tab.id) continue;
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () =>
            localStorage.getItem("access_token") ||
            localStorage.getItem("token") ||
            localStorage.getItem("auth_token") ||
            null,
        });
        const token = results?.[0]?.result as string | null;
        if (token) return token;
      } catch { /* ignore */ }
    }
  }
  return null;
}

async function loadMasterResume(): Promise<ResumeData | null> {
  try {
    let resume = await getMasterResume();
    if (resume) {
      state.masterResume = resume;
      return resume;
    }

    let token: string | null = await new Promise((resolve) =>
      chrome.storage.sync.get(
        ["resumematch_auth_token", "resumematch_token"],
        (r) => resolve(r["resumematch_auth_token"] || r["resumematch_token"] || null),
      ),
    );

    if (!token) {
      token = await getAuthTokenFromWebApp();
      if (token) {
        await new Promise<void>((resolve) =>
          chrome.storage.sync.set({ resumematch_auth_token: token }, resolve),
        );
      }
    }

    if (token) {
      try {
        const baseUrl = await getApiBaseUrl();
        const client = new APIClient(baseUrl);
        const response = await client.getIncomingResume();
        if (response?.extracted_data) {
          resume = response.extracted_data;
          state.masterResume = resume as ResumeData;
          await setMasterResume(resume as ResumeData);
          return resume as ResumeData;
        }
      } catch { /* ignore */ }
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Page data ───────────────────────────────────────────────────────────────

async function getPageDataFromBackground(): Promise<void> {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 8;

    const tryGet = () => {
      attempts++;
      chrome.runtime.sendMessage({ action: "getPageData" }, (response) => {
        if (chrome.runtime.lastError) {
          if (attempts < maxAttempts) setTimeout(tryGet, 150);
          else resolve();
        } else if (response?.pageData?.pageHTML) {
          state.pageHTML = response.pageData.pageHTML;
          state.pageURL  = response.pageData.pageURL || null;
          resolve();
        } else {
          if (attempts < maxAttempts) setTimeout(tryGet, 150);
          else resolve();
        }
      });
    };
    tryGet();
  });
}

// ─── Extension message listeners ─────────────────────────────────────────────

function listenForExtensionMessages() {
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "resumeUpdated") {
      state.masterResume = null;
      loadMasterResume().then(() => renderUI());
    }
    if (request.action === "pageDataReady" && request.pageData?.pageHTML) {
      state.pageHTML       = request.pageData.pageHTML;
      state.pageURL        = request.pageData.pageURL || null;
      state.jobData        = null;
      state.tailoredResume = null;
      state.atsScore       = null;
      state.masterAtsScore = null;
      state.isJobPosting   = null;
      renderUI();
    }
    return true;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes["resumematch_auth_token"]?.newValue && !state.masterResume) {
      chrome.storage.sync.remove(["resumematch_master_resume"], () => {
        loadMasterResume().then(() => renderUI());
      });
    }
  });
}

// ─── Action handlers ─────────────────────────────────────────────────────────

async function handleTailor() {
  const errorEl   = $("error");
  const loadingEl = $("loading");
  const successEl = $("success");
  const tailorBtn = $("tailor-btn") as HTMLButtonElement | null;

  if (!state.pageHTML) {
    if (errorEl) { errorEl.classList.remove("hidden"); errorEl.textContent = "✗ No job page captured. Click Analyse on a job posting first."; }
    return;
  }
  if (!state.masterResume) {
    if (errorEl) { errorEl.classList.remove("hidden"); errorEl.textContent = "✗ Resume not found. Open ZenLead, sign in, then click Retry."; }
    return;
  }

  if (loadingEl) loadingEl.classList.remove("hidden");
  if (errorEl)   errorEl.classList.add("hidden");
  if (successEl) successEl.classList.add("hidden");
  if (tailorBtn) tailorBtn.disabled = true;

  try {
    let configuredSections: string[] = [];
    try {
      const settings = await getSettings();
      configuredSections = settings?.resumeContentSections || [];
    } catch { /* ignore */ }

    const baseUrl = await getApiBaseUrl();
    const client = new APIClient(baseUrl);
    const result = await client.analyzeJobAndTailorResume(
      state.pageHTML,
      state.masterResume,
      configuredSections,
    );

    state.jobData        = result.jobData;
    state.tailoredResume = result.tailoredResume;
    state.atsScore       = result.atsScore;
    state.masterAtsScore = result.masterAtsScore || null;

    if (loadingEl) loadingEl.classList.add("hidden");
    if (successEl) {
      successEl.classList.remove("hidden");
      successEl.textContent = `✓ Resume tailored! ATS Score: ${state.atsScore.score}%`;
    }

    // Persist lightweight record to backend (non-blocking)
    try {
      await client.saveApplication({
        jobTitle: state.jobData.title || "",
        company: state.jobData.company || "",
        location: (state.jobData as any).location || "",
        jobUrl: state.pageURL || "",
        atsScoreBefore: state.masterAtsScore?.score || 0,
        atsScoreAfter: state.atsScore.score || 0,
        matchPercentage: state.atsScore.matchPercentage || 0,
        matchedKeywords: state.atsScore.keywordMatches || [],
        missingKeywords: state.atsScore.missingKeywords || [],
        status: "applied",
      });
    } catch { /* non-blocking — don't fail the whole tailor flow */ }

    renderUI();
  } catch (error) {
    if (loadingEl) loadingEl.classList.add("hidden");
    const err = $("error");
    if (err) {
      err.classList.remove("hidden");
      err.textContent = `✗ Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
    if (tailorBtn) tailorBtn.disabled = false;
  }
}

async function handleDownloadPDF() {
  if (!state.tailoredResume || !state.jobData) return;

  const btn     = $("download-pdf-btn") as HTMLButtonElement | null;
  const errorEl = $("error");
  const successEl = $("success");

  if (btn) btn.disabled = true;
  if (errorEl) errorEl.classList.add("hidden");
  if (successEl) successEl.classList.add("hidden");

  try {
    await downloadResumePDF(state.tailoredResume, state.jobData.company, state.jobData.title);
    if (successEl) { successEl.classList.remove("hidden"); successEl.textContent = "✓ PDF downloaded!"; }
  } catch (error) {
    if (errorEl) { errorEl.classList.remove("hidden"); errorEl.textContent = `✗ PDF failed: ${error instanceof Error ? error.message : "Unknown error"}`; }
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function handleDownload() {
  if (!state.tailoredResume || !state.jobData) return;

  const downloadBtn = $("download-btn") as HTMLButtonElement | null;
  const errorEl     = $("error");
  const successEl   = $("success");

  if (downloadBtn) downloadBtn.disabled = true;
  if (errorEl)     errorEl.classList.add("hidden");
  if (successEl)   successEl.classList.add("hidden");

  try {
    await downloadResume(state.tailoredResume, state.jobData.company, state.jobData.title);
    if (successEl) { successEl.classList.remove("hidden"); successEl.textContent = "✓ Resume downloaded as DOCX!"; }
  } catch (error) {
    if (errorEl) { errorEl.classList.remove("hidden"); errorEl.textContent = `✗ Download failed: ${error instanceof Error ? error.message : "Unknown error"}`; }
  } finally {
    if (downloadBtn) downloadBtn.disabled = false;
  }
}

async function handleCustomAnalyse() {
  const customBtn = $("custom-analyse-btn") as HTMLButtonElement | null;
  const errorEl   = $("error");

  if (customBtn) { customBtn.disabled = true; customBtn.textContent = "⏳ Capturing…"; }

  try {
    const tabs = await new Promise<chrome.tabs.Tab[]>((resolve) =>
      chrome.tabs.query({ active: true, currentWindow: true }, resolve),
    );
    const tab = tabs[0];
    if (!tab?.id) throw new Error("No active tab found");

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({ html: document.documentElement.outerHTML, url: location.href }),
    });

    const payload = results?.[0]?.result as { html: string; url: string } | null;
    if (!payload?.html) throw new Error("Could not capture page content");

    state.pageHTML       = payload.html;
    state.pageURL        = payload.url;
    state.isJobPosting   = null;
    state.jobData        = null;
    state.tailoredResume = null;
    state.atsScore       = null;
    state.masterAtsScore = null;

    chrome.runtime.sendMessage({ action: "analyzeJob", pageHTML: payload.html, pageURL: payload.url }, () => {});
    renderUI();
  } catch (error) {
    if (errorEl) { errorEl.classList.remove("hidden"); errorEl.textContent = `✗ ${error instanceof Error ? error.message : "Unknown error"}`; }
  } finally {
    const btn = $("custom-analyse-btn") as HTMLButtonElement | null;
    if (btn) { btn.disabled = false; btn.textContent = "Custom Analyse for current page"; }
  }
}

// ─── Init ────────────────────────────────────────────────────────────────────

async function init() {
  // Wire up footer "the website" link
  const dashLink = $("dashboard-link") as HTMLAnchorElement | null;
  if (dashLink) {
    dashLink.href = APP_URL;
    dashLink.addEventListener("click", (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: APP_URL });
    });
  }

  listenForExtensionMessages();

  await loadMasterResume();
  await getPageDataFromBackground();

  renderUI();
  bindButtons();
}

console.log("[Sidebar] Script loaded");
init();

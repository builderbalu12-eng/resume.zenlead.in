import { APIClient } from "@/services/api";
import { getMasterResume, setMasterResume, getSettings } from "@/utils/storage";
import { downloadResume } from "@/services/resumeGenerator";
import { ResumeData, JobDescription, ATSScore } from "@/types";

interface SidebarState {
  masterResume: ResumeData | null;
  pageHTML: string | null;
  jobData: JobDescription | null;
  tailoredResume: ResumeData | null;
  atsScore: ATSScore | null;
  masterAtsScore: ATSScore | null;
  isJobPosting?: boolean | null;
}

let state: SidebarState = {
  masterResume: null,
  pageHTML: null,
  jobData: null,
  tailoredResume: null,
  atsScore: null,
  masterAtsScore: null,
  isJobPosting: null,
};

const APP_URL = "https://landyourjob.zenlead.in";

// ─── DOM helpers ────────────────────────────────────────────────────────────
// Always query fresh — the main-content innerHTML may be replaced at runtime.
const $ = (id: string) => document.getElementById(id);

const mainContentEl = () => $("main-content");

// ─── Dynamic API URL ─────────────────────────────────────────────────────────
// Reads the most up-to-date backend URL from chrome.storage.sync (written by
// the content script when the user visits the ZenLead web app).  Falls back to
// the URL that was baked in at extension build time, then to localhost.
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
    <div style="margin-bottom:8px"><strong>Job Title:</strong> <span id="job-title">-</span></div>
    <div style="margin-bottom:8px"><strong>Company:</strong> <span id="job-company">-</span></div>
    <div style="margin-bottom:8px"><strong>ATS Score:</strong>
      <span id="ats-score" style="color:#10b981;font-weight:600">-</span>
    </div>
    <div id="summary"></div>
  </div>
  <div id="loading" class="loading hidden">
    <div class="spinner"></div><p>Tailoring your resume…</p>
  </div>
  <div id="error" class="error hidden"></div>
  <div id="success" class="success hidden"></div>
  <div id="buttons" class="hidden">
    <button class="button button-primary" id="tailor-btn">⚡ Analyze &amp; Tailor Resume</button>
    <button class="button button-secondary" id="download-btn" disabled>⬇️ Download PDF</button>
  </div>
  <div id="idle-actions" class="card hidden">
    <button class="button button-secondary" id="custom-analyse-btn">
      Analyse current tab
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
  // If the connect screen replaced the standard DOM, restore it and re-bind
  if (!$("status")) {
    mc.innerHTML = STANDARD_CONTENT;
    bindButtons();
  }
}

function renderUI() {
  // ── No resume: always show connect screen ──────────────────────────────
  // (Even if pageHTML was captured — user must log in first)
  if (!state.masterResume) {
    showConnectScreen();
    return;
  }

  ensureStandardContent();

  // Re-query every time (DOM may have been rebuilt)
  const statusEl    = $("status");
  const jobInfoEl   = $("job-info");
  const buttonsEl   = $("buttons");
  const idleActionsEl = $("idle-actions");
  const tailorBtn   = $("tailor-btn")   as HTMLButtonElement | null;
  const downloadBtn = $("download-btn") as HTMLButtonElement | null;
  const errorEl     = $("error");
  const successEl   = $("success");

  // Hide everything first
  statusEl?.classList.add("hidden");
  jobInfoEl?.classList.add("hidden");
  errorEl?.classList.add("hidden");
  successEl?.classList.add("hidden");
  buttonsEl?.classList.add("hidden");
  idleActionsEl?.classList.add("hidden");

  // ── Results ready ───────────────────────────────────────────────────────
  if (state.jobData && state.tailoredResume && state.atsScore) {
    statusEl?.classList.remove("hidden");
    const icon = statusEl?.querySelector(".status-icon");
    const text = statusEl?.querySelector(".status-text");
    if (icon) icon.textContent = "✅";
    if (text) text.innerHTML = `<strong>Resume Tailored</strong><span>${state.jobData.title} at ${state.jobData.company}</span>`;

    jobInfoEl?.classList.remove("hidden");
    const jobTitleEl   = $("job-title");
    const jobCompanyEl = $("job-company");
    const atsScoreEl   = $("ats-score");
    const summaryEl    = $("summary");

    if (jobTitleEl)  jobTitleEl.textContent  = state.jobData.title   || "—";
    if (jobCompanyEl) {
      const loc = (state.jobData as any).location;
      jobCompanyEl.textContent = [state.jobData.company, loc].filter(Boolean).join(" • ") || "—";
    }

    const masterScore   = state.masterAtsScore?.score || 0;
    const tailoredScore = state.atsScore?.score        || 0;
    const improvement   = tailoredScore - masterScore;
    const color         = improvement >= 0 ? "#10b981" : "#ef4444";

    if (atsScoreEl) {
      const arcLen = 157;
      const filled = ((tailoredScore / 100) * arcLen).toFixed(1);
      const issueCount = state.atsScore.issueCount || 0;

      // Build breakdown bars HTML
      const breakdown = state.atsScore.scoreBreakdown || {};
      const breakdownHtml = Object.keys(breakdown).length > 0
        ? `<div style="margin-top:10px">
            ${Object.entries(breakdown).map(([k, v]) => `
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
                <span style="font-size:10px;color:#888;width:70px;text-transform:capitalize">${k}</span>
                <div style="flex:1;height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden">
                  <div style="height:100%;width:${v}%;background:#667eea;border-radius:2px"></div>
                </div>
                <span style="font-size:10px;font-weight:600;width:28px;text-align:right">${v}%</span>
              </div>`).join("")}
          </div>`
        : "";

      atsScoreEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
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
              ${issueCount > 0 ? `<span style="font-size:9px;color:#999">${issueCount} Issues</span>` : ""}
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
        </div>
        ${breakdownHtml}`;
    }
    if (summaryEl) {
      const missing = state.atsScore.missingKeywords?.slice(0, 3).join(", ");
      summaryEl.innerHTML = missing
        ? `<div style="font-size:11px;line-height:1.4;color:#888;margin-top:6px">Top missing: ${missing}</div>`
        : "";
    }

    buttonsEl?.classList.remove("hidden");
    if (downloadBtn) { downloadBtn.disabled = false; downloadBtn.style.opacity = "1"; }
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

  // ── Default idle (resume loaded, no page captured yet) ─────────────────
  statusEl?.classList.remove("hidden");
  const icon = statusEl?.querySelector(".status-icon");
  const text = statusEl?.querySelector(".status-text");
  if (icon) icon.textContent = "✅";
  if (text) text.innerHTML = `<strong>Ready</strong><span>Go to a job listing and click the Analyse button, or use the button below</span>`;
  idleActionsEl?.classList.remove("hidden");
}

// ─── Button bindings (called after any innerHTML replacement) ────────────────

function bindButtons() {
  const tailorBtn   = $("tailor-btn")         as HTMLButtonElement | null;
  const downloadBtn = $("download-btn")        as HTMLButtonElement | null;
  const customBtn   = $("custom-analyse-btn")  as HTMLButtonElement | null;

  tailorBtn?.addEventListener("click", handleTailor);
  downloadBtn?.addEventListener("click", handleDownload);
  customBtn?.addEventListener("click", handleCustomAnalyse);
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
        if (token) {
          console.log("[Sidebar] ✓ Got auth token via executeScript from:", tab.url);
          return token;
        }
      } catch (e) {
        console.warn("[Sidebar] executeScript failed on tab:", tab.url, e);
      }
    }
  }
  return null;
}

async function loadMasterResume(): Promise<ResumeData | null> {
  try {
    console.log("[Sidebar] Loading master resume…");

    // 1. chrome.storage.sync (fastest — already cached)
    let resume = await getMasterResume();
    if (resume) {
      console.log("[Sidebar] ✓ Resume from chrome.storage.sync:", resume.contact?.name);
      state.masterResume = resume;
      return resume;
    }

    // 2. Auth token → backend fetch
    let token: string | null = await new Promise((resolve) =>
      chrome.storage.sync.get(
        ["resumematch_auth_token", "resumematch_token"],
        (r) => resolve(r["resumematch_auth_token"] || r["resumematch_token"] || null),
      ),
    );

    if (!token) {
      console.log("[Sidebar] No token in storage — reading from web app tab…");
      token = await getAuthTokenFromWebApp();
      if (token) {
        await new Promise<void>((resolve) =>
          chrome.storage.sync.set({ resumematch_auth_token: token }, resolve),
        );
        console.log("[Sidebar] ✓ Token cached");
      }
    }

    if (token) {
      try {
        console.log("[Sidebar] Fetching resume from backend…");
        // Use a fresh client with the dynamic URL so a restarted tunnel works.
        const baseUrl = await getApiBaseUrl();
        console.log("[Sidebar] Using API base URL:", baseUrl);
        const client = new APIClient(baseUrl);
        const response = await client.getIncomingResume();
        if (response?.extracted_data) {
          resume = response.extracted_data;
          console.log("[Sidebar] ✓ Resume from backend:", (resume as ResumeData).contact?.name);
          state.masterResume = resume as ResumeData;
          await setMasterResume(resume as ResumeData);
          return resume as ResumeData;
        }
      } catch (e) {
        console.warn("[Sidebar] Backend fetch failed:", e);
      }
    }

    console.warn("[Sidebar] Resume not found anywhere");
    return null;
  } catch (err) {
    console.error("[Sidebar] loadMasterResume error:", err);
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
          console.log("[Sidebar] ✓ Page data received:", response.pageData.pageHTML.length, "chars");
          state.pageHTML = response.pageData.pageHTML;
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
      console.log("[Sidebar] ✓ pageDataReady push received");
      state.pageHTML = request.pageData.pageHTML;
      state.jobData = null;
      state.tailoredResume = null;
      state.atsScore = null;
      state.masterAtsScore = null;
      state.isJobPosting = null;
      renderUI();
    }
    return true;
  });

  // Auto-detect login: content.ts writes the token when user visits ZenLead
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes["resumematch_auth_token"]?.newValue && !state.masterResume) {
      console.log("[Sidebar] Token appeared — auto-loading resume…");
      // Clear cached resume so we force a fresh backend fetch with the new token
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

    // Persist application record
    try {
      const appRecord = {
        jobTitle: state.jobData.title || "Unknown",
        company:  state.jobData.company || "Unknown",
        jobDescription: state.jobData,
        originalResume: state.masterResume,
        tailoredResume: state.tailoredResume,
        atsScore: state.atsScore.score || 0,
        appliedDate: new Date().toISOString(),
        status: "applied",
        createdAt: new Date().toISOString(),
      };
      chrome.storage.sync.get(["resumematch_applications"], (res) => {
        const existing = res["resumematch_applications"];
        let apps: any[] = existing ? (typeof existing === "string" ? JSON.parse(existing) : existing) : [];
        apps.push(appRecord);
        chrome.storage.sync.set({ resumematch_applications: JSON.stringify(apps) });
      });
    } catch { /* ignore */ }

    renderUI();
  } catch (error) {
    if (loadingEl) loadingEl.classList.add("hidden");
    const errorEl2 = $("error");
    if (errorEl2) {
      errorEl2.classList.remove("hidden");
      errorEl2.textContent = `✗ Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
    if (tailorBtn) tailorBtn.disabled = false;
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

    state.pageHTML     = payload.html;
    state.isJobPosting = null;
    state.jobData      = null;
    state.tailoredResume = null;
    state.atsScore     = null;
    state.masterAtsScore = null;

    chrome.runtime.sendMessage({ action: "analyzeJob", pageHTML: payload.html, pageURL: payload.url }, () => {});
    renderUI();
  } catch (error) {
    console.error("[Sidebar] CustomAnalyse error:", error);
    if (errorEl) { errorEl.classList.remove("hidden"); errorEl.textContent = `✗ ${error instanceof Error ? error.message : "Unknown error"}`; }
  } finally {
    const customBtn2 = $("custom-analyse-btn") as HTMLButtonElement | null;
    if (customBtn2) { customBtn2.disabled = false; customBtn2.textContent = "Analyse current tab"; }
  }
}

// ─── Init ────────────────────────────────────────────────────────────────────

async function init() {
  console.log("[Sidebar] Initializing…");

  listenForExtensionMessages();

  await loadMasterResume();
  await getPageDataFromBackground();

  renderUI();
  // Bind buttons (they exist in the standard content on first load)
  bindButtons();
}

console.log("[Sidebar] Script loaded");
init();

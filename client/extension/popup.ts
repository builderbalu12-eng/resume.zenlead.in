import { getMasterResume, setMasterResume, getSettings } from "@/utils/storage";
import { apiClient } from "@/services/api";
import { downloadResume } from "@/services/resumeGenerator";
import { ResumeData, JobDescription, ATSScore } from "@/types";

const WEBSITE_URL = "https://landyourjob.zenlead.in";

interface PopupState {
  masterResume: ResumeData | null;
  pageHTML: string | null;
  pageURL: string | null;
  jobData: JobDescription | null;
  tailoredResume: ResumeData | null;
  atsScore: ATSScore | null;
  masterAtsScore: ATSScore | null;
  isJobPosting?: boolean | null;
}

let state: PopupState = {
  masterResume: null,
  pageHTML: null,
  pageURL: null,
  jobData: null,
  tailoredResume: null,
  atsScore: null,
  masterAtsScore: null,
  isJobPosting: null,
};

console.log("[Popup] Script loaded at", new Date().toISOString());

// ── DOM refs ──────────────────────────────────────────────────────────────────
const resumeChipEl       = document.getElementById("resume-chip");
const statusEl           = document.getElementById("status");
const onboardingEl       = document.getElementById("onboarding");
const jobInfoEl          = document.getElementById("job-info");
const statsCardEl        = document.getElementById("stats-card");
const sourceCardEl       = document.getElementById("source-card");
const keywordsCardEl     = document.getElementById("keywords-card");
const improvementsCardEl = document.getElementById("improvements-card");
const loadingEl          = document.getElementById("loading");
const errorEl            = document.getElementById("error");
const successEl          = document.getElementById("success");
const buttonsEl          = document.getElementById("buttons");

const tailorBtn        = document.getElementById("tailor-btn")        as HTMLButtonElement | null;
const downloadBtn      = document.getElementById("download-btn")      as HTMLButtonElement | null;
const dashboardLink    = document.getElementById("dashboard-link")    as HTMLAnchorElement | null;
const customAnalyseBtn = document.getElementById("custom-analyse-btn") as HTMLButtonElement | null;
const openWebsiteBtn   = document.getElementById("open-website-btn") as HTMLButtonElement | null;

// ── Website link (footer + onboarding button) ────────────────────────────────
function openWebsite() {
  chrome.tabs.create({ url: WEBSITE_URL });
}

if (dashboardLink) {
  dashboardLink.onclick = (e) => { e.preventDefault(); openWebsite(); };
}
if (openWebsiteBtn) {
  openWebsiteBtn.addEventListener("click", openWebsite);
}

// ── Resume chip helper ────────────────────────────────────────────────────────
function updateResumeChip() {
  if (!resumeChipEl) return;
  if (state.masterResume) {
    const firstName = state.masterResume.contact?.name?.split(" ")[0] || "Loaded";
    resumeChipEl.textContent = `✓ ${firstName}`;
    resumeChipEl.className = "loaded";
  } else {
    resumeChipEl.textContent = "⚠ No resume";
    resumeChipEl.className = "missing";
  }
}

// ── Keyword chips helpers ─────────────────────────────────────────────────────
function renderChips(containerId: string, keywords: string[], cssClass: string) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = keywords
    .map((k) => `<span class="chip ${cssClass}">${k}</span>`)
    .join("");
}

// ── Helper to get resume from localhost tabs ──────────────────────────────────
async function getResumeFromLocalhost(): Promise<ResumeData | null> {
  return new Promise((resolve) => {
    try {
      chrome.tabs.query({ url: "http://localhost:*/*" }, (tabs) => {
        if (!tabs.length) { resolve(null); return; }
        chrome.tabs.sendMessage(tabs[0].id!, { action: "getResume" }, (response) => {
          if (chrome.runtime.lastError) { resolve(null); return; }
          resolve(response?.resume || null);
        });
      });
    } catch (e) {
      resolve(null);
    }
  });
}

// ── Load master resume ────────────────────────────────────────────────────────
async function loadMasterResume(): Promise<ResumeData | null> {
  try {
    let resume = await getMasterResume();
    if (resume) { state.masterResume = resume; return resume; }

    // Try backend (if logged in)
    try {
      const token = await new Promise<string | null>((resolve) => {
        if (typeof chrome !== "undefined" && chrome.storage) {
          chrome.storage.sync.get(["resumematch_auth_token"], (r) =>
            resolve((r["resumematch_auth_token"] as string) || null)
          );
        } else { resolve(null); }
      });
      if (token) {
        const response = await apiClient.getIncomingResume();
        if (response?.extracted_data) {
          resume = response.extracted_data;
          state.masterResume = resume;
          try { await setMasterResume(resume!); } catch (_) {}
          return resume;
        }
      }
    } catch (_) {}

    // Try localhost tab
    resume = await getResumeFromLocalhost();
    if (resume) {
      state.masterResume = resume;
      try { await setMasterResume(resume); } catch (_) {}
      return resume;
    }

    return null;
  } catch (error) {
    console.error("[Popup] Error loading resume:", error);
    return null;
  }
}

// ── Listen for resume updates ─────────────────────────────────────────────────
function listenForResumeUpdates() {
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "resumeUpdated") {
      state.masterResume = null;
      loadMasterResume().then(() => updateUI());
    }
    return true;
  });
}

// ── Get page data from background ─────────────────────────────────────────────
async function getPageDataFromBackground(): Promise<void> {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 8;
    const tryGetData = () => {
      attempts++;
      chrome.runtime.sendMessage({ action: "getPageData" }, (response) => {
        if (chrome.runtime.lastError) {
          if (attempts < maxAttempts) setTimeout(tryGetData, 150);
          else resolve();
        } else if (response?.pageData?.pageHTML) {
          state.pageHTML = response.pageData.pageHTML;
          state.pageURL  = response.pageData.pageURL || null;
          resolve();
        } else {
          if (attempts < maxAttempts) setTimeout(tryGetData, 150);
          else resolve();
        }
      });
    };
    tryGetData();
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  try {
    listenForResumeUpdates();
    await loadMasterResume();
    await getPageDataFromBackground();
    updateUI();
  } catch (error) {
    console.error("[Popup] Initialization error:", error);
    updateUI();
  }
}

// ── Main UI renderer ──────────────────────────────────────────────────────────
function updateUI() {
  // Always update resume chip
  updateResumeChip();

  // Hide everything variable
  statusEl?.classList.add("hidden");
  onboardingEl?.classList.add("hidden");
  jobInfoEl?.classList.add("hidden");
  statsCardEl?.classList.add("hidden");
  sourceCardEl?.classList.add("hidden");
  keywordsCardEl?.classList.add("hidden");
  improvementsCardEl?.classList.add("hidden");
  loadingEl?.classList.add("hidden");
  errorEl?.classList.add("hidden");
  successEl?.classList.add("hidden");
  buttonsEl?.classList.add("hidden");

  // ── State: No master resume ──
  if (!state.masterResume) {
    if (statusEl) {
      statusEl.classList.remove("hidden");
      const icon = statusEl.querySelector(".status-icon");
      const text = statusEl.querySelector(".status-text");
      if (icon) icon.textContent = "⚠️";
      if (text) text.innerHTML = "<strong>No Master Resume</strong><span>Follow the steps below to get started</span>";
    }
    onboardingEl?.classList.remove("hidden");
    return;
  }

  // ── State: Page captured, not yet analyzed ──
  if (state.pageHTML && !state.jobData) {
    if (statusEl) {
      statusEl.classList.remove("hidden");
      const icon = statusEl.querySelector(".status-icon");
      const text = statusEl.querySelector(".status-text");
      if (state.isJobPosting === false) {
        if (icon) icon.textContent = "ℹ️";
        if (text) text.innerHTML = "<strong>No Job Posting Found</strong><span>Use Custom Analyse on a job page or open a specific job listing</span>";
      } else {
        if (icon) icon.textContent = "📄";
        if (text) text.innerHTML = "<strong>Job Posting Detected</strong><span>Click below to analyse and tailor your resume</span>";
        if (buttonsEl) {
          buttonsEl.classList.remove("hidden");
          buttonsEl.style.display = "flex";
        }
        if (tailorBtn) { tailorBtn.textContent = "⚡ Analyze & Tailor Resume"; tailorBtn.disabled = false; }
      }
    }
    return;
  }

  // ── State: Results available ──
  if (state.jobData && state.tailoredResume && state.atsScore) {
    // Status bar
    if (statusEl) {
      statusEl.classList.remove("hidden");
      const icon = statusEl.querySelector(".status-icon");
      const text = statusEl.querySelector(".status-text");
      if (icon) icon.textContent = "✅";
      if (text) text.innerHTML = `<strong>Resume Tailored!</strong><span>${state.jobData.title} at ${state.jobData.company}</span>`;
    }

    // Job info card
    if (jobInfoEl) {
      jobInfoEl.classList.remove("hidden");
      const titleEl   = document.getElementById("job-title");
      const companyEl = document.getElementById("job-company");
      const atsEl     = document.getElementById("ats-score");

      if (titleEl)   titleEl.textContent   = state.jobData.title   || "Unknown";
      if (companyEl) companyEl.textContent = state.jobData.company || "Unknown";

      const masterScore   = state.masterAtsScore?.score || 0;
      const tailoredScore = state.atsScore.score || 0;
      const improvement   = tailoredScore - masterScore;
      const impColor      = improvement >= 0 ? "#10b981" : "#ef4444";

      if (atsEl) {
        atsEl.innerHTML = `
          <div style="display:flex; gap:10px; align-items:center;">
            <div style="flex:1; text-align:center; padding:8px; background:#f8fafc; border-radius:6px;">
              <div style="font-size:10px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:.04em; margin-bottom:2px;">Before</div>
              <div style="font-size:22px; font-weight:800; color:#64748b;">${masterScore}%</div>
            </div>
            <div style="font-size:20px; color:#cbd5e1;">→</div>
            <div style="flex:1; text-align:center; padding:8px; background:#f0fdf4; border-radius:6px; border:1px solid #bbf7d0;">
              <div style="font-size:10px; color:#16a34a; font-weight:600; text-transform:uppercase; letter-spacing:.04em; margin-bottom:2px;">After</div>
              <div style="font-size:22px; font-weight:800; color:#16a34a;">${tailoredScore}%</div>
            </div>
            <div style="padding:6px 10px; background:${impColor}15; border-radius:6px; text-align:center; border:1px solid ${impColor}40;">
              <div style="font-size:13px; color:${impColor}; font-weight:700;">${improvement >= 0 ? "+" : ""}${improvement}%</div>
            </div>
          </div>`;
      }
    }

    // ── Stats card ──
    if (statsCardEl) {
      statsCardEl.classList.remove("hidden");

      const masterMatched  = state.masterAtsScore?.keywordMatches  || [];
      const tailoredMatched = state.atsScore.keywordMatches || [];
      const matchedCount   = tailoredMatched.length;
      // keywords that appear in tailored but not in master = newly added
      const addedCount     = tailoredMatched.filter(
        (k) => !masterMatched.some((mk) => mk.toLowerCase() === k.toLowerCase())
      ).length;

      // count changed sections: summary + experience bullets + projects
      let changesCount = 0;
      if (state.masterResume && state.tailoredResume) {
        if (state.tailoredResume.summary !== state.masterResume.summary) changesCount++;
        (state.tailoredResume.experience || []).forEach((exp, i) => {
          const orig = state.masterResume!.experience[i];
          if (orig && JSON.stringify(exp.description) !== JSON.stringify(orig.description)) changesCount++;
        });
        (state.tailoredResume.projects || []).forEach((proj, i) => {
          const orig = state.masterResume!.projects?.[i];
          if (orig && proj.description !== orig.description) changesCount++;
        });
      }

      const matchPct = Math.min(100, state.atsScore.matchPercentage || 0);

      const statMatchedEl = document.getElementById("stat-matched");
      const statAddedEl   = document.getElementById("stat-added");
      const statChangesEl = document.getElementById("stat-changes");
      const barFillEl     = document.getElementById("keyword-bar");
      const barPctEl      = document.getElementById("bar-pct");

      if (statMatchedEl)  statMatchedEl.textContent  = String(matchedCount);
      if (statAddedEl)    statAddedEl.textContent    = String(addedCount);
      if (statChangesEl)  statChangesEl.textContent  = String(changesCount);
      if (barFillEl)      barFillEl.style.width      = `${matchPct}%`;
      if (barPctEl)       barPctEl.textContent       = `${matchPct}%`;
    }

    // ── Source card ──
    if (sourceCardEl && state.pageURL) {
      sourceCardEl.classList.remove("hidden");
      try {
        const url    = new URL(state.pageURL);
        const domain = url.hostname.replace(/^www\./, "");
        const domainEl  = document.getElementById("source-domain-text");
        const linkEl    = document.getElementById("job-post-link") as HTMLAnchorElement | null;
        if (domainEl) domainEl.textContent = domain;
        if (linkEl)   linkEl.href          = state.pageURL;
      } catch (_) { /* invalid URL — keep card hidden */ sourceCardEl.classList.add("hidden"); }
    }

    // Keywords card
    const matched  = (state.atsScore.keywordMatches  || []).slice(0, 8);
    const missing  = (state.atsScore.missingKeywords || []).slice(0, 8);
    const improvements = (state.atsScore.improvements || []).slice(0, 4);

    if ((matched.length > 0 || missing.length > 0) && keywordsCardEl) {
      keywordsCardEl.classList.remove("hidden");

      const matchedSection  = document.getElementById("matched-section");
      const missingSection  = document.getElementById("missing-section");
      const missingDivider  = document.getElementById("missing-divider");

      if (matched.length > 0 && matchedSection) {
        matchedSection.classList.remove("hidden");
        renderChips("matched-chips", matched, "chip-green");
      }
      if (missing.length > 0 && missingSection) {
        missingSection.classList.remove("hidden");
        if (matched.length > 0 && missingDivider) missingDivider.classList.remove("hidden");
        renderChips("missing-chips", missing, "chip-red");
      }
    }

    // Improvements card
    if (improvements.length > 0 && improvementsCardEl) {
      improvementsCardEl.classList.remove("hidden");
      const listEl = document.getElementById("improvements-list");
      if (listEl) {
        listEl.innerHTML = improvements
          .map((tip: string) => `<li>${tip}</li>`)
          .join("");
      }
    }

    // Buttons
    if (buttonsEl) {
      buttonsEl.classList.remove("hidden");
      buttonsEl.style.display = "flex";
    }
    if (downloadBtn) downloadBtn.disabled = false;
    return;
  }

  // ── Default: no page captured yet ──
  if (statusEl) {
    statusEl.classList.remove("hidden");
    const icon = statusEl.querySelector(".status-icon");
    const text = statusEl.querySelector(".status-text");
    if (icon) icon.textContent = "ℹ️";
    if (text) text.innerHTML = "<strong>No Job Posting Found</strong><span>Click the 'Analyse' button on a job posting page</span>";
  }
}

// ── Tailor button ─────────────────────────────────────────────────────────────
if (tailorBtn) {
  tailorBtn.addEventListener("click", async () => {
    if (!state.masterResume || !state.pageHTML) return;

    loadingEl?.classList.remove("hidden");
    errorEl?.classList.add("hidden");
    successEl?.classList.add("hidden");
    if (tailorBtn) tailorBtn.disabled = true;

    try {
      // Load configured custom sections
      let configuredSections: string[] = [];
      try {
        const settings = await getSettings();
        configuredSections = settings?.resumeContentSections || [];
      } catch (_) {}

      const result = await apiClient.analyzeJobAndTailorResume(
        state.pageHTML,
        state.masterResume,
        configuredSections,
      );

      console.log("[Popup] ✓ Tailoring complete:", result.jobData.title, "at", result.jobData.company);

      state.jobData        = result.jobData;
      state.tailoredResume = result.tailoredResume;
      state.atsScore       = result.atsScore;
      state.masterAtsScore = result.masterAtsScore || null;

      loadingEl?.classList.add("hidden");
      if (successEl) {
        successEl.classList.remove("hidden");
        successEl.textContent = `✓ Resume tailored! ATS Score: ${state.atsScore.score}%`;
      }

      // Persist lightweight record to backend (non-blocking)
      try {
        await apiClient.saveApplication({
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
      } catch (_) { /* non-blocking */ }

      updateUI();
    } catch (error) {
      loadingEl?.classList.add("hidden");
      if (errorEl) {
        errorEl.classList.remove("hidden");
        errorEl.textContent = `✗ Error: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
      console.error("[Popup] Tailoring error:", error);
      if (tailorBtn) tailorBtn.disabled = false;
    }
  });
}

// ── Download button ───────────────────────────────────────────────────────────
if (downloadBtn) {
  downloadBtn.addEventListener("click", async () => {
    if (!state.tailoredResume || !state.jobData) return;
    downloadBtn.disabled = true;
    errorEl?.classList.add("hidden");
    successEl?.classList.add("hidden");
    try {
      await downloadResume(state.tailoredResume, state.jobData.company, state.jobData.title);
      if (successEl) { successEl.classList.remove("hidden"); successEl.textContent = "✓ Resume downloaded as DOCX!"; }
      downloadBtn.disabled = false;
    } catch (error) {
      if (errorEl) { errorEl.classList.remove("hidden"); errorEl.textContent = `✗ Download failed: ${error instanceof Error ? error.message : "Unknown error"}`; }
      console.error("[Popup] Download error:", error);
      downloadBtn.disabled = false;
    }
  });
}

// ── Custom Analyse button ─────────────────────────────────────────────────────
if (customAnalyseBtn) {
  customAnalyseBtn.addEventListener("click", async () => {
    customAnalyseBtn.disabled = true;
    customAnalyseBtn.textContent = "⏳ Analyzing current page...";
    try {
      const tab = await new Promise<chrome.tabs.Tab | null>((resolve) =>
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs?.[0] || null))
      );
      if (!tab?.id) throw new Error("No active tab found");

      const payload = await new Promise<{ html: string; url: string } | null>((resolve) => {
        chrome.scripting.executeScript(
          { target: { tabId: tab.id! }, func: () => ({ html: document.documentElement.outerHTML, url: location.href }) },
          (results: any) => {
            if (chrome.runtime.lastError) { resolve(null); return; }
            resolve(results?.[0]?.result || null);
          }
        );
      });

      if (!payload?.html) throw new Error("Could not capture page content");

      state.pageHTML = payload.html;
      state.pageURL  = payload.url || null;
      state.isJobPosting = null;
      chrome.runtime.sendMessage({ action: "analyzeJob", pageHTML: payload.html, pageURL: payload.url }, () => {});
      updateUI();
    } catch (error) {
      console.error("[Popup] CustomAnalyse error:", error);
      if (errorEl) { errorEl.classList.remove("hidden"); errorEl.textContent = `✗ Error: ${error instanceof Error ? error.message : "Unknown error"}`; }
    } finally {
      customAnalyseBtn.disabled = false;
      customAnalyseBtn.textContent = "Custom Analyse for current page";
    }
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────
console.log("[Popup] Starting initialization...");
init();

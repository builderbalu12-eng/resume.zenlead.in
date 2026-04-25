import React, { useState, useEffect, useRef } from "react";
import { ResumeData, JobDescription } from "@/types";
import { getMasterResume } from "@/utils/storage";
import { apiClient } from "@/services/api";
import { downloadResume, downloadResumePDF } from "@/services/resumeGenerator";

/* ── tiny icons (copied verbatim from prototype, do not swap for lucide) ── */
const Icon = ({ d, size = 16, stroke = "currentColor", fill = "none", ...p }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);
const IcoFile = (p: any) => <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" {...p} />;
const IcoBriefcase = (p: any) => <Icon d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" {...p} />;
const IcoUpload = (p: any) => <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12" {...p} />;
const IcoLink = (p: any) => <Icon d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" {...p} />;
const IcoCopy = (p: any) => <Icon d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2 M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z" {...p} />;
const IcoCheck = (p: any) => <Icon d="M20 6L9 17l-5-5" {...p} />;
const IcoArrow = (p: any) => <Icon d="M5 12h14 M12 5l7 7-7 7" {...p} />;
const IcoEdit = (p: any) => <Icon d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" {...p} />;
const IcoSettings = (p: any) => <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" {...p} />;

/* ── step tabs (Input / Loading / Results) ── */
type Screen = "input" | "loading" | "results";
const StepTabs: React.FC<{
  current: Screen;
  hasResults: boolean;
  onJump: (s: Screen) => void;
}> = ({ current, hasResults, onJump }) => {
  const order: Screen[] = ["input", "loading", "results"];
  const currentIdx = order.indexOf(current);
  const tabs: { id: Screen; label: string }[] = [
    { id: "input",   label: "1 · Input" },
    { id: "loading", label: "2 · Loading" },
    { id: "results", label: "3 · Results" },
  ];
  const isReachable = (s: Screen) => {
    if (s === "input") return true;
    if (s === "loading") return current === "loading";
    if (s === "results") return hasResults;
    return false;
  };

  return (
    <div style={{
      borderBottom: "1px solid var(--border-subtle)",
      padding: "0 24px",
      display: "flex",
      gap: 4,
      background: "var(--bg)",
    }}>
      {tabs.map((t, i) => {
        const reachable = isReachable(t.id);
        const active = current === t.id;
        const past = i < currentIdx;
        return (
          <button
            key={t.id}
            onClick={() => reachable && onJump(t.id)}
            disabled={!reachable}
            style={{
              position: "relative",
              padding: "14px 18px",
              background: "transparent",
              border: "none",
              fontSize: 13,
              fontWeight: active ? 500 : 400,
              fontFamily: "DM Sans, sans-serif",
              color: active ? "var(--text)" : past ? "var(--text-2)" : "var(--text-3)",
              cursor: reachable ? "pointer" : "default",
              opacity: reachable ? 1 : 0.55,
              transition: "color 0.15s",
            }}
          >
            {t.label}
            {active && (
              <span style={{
                position: "absolute", bottom: -1, left: 12, right: 12,
                height: 2, background: "var(--accent)", borderRadius: 1,
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
};

/* ── shared styles (verbatim from prototype) ── */
const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  overflow: "hidden",
};
const cardHeader: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8,
  padding: "12px 16px",
  borderBottom: "1px solid var(--border-subtle)",
  fontSize: 13, color: "var(--text)",
};
const textareaStyle: React.CSSProperties = {
  width: "100%", display: "block", resize: "vertical",
  background: "transparent", border: "none", outline: "none",
  padding: "14px 16px", fontSize: 13, color: "var(--text-2)",
  lineHeight: 1.65, fontFamily: "DM Sans, sans-serif",
};
const fetchBtnStyle: React.CSSProperties = {
  background: "var(--accent)", color: "#fff", border: "none",
  borderRadius: 7, padding: "0 16px", fontSize: 13, fontWeight: 500,
  cursor: "pointer", fontFamily: "DM Sans, sans-serif",
};
const sectionLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, color: "var(--text-3)",
  letterSpacing: "0.07em", textTransform: "uppercase",
  marginBottom: 10,
};

/* ── per-section colors (used by both pie chart and bars) ── */
const SECTION_COLORS: Record<string, string> = {
  "Skills":         "#3b82f6", // blue
  "Skills Relevant": "#3b82f6",
  "Experience":     "#ef4444", // red
  "Experience Relevant": "#ef4444",
  "Projects":       "#10b981", // green
  "Projects Relevant": "#10b981",
  "Objective":      "#eab308", // yellow
  "Summary":        "#eab308", // yellow (treated as objective)
  "Achievements":   "#92400e", // brown
  "Certifications": "#ec4899", // pink
  "Education":      "#a855f7", // purple
  "Hobbies":        "#06b6d4", // cyan
  "Hobbies & Interests": "#06b6d4",
  "Publications":   "#f97316", // orange
  "Not Relevant":   "#64748b", // slate (gap)
  "Others Relevant": "#94a3b8",
};
const FALLBACK_PALETTE = ["#0ea5e9", "#84cc16", "#f59e0b", "#d946ef", "#14b8a6", "#f43f5e", "#a3a3a3"];
const colorForSection = (name: string, idx: number): string =>
  SECTION_COLORS[name] || FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];

/* ── style settings (font / size / template) ── */
type StyleConfig = {
  fontFamily: "Georgia" | "Arial" | "DM Sans" | "Times New Roman";
  fontSize: number;
  template: "auto" | "1p" | "2p" | "cv";
};
const DEFAULT_STYLE: StyleConfig = { fontFamily: "Georgia", fontSize: 11.5, template: "auto" };

/* ── INPUT SCREEN ── */
function InputScreen({
  onSubmit, resumeText, setResumeText, jobText, setJobText,
  jobUrl, setJobUrl, notes, setNotes, length, setLength,
  styleCfg, setStyleCfg, busy,
}: {
  onSubmit: () => void;
  resumeText: string; setResumeText: (s: string) => void;
  jobText: string; setJobText: (s: string) => void;
  jobUrl: string; setJobUrl: (s: string) => void;
  notes: string; setNotes: (s: string) => void;
  length: string; setLength: (s: string) => void;
  styleCfg: StyleConfig; setStyleCfg: (c: StyleConfig) => void;
  busy: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [stylePanelOpen, setStylePanelOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const lengths = [
    { id: "auto", label: "Auto-detect", sub: "Let AI decide" },
    { id: "1p", label: "1 Page", sub: "Fresher / under 5 yrs" },
    { id: "2p", label: "2 Pages", sub: "5–10+ yrs experience" },
    { id: "cv", label: "Academic CV", sub: "PhD / research / academia" },
  ];

  const canSubmit = !busy && resumeText.trim().length > 20 && (jobText.trim().length > 20 || jobUrl.trim().length > 5);

  const handleFile = async (file: File) => {
    if (!file) return;
    const buf = await file.arrayBuffer();
    // Send to backend extract endpoint via api client; simple text fallback
    try {
      const text = new TextDecoder().decode(buf);
      // For PDFs the bytes will be opaque; the backend extract pipeline handles that.
      // Here we just stash plain text; backend tailor will accept either.
      setResumeText(text.length > 50 && /[a-zA-Z]/.test(text) ? text : `(uploaded ${file.name})`);
    } catch {
      setResumeText(`(uploaded ${file.name})`);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px", position: "relative" }}>
      <div style={{ position: "absolute", top: 16, right: 24, zIndex: 4 }}>
        <button
          onClick={() => setStylePanelOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: 7, padding: "5px 10px", fontSize: 12,
            color: "var(--text-2)", cursor: "pointer", fontFamily: "DM Sans, sans-serif",
          }}
        >
          <IcoSettings size={12} /> Style
        </button>
      </div>
      <div style={{ position: "relative" }}>
        {/* style panel popover */}
        {stylePanelOpen && (
          <div style={{
            position: "absolute", right: 24, top: -10, zIndex: 5,
            ...cardStyle, padding: 16, width: 280,
            boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
          }}>
            <div style={{ ...sectionLabel, marginBottom: 12 }}>Resume Style</div>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>Font</label>
            <select
              value={styleCfg.fontFamily}
              onChange={e => setStyleCfg({ ...styleCfg, fontFamily: e.target.value as StyleConfig["fontFamily"] })}
              style={{
                width: "100%", marginBottom: 12, padding: "7px 10px",
                background: "var(--surface2)", border: "1px solid var(--border)",
                borderRadius: 6, color: "var(--text)", fontSize: 13, fontFamily: "DM Sans, sans-serif",
              }}>
              <option value="Georgia">Georgia (serif)</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Arial">Arial</option>
              <option value="DM Sans">DM Sans</option>
            </select>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>
              Font size: {styleCfg.fontSize}pt
            </label>
            <input
              type="range" min={9} max={14} step={0.5}
              value={styleCfg.fontSize}
              onChange={e => setStyleCfg({ ...styleCfg, fontSize: parseFloat(e.target.value) })}
              style={{ width: "100%", marginBottom: 12, accentColor: "oklch(0.62 0.22 270)" }}
            />
            <label style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>Template</label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {[["auto", "Auto"], ["1p", "1 Page"], ["2p", "2 Pages"], ["cv", "CV"]].map(([id, label]) => (
                <button key={id}
                  onClick={() => setStyleCfg({ ...styleCfg, template: id as StyleConfig["template"] })}
                  style={{
                    fontSize: 11, padding: "5px 10px", borderRadius: 5,
                    background: styleCfg.template === id ? "var(--accent)" : "var(--surface2)",
                    border: "1px solid var(--border)",
                    color: styleCfg.template === id ? "#fff" : "var(--text-2)",
                    cursor: "pointer", fontFamily: "DM Sans, sans-serif",
                  }}>{label}</button>
              ))}
            </div>
          </div>
        )}

        {/* header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 10 }}>
            Tailor your resume to any job
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6 }}>
            Paste your resume and job description. We'll rewrite it to match — keywords, bullets, framing.
          </p>
        </div>

        {/* two-col inputs */}
        <div className="ro-input-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
          {/* resume col */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={cardStyle}>
              <div style={cardHeader}>
                <IcoFile size={14} stroke="var(--accent)" />
                <span style={{ fontWeight: 500, fontSize: 13 }}>Your Resume</span>
                <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: "auto" }}>paste text or upload PDF</span>
              </div>
              <textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                placeholder={"Paste your resume here — work experience, education, skills, any relevant sections."}
                style={textareaStyle}
                rows={10}
              />
            </div>
            {/* drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => {
                e.preventDefault(); setDragging(false);
                const f = e.dataTransfer.files?.[0]; if (f) handleFile(f);
              }}
              style={{
                border: `1.5px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 10,
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                transition: "border-color 0.15s",
                background: dragging ? "var(--accent-dim)" : "transparent",
              }}
            >
              <IcoUpload size={16} stroke="var(--text-3)" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>Drag & drop PDF, or click to upload</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>PDF only · max 5 MB</div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.docx"
                style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          </div>

          {/* job col */}
          <div style={cardStyle}>
            <div style={cardHeader}>
              <IcoBriefcase size={14} stroke="var(--accent)" />
              <span style={{ fontWeight: 500, fontSize: 13 }}>Job Description</span>
              <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: "auto" }}>paste or fetch from URL</span>
            </div>
            <textarea
              value={jobText}
              onChange={e => setJobText(e.target.value)}
              placeholder={"Paste the full job description — requirements, responsibilities, qualifications."}
              style={{ ...textareaStyle, height: 220 }}
            />
            <div style={{ padding: "14px 16px 16px", borderTop: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>Or fetch from a posting URL</div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 7, padding: "0 12px" }}>
                  <IcoLink size={13} stroke="var(--text-3)" />
                  <input
                    value={jobUrl}
                    onChange={e => setJobUrl(e.target.value)}
                    placeholder="https://linkedin.com/jobs/..."
                    style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: "var(--text)", padding: "9px 0", fontFamily: "DM Sans, sans-serif" }}
                  />
                </div>
                <button style={fetchBtnStyle}>Fetch</button>
              </div>
            </div>
          </div>
        </div>

        {/* notes */}
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <div style={cardHeader}>
            <IcoEdit size={14} stroke="var(--text-3)" />
            <span style={{ fontWeight: 500, fontSize: 13 }}>Anything specific to add or change?</span>
            <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 6 }}>optional</span>
          </div>
          <div style={{ padding: "0 16px 14px" }}>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={`e.g. "I led a team of 6 but forgot to add it"  ·  "Focus on Python and ML"  ·  "Remove the 2022 gap"`}
              style={{
                width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
                borderRadius: 7, padding: "10px 14px", fontSize: 13, color: "var(--text)",
                outline: "none", fontFamily: "DM Sans, sans-serif",
              }}
            />
          </div>
        </div>

        {/* length + submit */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>Resume Length</div>
            <div style={{ display: "flex", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 4, flexWrap: "wrap", justifyContent: "center" }}>
              {lengths.map(l => (
                <button key={l.id} onClick={() => setLength(l.id)} style={{
                  background: length === l.id ? "var(--accent)" : "transparent",
                  border: "none", borderRadius: 7, padding: "8px 18px",
                  cursor: "pointer", transition: "background 0.15s",
                  color: length === l.id ? "#fff" : "var(--text-2)",
                  fontFamily: "DM Sans, sans-serif",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}>{l.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1, whiteSpace: "nowrap" }}>{l.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => canSubmit && onSubmit()}
            style={{
              background: canSubmit ? "var(--accent)" : "var(--surface2)",
              color: canSubmit ? "#fff" : "var(--text-3)",
              border: "none", borderRadius: 10, padding: "14px 36px",
              fontSize: 15, fontWeight: 500, cursor: canSubmit ? "pointer" : "default",
              display: "flex", alignItems: "center", gap: 10,
              transition: "opacity 0.15s, transform 0.1s",
              letterSpacing: "-0.01em",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            Optimize My Resume
            <IcoArrow size={16} />
          </button>

          <div style={{ display: "flex", gap: 24, fontSize: 12, color: "var(--text-3)", flexWrap: "wrap", justifyContent: "center" }}>
            {["ATS Keyword Analysis", "Smart Bullet Rewrites", "Before/After Scoring", "~20 sec"].map(f => (
              <span key={f} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <IcoCheck size={12} stroke="var(--green)" /> {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── LOADING SCREEN ── */
function LoadingScreen({ progressOverride }: { progressOverride?: number }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const steps = [
    "Extracting your resume...",
    "Analysing job requirements...",
    "Finding keyword gaps...",
    "Rewriting bullet points...",
    "Scoring ATS compatibility...",
    "Finalising your resume...",
  ];

  useEffect(() => {
    if (progressOverride !== undefined) return;
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= 92) return 92; // hold near end until real result lands
        return p + 1.6;
      });
    }, 250);
    return () => clearInterval(id);
  }, [progressOverride]);

  useEffect(() => {
    setStep(Math.min(5, Math.floor(progress / 17)));
  }, [progress]);

  const realProgress = progressOverride !== undefined ? progressOverride : progress;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px - 46px)", gap: 40, padding: "60px 24px" }}>
        <div style={{ position: "relative", width: 96, height: 96 }}>
          <svg width={96} height={96} style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
            <circle cx={48} cy={48} r={42} fill="none" stroke="var(--border)" strokeWidth="2" />
            <circle cx={48} cy={48} r={42} fill="none" stroke="var(--accent)" strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - realProgress / 100)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.25s ease" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 15, fontWeight: 500, color: "var(--text)" }}>
              {Math.round(realProgress)}%
            </span>
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, letterSpacing: "-0.02em" }}>
            {steps[step]}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>Usually takes 15–25 seconds</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {steps.map((s, i) => (
            <div key={i} title={s} style={{
              width: i === step ? 20 : 6, height: 6, borderRadius: 3,
              background: i < step ? "var(--green)" : i === step ? "var(--accent)" : "var(--border)",
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>
    </div>
  );
}

/* ── pie chart (verbatim animation from prototype) ── */
type PieDatum = { name: string; value: number; color: string };
function PieChart({ data, size = 160 }: { data: PieDatum[]; size?: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const duration = 800;
    const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const frame = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setProgress(ease(p));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, []);

  const cx = size / 2, cy = size / 2, r = size / 2 - 30;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let angle = -Math.PI / 2;

  const slices = data.map((d) => {
    const fullSweep = (d.value / total) * 2 * Math.PI;
    const sweep = fullSweep * progress;
    const start = angle;
    angle += fullSweep;
    const mid = start + fullSweep / 2;
    const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(start + sweep), y2 = cy + r * Math.sin(start + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const path = sweep < 0.001 ? "" : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    const innerR = r + 6, outerR = r + 20;
    const lx1 = cx + innerR * Math.cos(mid), ly1 = cy + innerR * Math.sin(mid);
    const lx2 = cx + outerR * Math.cos(mid), ly2 = cy + outerR * Math.sin(mid);
    const right = Math.cos(mid) >= 0;
    const lx3 = lx2 + (right ? 14 : -14), ly3 = ly2;
    const anchor = right ? "start" : "end";
    return { ...d, path, mid, lx1, ly1, lx2, ly2, lx3, ly3, anchor, sweep, fullSweep };
  });

  return (
    <svg width={size + 80} height={size + 20} style={{ display: "block", margin: "0 auto", overflow: "visible" }}>
      <g transform={`translate(40,10)`}>
        {slices.map((s, i) => (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
            {s.path && (
              <path d={s.path} fill={s.color}
                stroke={hovered === i ? "#fff" : "none"} strokeWidth="1.5"
                style={{ transform: hovered === i ? `translate(${Math.cos(s.mid) * 3}px,${Math.sin(s.mid) * 3}px)` : "none", transition: "transform 0.15s" }} />
            )}
            {progress > 0.98 && s.value > 0 && (
              <>
                <polyline points={`${s.lx1},${s.ly1} ${s.lx2},${s.ly2} ${s.lx3},${s.ly3}`}
                  fill="none" stroke={s.color} strokeWidth="1"
                  style={{ opacity: progress, transition: "opacity 0.3s" }} />
                <text x={s.lx3 + (s.anchor === "start" ? 3 : -3)} y={s.ly3}
                  textAnchor={s.anchor as any} dominantBaseline="middle"
                  style={{ fontSize: 9, fontFamily: "DM Sans, sans-serif", fill: "var(--text-2)", fontWeight: 500, opacity: progress, transition: "opacity 0.3s" }}>
                  {s.name}: {s.value}
                </text>
              </>
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ── score ring (verbatim from prototype) ── */
function ScoreRing({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const r = 34, circ = 2 * Math.PI * r;
  const filled = circ * (Math.min(value, max) / max);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: 80, height: 80 }}>
        <svg width={80} height={80} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={40} cy={40} r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
          <circle cx={40} cy={40} r={r} fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${filled} ${circ}`} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <span style={{ fontSize: 18, fontWeight: 600, color, letterSpacing: "-0.03em" }}>{value}</span>
          <span style={{ fontSize: 9, color: "var(--text-3)" }}>/ {max}</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 5 }}>{label}</div>
    </div>
  );
}

/* ── results screen ── */
type Results = {
  tailored: ResumeData;
  original: ResumeData;
  jobData: JobDescription;
  atsBefore: number;
  atsAfter: number;
  scoreBreakdown: { label: string; before: number; after: number; max: number; detail?: string }[];
  keywordsAdded: string[];
  keywordsPresent: string[];
  suggestions: string[];
  pieData: PieDatum[];
  bulletsRewritten: number;
  skillsMatchedPct: number;
  bulletBefore?: string;
  bulletAfter?: string;
};

function ResultsScreen({ results, onReset, styleCfg }: { results: Results; onReset: () => void; styleCfg: StyleConfig }) {
  const [copied, setCopied] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState<{ text: string | null; loading: boolean }>({ text: null, loading: false });
  const [roadmap, setRoadmap] = useState<{ data: any | null; loading: boolean }>({ data: null, loading: false });

  const t = results.tailored;
  const keywordsPct = results.skillsMatchedPct;
  const bulletsPct = results.bulletsRewritten > 0
    ? Math.min(100, Math.round((results.bulletsRewritten / Math.max(results.original.experience.length, 1)) * 100))
    : 20;
  const totalKeywords = results.keywordsAdded.length + results.keywordsPresent.length;
  const skillsAddedPct = totalKeywords > 0
    ? Math.round((results.keywordsAdded.length / Math.max(totalKeywords, 1)) * 100)
    : 33;

  const copy = async () => {
    const text = [
      t.contact.name,
      [t.contact.email, t.contact.phone, t.contact.location].filter(Boolean).join(" · "),
      "",
      t.summary,
      "",
      "Skills: " + (t.skills || []).join(" · "),
      "",
      ...(t.experience || []).flatMap(e => [
        `${e.title} · ${e.company}`,
        `${e.startDate} – ${e.endDate || "Present"}`,
        ...(e.description || []).map(d => `• ${d}`),
        "",
      ]),
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadPdf = async () => {
    try { await downloadResumePDF(t, results.jobData.company || "Company", results.jobData.title || "Position"); }
    catch (e) { console.error("PDF download failed", e); }
  };
  const handleDownloadDocx = async () => {
    try { await downloadResume(t, results.jobData.company || "Company", results.jobData.title || "Position"); }
    catch (e) { console.error("DOCX download failed", e); }
  };

  const handleCoverLetter = async () => {
    setCoverLetter({ text: null, loading: true });
    try {
      const res = await apiClient.generateCoverLetter(JSON.stringify(t), results.jobData.description);
      setCoverLetter({ text: res.coverLetter || "(no cover letter returned)", loading: false });
    } catch (e: any) {
      setCoverLetter({ text: `Failed: ${e?.message || e}`, loading: false });
    }
  };
  const handleRoadmap = async () => {
    setRoadmap({ data: null, loading: true });
    try {
      const res = await apiClient.generateSkillsRoadmap(JSON.stringify(t), results.jobData.description);
      setRoadmap({ data: res, loading: false });
    } catch (e: any) {
      setRoadmap({ data: { error: e?.message || String(e) }, loading: false });
    }
  };

  return (
    <div>
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border-subtle)", padding: "10px 24px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, flexWrap: "wrap" }}>
        <span style={{ color: "var(--green)" }}>✓</span>
        <span style={{ fontWeight: 500 }}>Your optimized resume is ready.</span>
        <span style={{ color: "var(--text-2)" }}>Review the changes below before downloading.</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "var(--green-dim)", border: "1px solid var(--green)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "var(--green)", fontWeight: 500 }}>
            ATS Score {results.atsBefore} → {results.atsAfter} <span style={{ opacity: 0.7 }}>({results.atsAfter - results.atsBefore >= 0 ? "+" : ""}{results.atsAfter - results.atsBefore})</span>
          </div>
          <button onClick={onReset} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 7, padding: "6px 14px", fontSize: 12, color: "var(--text-2)", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
            ← Start over
          </button>
        </div>
      </div>

      <div className="ro-results-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 310px 1fr", gap: 0, height: "calc(100vh - 64px - 46px - 41px)", overflow: "hidden" }}>

        {/* col 1 — resume preview */}
        <div style={{ borderRight: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }}></span>
              <span style={{ fontWeight: 500, fontSize: 13 }}>Optimized Resume</span>
            </div>
            <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 10px", fontSize: 12, color: "var(--text-2)", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
              {copied ? <IcoCheck size={12} stroke="var(--green)" /> : <IcoCopy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column" }}>
            {/* paper */}
            <div style={{
              background: "#fff", color: "#111", borderRadius: 6,
              padding: "36px 32px",
              fontSize: styleCfg.fontSize, lineHeight: 1.65,
              fontFamily: `${styleCfg.fontFamily}, serif`,
              boxShadow: "0 2px 24px rgba(0,0,0,0.3)", flex: 1,
            }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <div style={{ fontSize: styleCfg.fontSize * 1.6, fontWeight: 700, fontFamily: "Arial, sans-serif" }}>{t.contact.name}</div>
                <div style={{ fontSize: styleCfg.fontSize * 0.83, color: "#555", marginTop: 4 }}>
                  {[t.contact.phone, t.contact.email, t.contact.location].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div style={{ borderTop: "1.5px solid #222", marginBottom: 12 }}></div>
              {t.summary && (
                <>
                  <div style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: styleCfg.fontSize * 0.78, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Professional Summary</div>
                  <p style={{ marginBottom: 12, color: "#222" }}>{t.summary}</p>
                </>
              )}
              {(() => {
                const SectionHeader: React.FC<{ children: React.ReactNode; first?: boolean }> = ({ children, first }) => (
                  <div style={{
                    fontFamily: "Arial, sans-serif", fontWeight: 700,
                    fontSize: styleCfg.fontSize * 0.78,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    margin: first ? "0 0 6px" : "12px 0 6px",
                  }}>{children}</div>
                );
                return (
                  <>
                    {t.experience?.length > 0 && (
                      <>
                        <SectionHeader first>Experience</SectionHeader>
                        {t.experience.map((exp, i) => (
                          <div key={i} style={{ marginBottom: 10 }}>
                            <div style={{ fontWeight: 600, fontSize: styleCfg.fontSize * 0.87, marginBottom: 2 }}>{exp.title} · {exp.company}{exp.location ? ` · ${exp.location}` : ""}</div>
                            <div style={{ color: "#666", fontSize: styleCfg.fontSize * 0.78, marginBottom: 5 }}>{exp.startDate} – {exp.endDate || "Present"}</div>
                            <ul style={{ paddingLeft: 16, color: "#222" }}>
                              {(exp.description || []).map((d, j) => <li key={j} style={{ marginBottom: 4 }}>{d}</li>)}
                            </ul>
                          </div>
                        ))}
                      </>
                    )}

                    {t.projects && t.projects.length > 0 && (
                      <>
                        <SectionHeader>Projects</SectionHeader>
                        {t.projects.map((p, i) => (
                          <div key={i} style={{ marginBottom: 10 }}>
                            <div style={{ fontWeight: 600, fontSize: styleCfg.fontSize * 0.87, marginBottom: 2 }}>
                              {p.title}
                              {p.link ? <span style={{ fontWeight: 400, fontSize: styleCfg.fontSize * 0.78, color: "#666" }}> · {p.link}</span> : null}
                            </div>
                            {p.technologies && p.technologies.length > 0 && (
                              <div style={{ color: "#666", fontSize: styleCfg.fontSize * 0.78, marginBottom: 4 }}>{p.technologies.join(" · ")}</div>
                            )}
                            {p.description && (
                              <div style={{ color: "#222", marginBottom: 4 }}>{p.description}</div>
                            )}
                            {p.date && <div style={{ color: "#666", fontSize: styleCfg.fontSize * 0.78 }}>{p.date}</div>}
                          </div>
                        ))}
                      </>
                    )}

                    {t.education?.length > 0 && (
                      <>
                        <SectionHeader>Education</SectionHeader>
                        {t.education.map((ed, i) => (
                          <div key={i} style={{ marginBottom: 6 }}>
                            <div style={{ fontWeight: 600, fontSize: styleCfg.fontSize * 0.87 }}>{ed.degree}{ed.field ? `, ${ed.field}` : ""}</div>
                            <div style={{ color: "#666", fontSize: styleCfg.fontSize * 0.78 }}>{ed.institution} · {ed.graduationDate}</div>
                            {ed.achievements && ed.achievements.length > 0 && (
                              <ul style={{ paddingLeft: 16, color: "#222", marginTop: 3 }}>
                                {ed.achievements.map((a, j) => <li key={j} style={{ marginBottom: 2 }}>{a}</li>)}
                              </ul>
                            )}
                          </div>
                        ))}
                      </>
                    )}

                    {t.skills?.length > 0 && (
                      <>
                        <SectionHeader>Skills</SectionHeader>
                        <p style={{ color: "#222" }}>{t.skills.join(" · ")}</p>
                      </>
                    )}

                    {t.certifications && t.certifications.length > 0 && (
                      <>
                        <SectionHeader>Certifications</SectionHeader>
                        <ul style={{ paddingLeft: 16, color: "#222" }}>
                          {t.certifications.map((c, i) => <li key={i} style={{ marginBottom: 3 }}>{c}</li>)}
                        </ul>
                      </>
                    )}

                    {t.achievements && t.achievements.length > 0 && (
                      <>
                        <SectionHeader>Achievements</SectionHeader>
                        <ul style={{ paddingLeft: 16, color: "#222" }}>
                          {t.achievements.map((a, i) => <li key={i} style={{ marginBottom: 3 }}>{a}</li>)}
                        </ul>
                      </>
                    )}

                    {t.publications && t.publications.length > 0 && (
                      <>
                        <SectionHeader>Publications</SectionHeader>
                        <ul style={{ paddingLeft: 16, color: "#222" }}>
                          {t.publications.map((p, i) => <li key={i} style={{ marginBottom: 3 }}>{p}</li>)}
                        </ul>
                      </>
                    )}

                    {t.hobbies && t.hobbies.length > 0 && (
                      <>
                        <SectionHeader>Hobbies & Interests</SectionHeader>
                        <p style={{ color: "#222" }}>{t.hobbies.join(" · ")}</p>
                      </>
                    )}

                    {t.customSections && Object.keys(t.customSections).length > 0 && (
                      <>
                        {Object.entries(t.customSections).map(([name, body]) => (
                          <React.Fragment key={name}>
                            <SectionHeader>{name}</SectionHeader>
                            <p style={{ color: "#222", whiteSpace: "pre-wrap" }}>{body}</p>
                          </React.Fragment>
                        ))}
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
          {/* download */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 8 }}>
            <button onClick={handleDownloadPdf} style={{ flex: 1, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "DM Sans, sans-serif", letterSpacing: "-0.01em" }}>
              Download PDF
            </button>
            <button onClick={handleDownloadDocx} style={{ flex: 1, background: "var(--surface2)", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
              Download DOCX
            </button>
          </div>
        </div>

        {/* col 2 — ATS Score */}
        <div style={{ overflow: "auto", borderRight: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }}></span>
            <span style={{ fontWeight: 500, fontSize: 13 }}>ATS Score</span>
          </div>

          <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 22, flex: 1, overflow: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <ScoreRing value={results.atsBefore} max={100} color="var(--text-3)" label="Before" />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: results.atsAfter >= results.atsBefore ? "var(--green)" : "var(--red)" }}>
                  {results.atsAfter - results.atsBefore >= 0 ? "+" : ""}{results.atsAfter - results.atsBefore}
                </div>
                <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 2 }}>improved</div>
              </div>
              <ScoreRing value={results.atsAfter} max={100} color="var(--green)" label="After" />
            </div>

            <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.65, background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "10px 12px" }}>
              100-pt ATS rubric: Parsability (20) · Keyword Density (35) · Title Alignment (25) · Experience Match (20). Industry: <strong style={{ color: "var(--accent)" }}>Tech</strong>.
            </div>

            <div>
              <div style={sectionLabel}>Keyword Match Distribution</div>
              <PieChart size={160} data={results.pieData} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", marginTop: 8, justifyContent: "center" }}>
                {results.pieData.map(p => (
                  <span key={p.name} style={{ fontSize: 10, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, display: "inline-block" }}></span>{p.name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div style={sectionLabel}>Section Match Score</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {results.scoreBreakdown.map(({ label, after, max, detail }, i) => {
                  const pct = Math.round((after / max) * 100);
                  const color = colorForSection(label, i);
                  return (
                    <div key={label}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                        <span style={{ color: "var(--text-2)" }}>{label}</span>
                        <span style={{ color: "var(--text-3)", fontFamily: "DM Mono, monospace", fontSize: 11 }}>
                          <span style={{ color }}>{pct}%</span>
                          {detail ? <span style={{ marginLeft: 8, opacity: 0.7 }}>{detail}</span> : null}
                        </span>
                      </div>
                      <div style={{ height: 4, background: "var(--surface2)", borderRadius: 2, overflow: "hidden", position: "relative" }}>
                        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: color, borderRadius: 2, opacity: 0.85 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={sectionLabel}>Tips</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {["Submit as PDF unless the application requests DOCX", "Keep formatting clean — no tables, columns, or text boxes", "Tailor the summary section for each role you apply to"].map(tip => (
                  <div key={tip} style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
                    <IcoCheck size={13} stroke="var(--green)" style={{ flexShrink: 0, marginTop: 1 }} />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* col 3 — what changed */}
        <div style={{ overflow: "auto" }}>
          <div style={{ padding: "14px 22px 12px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }}></span>
            <span style={{ fontWeight: 500, fontSize: 13 }}>What Changed</span>
          </div>

          <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[[`${keywordsPct}%`, "Keywords Matched"], [`${bulletsPct}%`, "Bullets Rewritten"], [`${skillsAddedPct}%`, "Skills Added"]].map(([v, l]) => (
                <div key={l} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "14px 12px" }}>
                  <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--accent)" }}>{v}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>

            {results.keywordsAdded.length > 0 && (
              <div>
                <div style={sectionLabel}>Keywords Added</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {results.keywordsAdded.map(k => (
                    <span key={k} style={{ fontSize: 12, background: "var(--green-dim)", border: "1px solid var(--green)", color: "var(--green)", borderRadius: 5, padding: "4px 10px" }}>+ {k}</span>
                  ))}
                </div>
              </div>
            )}

            {results.keywordsPresent.length > 0 && (
              <div>
                <div style={sectionLabel}>Keywords Already Present</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {results.keywordsPresent.map(k => (
                    <span key={k} style={{ fontSize: 12, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-2)", borderRadius: 5, padding: "4px 10px" }}>✓ {k}</span>
                  ))}
                </div>
              </div>
            )}

            {results.suggestions.length > 0 && (
              <div>
                <div style={sectionLabel}>AI Suggestions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {results.suggestions.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
                      <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }}>→</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.bulletBefore && results.bulletAfter && (
              <div>
                <div style={sectionLabel}>Bullet Rewrite (Sample)</div>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, overflow: "hidden", fontSize: 12 }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--red)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Before</span>
                    <p style={{ marginTop: 6, color: "var(--text-2)", lineHeight: 1.6 }}>{results.bulletBefore}</p>
                  </div>
                  <div style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--green)", letterSpacing: "0.05em", textTransform: "uppercase" }}>After</span>
                    <p style={{ marginTop: 6, color: "var(--text)", lineHeight: 1.6 }}>{results.bulletAfter}</p>
                  </div>
                </div>
              </div>
            )}

            {/* More: Cover Letter + Skills Roadmap */}
            <div>
              <button
                onClick={() => setMoreOpen(o => !o)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", background: "var(--surface)",
                  border: "1px solid var(--border)", borderRadius: 9,
                  color: "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: 500,
                  fontFamily: "DM Sans, sans-serif",
                }}>
                <span>{moreOpen ? "− " : "+ "}More: Cover Letter & Skills Roadmap</span>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>credits apply</span>
              </button>
              {moreOpen && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={cardStyle}>
                    <div style={{ ...cardHeader, justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>Cover Letter</span>
                      <button onClick={handleCoverLetter} disabled={coverLetter.loading}
                        style={{ ...fetchBtnStyle, padding: "6px 12px", fontSize: 12, opacity: coverLetter.loading ? 0.6 : 1 }}>
                        {coverLetter.loading ? "Generating..." : coverLetter.text ? "Regenerate" : "Generate"}
                      </button>
                    </div>
                    {coverLetter.text && (
                      <pre style={{ padding: "12px 16px", margin: 0, fontSize: 12, color: "var(--text-2)", whiteSpace: "pre-wrap", fontFamily: "DM Sans, sans-serif", lineHeight: 1.6 }}>
                        {coverLetter.text}
                      </pre>
                    )}
                  </div>
                  <div style={cardStyle}>
                    <div style={{ ...cardHeader, justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>Skills Learning Roadmap</span>
                      <button onClick={handleRoadmap} disabled={roadmap.loading}
                        style={{ ...fetchBtnStyle, padding: "6px 12px", fontSize: 12, opacity: roadmap.loading ? 0.6 : 1 }}>
                        {roadmap.loading ? "Generating..." : roadmap.data ? "Regenerate" : "Generate"}
                      </button>
                    </div>
                    {roadmap.data && (
                      <div style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
                        {roadmap.data.error ? (
                          <span style={{ color: "var(--red)" }}>{roadmap.data.error}</span>
                        ) : (
                          <>
                            {Array.isArray(roadmap.data.skillGaps) && roadmap.data.skillGaps.length > 0 && (
                              <div style={{ marginBottom: 8 }}>
                                <strong style={{ color: "var(--text)" }}>Skill gaps: </strong>{roadmap.data.skillGaps.join(", ")}
                              </div>
                            )}
                            {Array.isArray(roadmap.data.roadmaps) && roadmap.data.roadmaps.map((r: any, i: number) => (
                              <div key={i} style={{ marginTop: 8, paddingTop: 8, borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none" }}>
                                <div style={{ fontWeight: 600, color: "var(--text)" }}>{r.skill} <span style={{ color: "var(--text-3)", fontWeight: 400 }}>· {r.timeEstimate}</span></div>
                                {r.overview && <div style={{ marginTop: 4 }}>{r.overview}</div>}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── derive pie data from keywords + resume sections ── */
function derivePieData(
  keywordsAdded: string[],
  keywordsPresent: string[],
  master: ResumeData,
  jdSkills: string[],
  apiCategories?: { name: string; value: number }[],
  sectionScoreRows?: Array<{ section: string; score: number; jdKeywordsFound?: number; jdKeywordsTotal?: number }>
): PieDatum[] {
  // prefer per-section data from sectionScores (jdKeywordsFound per section)
  if (sectionScoreRows && sectionScoreRows.length > 0) {
    const slices = sectionScoreRows
      .filter(r => (r.jdKeywordsFound ?? r.score) > 0)
      .map((r, i) => ({
        name: r.section,
        value: r.jdKeywordsFound ?? Math.round(r.score / 10),
        color: colorForSection(r.section, i),
      }));
    if (slices.length > 0) return slices;
  }

  // fallback: backend keyword-distribution categories with SECTION_COLORS
  if (apiCategories && apiCategories.length > 0) {
    return apiCategories.map((c, i) => ({
      ...c,
      color: colorForSection(c.name, i),
    }));
  }

  // last-resort: heuristic bucketing by where keywords appear
  const all = [...keywordsAdded, ...keywordsPresent];
  const skillsLower = master.skills.map(s => s.toLowerCase());
  const expBlob = master.experience.map(e => [e.title, e.company, ...(e.description || [])].join(" ")).join(" ").toLowerCase();
  const projBlob = (master.projects || []).map(p => [p.title, p.description, ...(p.technologies || [])].join(" ")).join(" ").toLowerCase();

  let skillsRel = 0, expRel = 0, projRel = 0, others = 0;
  for (const k of all) {
    const lk = k.toLowerCase();
    if (skillsLower.some(s => s === lk || s.includes(lk) || lk.includes(s))) skillsRel++;
    else if (expBlob.includes(lk)) expRel++;
    else if (projBlob.includes(lk)) projRel++;
    else others++;
  }
  const notRel = Math.max(0, jdSkills.length - all.length);

  return [
    { name: "Skills Relevant",     value: skillsRel, color: colorForSection("Skills Relevant", 0) },
    { name: "Experience Relevant", value: expRel,    color: colorForSection("Experience Relevant", 1) },
    { name: "Projects Relevant",   value: projRel,   color: colorForSection("Projects Relevant", 2) },
    { name: "Others Relevant",     value: others,    color: colorForSection("Others Relevant", 3) },
    { name: "Not Relevant",        value: notRel,    color: colorForSection("Not Relevant", 4) },
  ];
}

/* ── helpers: textarea ↔ ResumeData reconciliation ── */
// Used to detect whether the user's pasted text still matches the structured master
// resume. If so, we skip the extract call. If they edited the text, we re-extract
// via Claude so the tailor prompt always sees real data.
function flattenResumeForCompare(r: ResumeData): string {
  return [
    r.contact?.name,
    [r.contact?.email, r.contact?.phone, r.contact?.location].filter(Boolean).join(" · "),
    "",
    r.summary,
    "",
    "Skills: " + (r.skills || []).join(", "),
    "",
    ...(r.experience || []).flatMap(e => [
      `${e.title} · ${e.company} · ${e.startDate} – ${e.endDate || "Present"}`,
      ...(e.description || []).map(d => `• ${d}`),
      "",
    ]),
  ].join("\n");
}

function normalizeForCompare(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

// Map the /api/extract-resume response shape to our ResumeData type.
// The extract endpoint returns: contact, summary, skills, experience, education,
// projects, certifications. We carry through optional sections (achievements,
// publications, hobbies, customSections) when present in the response.
function mapExtractedToResumeData(ext: any): ResumeData {
  const contact = ext.contact || {};
  return {
    contact: {
      name:     contact.name     || "",
      email:    contact.email    || "",
      phone:    contact.phone    || "",
      location: contact.location || "",
      website:  contact.website  || undefined,
      linkedin: contact.linkedin || undefined,
      github:   contact.github   || undefined,
    } as any,
    summary: ext.summary || "",
    skills: Array.isArray(ext.skills) ? ext.skills : [],
    experience: Array.isArray(ext.experience) ? ext.experience.map((e: any) => ({
      title: e.title || "",
      company: e.company || "",
      location: e.location || "",
      startDate: e.startDate || "",
      endDate: e.endDate || "",
      isCurrentlyWorking: !!e.isCurrentlyWorking,
      description: Array.isArray(e.description) ? e.description : [],
    })) : [],
    education: Array.isArray(ext.education) ? ext.education.map((e: any) => ({
      institution: e.institution || "",
      degree: e.degree || "",
      field: e.field || "",
      graduationDate: e.graduationDate || "",
      gpa: e.gpa || undefined,
      achievements: Array.isArray(e.achievements) ? e.achievements : [],
    })) : [],
    projects: Array.isArray(ext.projects) ? ext.projects.map((p: any) => ({
      title: p.title || "",
      description: p.description || "",
      technologies: Array.isArray(p.technologies) ? p.technologies : [],
      link: p.link || "",
      date: p.date || "",
    })) : [],
    certifications: Array.isArray(ext.certifications) ? ext.certifications : [],
    achievements: Array.isArray(ext.achievements) ? ext.achievements : [],
    publications: Array.isArray(ext.publications) ? ext.publications : [],
    hobbies: Array.isArray(ext.hobbies) ? ext.hobbies : [],
    customSections: (ext.customSections && typeof ext.customSections === "object") ? ext.customSections : {},
  } as ResumeData;
}

/* ── main page ── */
const ResumeOptimizer: React.FC = () => {
  const [screen, setScreen] = useState<Screen>("input");
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [length, setLength] = useState("auto");
  const [styleCfg, setStyleCfg] = useState<StyleConfig>(DEFAULT_STYLE);
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [masterResume, setMasterResume] = useState<ResumeData | null>(null);

  // load master resume on mount, prefill textarea with a flattened text view
  useEffect(() => {
    (async () => {
      try {
        const r = await getMasterResume();
        if (r) {
          setMasterResume(r);
          if (!resumeText) {
            const txt = [
              r.contact?.name,
              [r.contact?.email, r.contact?.phone, r.contact?.location].filter(Boolean).join(" · "),
              "",
              r.summary,
              "",
              "Skills: " + (r.skills || []).join(", "),
              "",
              ...(r.experience || []).flatMap(e => [
                `${e.title} · ${e.company} · ${e.startDate} – ${e.endDate || "Present"}`,
                ...(e.description || []).map(d => `• ${d}`),
                "",
              ]),
            ].join("\n");
            setResumeText(txt);
          }
        }
      } catch { /* not signed in or no resume — ok */ }
    })();
  }, []);

  const handleSubmit = async () => {
    setError(null);

    // Guard: require resume + JD. The textarea is the source of truth — without
    // real content here Claude has nothing to tailor and would hallucinate from the JD.
    const trimmedResume = resumeText.trim();
    if (trimmedResume.length < 100) {
      setError("Please paste your full resume in the resume box first.");
      return;
    }
    if (jobText.trim().length < 50 && jobUrl.trim().length === 0) {
      setError("Please paste a job description (or a job URL) to tailor against.");
      return;
    }

    setScreen("loading");

    try {
      // Resolve a structured ResumeData from what's in the textarea.
      // If a saved master resume exactly matches the textarea content, reuse it
      // (avoids a redundant extract call). Otherwise call the Claude-backed
      // extract endpoint so we always feed the tailor prompt real data — not a
      // stub. This is the root-cause fix for the "Candidate / blank contact /
      // JD-text-as-Education" bug.
      const masterFlat = masterResume ? flattenResumeForCompare(masterResume) : "";
      const useMaster = !!masterResume && normalizeForCompare(masterFlat) === normalizeForCompare(trimmedResume);

      let resumePayload: ResumeData;
      if (useMaster) {
        resumePayload = masterResume!;
      } else {
        const ext = await apiClient.extractResume(trimmedResume);
        if (!ext || (ext as any).error) {
          throw new Error((ext as any)?.message || "Failed to read your resume. Please check the text and try again.");
        }
        resumePayload = mapExtractedToResumeData(ext);
      }

      const fullJobText = (jobText.trim() ? jobText : "") +
        (notes.trim() ? `\n\nAdditional notes from candidate:\n${notes.trim()}` : "") +
        (jobUrl.trim() ? `\n\nSource URL: ${jobUrl.trim()}` : "");

      const resumeStr = JSON.stringify(resumePayload);

      const [tailorResult, parseResult, originalAtsResult, kwDist] = await Promise.allSettled([
        apiClient.tailorResume(resumeStr, fullJobText),
        apiClient.parseJob(fullJobText),
        apiClient.getATSScore(resumeStr, fullJobText),
        // new endpoint — graceful fallback if backend not yet deployed
        (apiClient as any).getKeywordDistribution
          ? (apiClient as any).getKeywordDistribution(resumeStr, fullJobText)
          : Promise.reject("not implemented"),
      ]);

      const tailorVal = tailorResult.status === "fulfilled" ? tailorResult.value : {};
      const parseVal = parseResult.status === "fulfilled" ? parseResult.value : {};
      const atsVal = originalAtsResult.status === "fulfilled" ? originalAtsResult.value : {};
      const kwDistVal = kwDist.status === "fulfilled" ? kwDist.value : null;

      const jobData: JobDescription = {
        title: parseVal.jobTitle || "",
        company: parseVal.company || "",
        location: parseVal.location || "",
        description: parseVal.description || fullJobText.substring(0, 500),
        requirements: Array.isArray(parseVal.responsibilities) ? parseVal.responsibilities : (parseVal.preferredSkills || []),
        skills: parseVal.requiredSkills || [],
      };

      const tailored: ResumeData = {
        ...resumePayload,
        // contact must always come from the user's resume — never let the tailor
        // response (which may omit it) drop the name/email/phone in the preview or PDF.
        contact: (tailorVal.contact && tailorVal.contact.name)
          ? { ...resumePayload.contact, ...tailorVal.contact }
          : resumePayload.contact,
        summary: tailorVal.summary || resumePayload.summary,
        skills: Array.isArray(tailorVal.skills) && tailorVal.skills.length > 0 ? tailorVal.skills : resumePayload.skills,
        experience: (resumePayload.experience || []).map(exp => {
          const tx = (tailorVal.experience || []).find((te: any) =>
            te.title?.toLowerCase() === exp.title?.toLowerCase() &&
            te.company?.toLowerCase() === exp.company?.toLowerCase());
          return { ...exp, description: tx?.description?.length > 0 ? tx.description : exp.description };
        }),
        projects: (resumePayload.projects || []).map(proj => {
          const tx = (tailorVal.projects || []).find((tp: any) => tp.title?.toLowerCase() === proj.title?.toLowerCase());
          return { ...proj, description: tx?.description?.trim() ? tx.description : proj.description };
        }),
        // Pass through every section the user provided — never silently drop
        education: Array.isArray(tailorVal.education) && tailorVal.education.length > 0
          ? tailorVal.education
          : (resumePayload.education || []),
        certifications: Array.isArray(tailorVal.certifications) && tailorVal.certifications.length > 0
          ? tailorVal.certifications
          : (resumePayload.certifications || []),
        achievements: Array.isArray(tailorVal.achievements) && tailorVal.achievements.length > 0
          ? tailorVal.achievements
          : (resumePayload.achievements || []),
        publications: Array.isArray(tailorVal.publications) && tailorVal.publications.length > 0
          ? tailorVal.publications
          : (resumePayload.publications || []),
        hobbies: Array.isArray(tailorVal.hobbies) && tailorVal.hobbies.length > 0
          ? tailorVal.hobbies
          : (resumePayload.hobbies || []),
        customSections: (tailorVal.customSections && Object.keys(tailorVal.customSections).length > 0)
          ? tailorVal.customSections
          : (resumePayload.customSections || {}),
      };

      const jdKeywords: string[] = [
        ...(parseVal.requiredSkills || []),
        ...(parseVal.preferredSkills || []),
      ];
      const origSkillsLower = (resumePayload.skills || []).map(s => s.toLowerCase());
      const keywordsAdded = (tailorVal.keywordsAdded as string[]) ||
        jdKeywords.filter(k => !origSkillsLower.includes(k.toLowerCase()));
      const keywordsPresent = (tailorVal.keywordsPresent as string[]) ||
        jdKeywords.filter(k => origSkillsLower.includes(k.toLowerCase()));

      const atsAfter = tailorVal.estimatedATSScore ?? tailorVal.atsScore ?? 73;
      const atsBefore = atsVal.atsScore ?? tailorVal.originalAtsScore ?? Math.max(0, atsAfter - 16);

      // Per-section score breakdown — one bar per section the user actually has.
      // Source of truth: tailorVal.sectionScores (from Claude). Fallback: heuristic
      // computed locally from keywordsPresent/keywordsAdded vs each section's text blob.
      const apiSectionScores: Array<{ section: string; score: number; jdKeywordsFound?: number; jdKeywordsTotal?: number }> =
        Array.isArray(tailorVal.sectionScores) ? tailorVal.sectionScores : [];

      const buildHeuristicSectionScores = () => {
        const allMatched = [...keywordsPresent, ...keywordsAdded].map(k => k.toLowerCase());
        const total = Math.max(jdKeywords.length, allMatched.length, 1);
        const blobOf = (parts: string[]) => parts.join(" ").toLowerCase();
        const matchPct = (blob: string) => {
          if (!blob) return 0;
          const hits = allMatched.filter(k => k && blob.includes(k)).length;
          return Math.round((hits / total) * 100);
        };
        const rows: Array<{ section: string; score: number; detail?: string }> = [];
        if (resumePayload.skills?.length) rows.push({ section: "Skills", score: matchPct(blobOf(resumePayload.skills)) });
        if (resumePayload.experience?.length) {
          const blob = blobOf(resumePayload.experience.flatMap((e: any) => [e.title, e.company, ...(e.description || [])]));
          rows.push({ section: "Experience", score: matchPct(blob) });
        }
        if (resumePayload.projects?.length) {
          const blob = blobOf(resumePayload.projects.flatMap((p: any) => [p.title, p.description, ...(p.technologies || [])]));
          rows.push({ section: "Projects", score: matchPct(blob) });
        }
        if (resumePayload.education?.length) {
          const blob = blobOf(resumePayload.education.flatMap((e: any) => [e.degree, e.field, e.institution]));
          rows.push({ section: "Education", score: matchPct(blob) });
        }
        if (resumePayload.certifications?.length) rows.push({ section: "Certifications", score: matchPct(blobOf(resumePayload.certifications)) });
        if (resumePayload.achievements?.length) rows.push({ section: "Achievements", score: matchPct(blobOf(resumePayload.achievements)) });
        if (resumePayload.publications?.length) rows.push({ section: "Publications", score: matchPct(blobOf(resumePayload.publications)) });
        if (resumePayload.hobbies?.length) rows.push({ section: "Hobbies", score: matchPct(blobOf(resumePayload.hobbies)) });
        for (const [name, body] of Object.entries(resumePayload.customSections || {})) {
          rows.push({ section: name, score: matchPct(String(body || "").toLowerCase()) });
        }
        return rows;
      };

      const sectionRows = apiSectionScores.length > 0
        ? apiSectionScores.map(s => ({
            section: s.section,
            score: Math.max(0, Math.min(100, s.score | 0)),
            detail: (s.jdKeywordsFound != null && s.jdKeywordsTotal != null)
              ? `${s.jdKeywordsFound}/${s.jdKeywordsTotal} JD keywords`
              : undefined,
          }))
        : buildHeuristicSectionScores();

      const scoreBreakdown = sectionRows.map(r => ({
        label: r.section,
        before: 0,
        after: r.score,
        max: 100,
        detail: (r as any).detail,
      }));

      const suggestions: string[] = (tailorVal.optimizationNotes as string[])
        || ((atsVal.improvements || []).map((it: any) => it.suggestion || it.issue).filter(Boolean))
        || [];

      const bulletsRewritten = (resumePayload.experience || []).filter(exp => {
        const te = (tailored.experience || []).find(t => t.title?.toLowerCase() === exp.title?.toLowerCase());
        return te && te.description.some((b: string, i: number) => b !== exp.description[i]);
      }).length;

      // sample bullet rewrite
      let bulletBefore: string | undefined, bulletAfter: string | undefined;
      for (const exp of resumePayload.experience || []) {
        const te = (tailored.experience || []).find(t => t.title?.toLowerCase() === exp.title?.toLowerCase());
        if (te) {
          const idx = (exp.description || []).findIndex((b, i) => b !== te.description[i]);
          if (idx >= 0) { bulletBefore = exp.description[idx]; bulletAfter = te.description[idx]; break; }
        }
      }

      const matchedSet = new Set([...keywordsPresent, ...keywordsAdded].map(k => k.toLowerCase()));
      const skillsMatchedPct = jdKeywords.length > 0
        ? Math.min(100, Math.round((matchedSet.size / jdKeywords.length) * 100))
        : 47;

      const pieData = derivePieData(
        keywordsAdded, keywordsPresent, resumePayload, jdKeywords,
        kwDistVal?.categories,
        apiSectionScores.length > 0 ? apiSectionScores : undefined
      );

      setResults({
        tailored, original: resumePayload, jobData,
        atsBefore, atsAfter, scoreBreakdown,
        keywordsAdded: keywordsAdded.slice(0, 8),
        keywordsPresent: keywordsPresent.slice(0, 8),
        suggestions: suggestions.slice(0, 5),
        pieData, bulletsRewritten, skillsMatchedPct,
        bulletBefore, bulletAfter,
      });

      setScreen("results");
    } catch (e: any) {
      setError(e?.message || String(e));
      setScreen("input");
    }
  };

  return (
    <div className="resume-optimizer -mx-4 -my-6 md:-mx-6 md:-my-8" style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)", color: "var(--text)" }}>
      <style>{`
        .resume-optimizer {
          --bg: oklch(0.13 0.018 255);
          --surface: oklch(0.17 0.018 255);
          --surface2: oklch(0.20 0.016 255);
          --border: oklch(0.28 0.018 255);
          --border-subtle: oklch(0.22 0.015 255);
          --text: oklch(0.92 0.01 255);
          --text-2: oklch(0.62 0.015 255);
          --text-3: oklch(0.42 0.015 255);
          --accent: oklch(0.62 0.22 270);
          --accent-dim: oklch(0.62 0.22 270 / 0.15);
          --green: oklch(0.72 0.18 150);
          --green-dim: oklch(0.72 0.18 150 / 0.12);
          --amber: oklch(0.78 0.17 75);
          --red: oklch(0.65 0.2 25);
          font-family: 'DM Sans', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .resume-optimizer *, .resume-optimizer *::before, .resume-optimizer *::after {
          box-sizing: border-box;
        }
        .resume-optimizer ::-webkit-scrollbar { width: 4px; height: 4px; }
        .resume-optimizer ::-webkit-scrollbar-track { background: transparent; }
        .resume-optimizer ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
        .resume-optimizer textarea, .resume-optimizer input, .resume-optimizer button, .resume-optimizer select {
          font-family: 'DM Sans', sans-serif;
        }
        @media (max-width: 900px) {
          .resume-optimizer .ro-input-grid { grid-template-columns: 1fr !important; }
          .resume-optimizer .ro-results-grid {
            grid-template-columns: 1fr !important;
            height: auto !important;
            overflow: visible !important;
          }
          .resume-optimizer .ro-results-grid > div { border-right: none !important; border-bottom: 1px solid var(--border-subtle); }
        }
      `}</style>

      <StepTabs
        current={screen}
        hasResults={!!results}
        onJump={(s) => {
          if (s === "input") setScreen("input");
          else if (s === "results" && results) setScreen("results");
          // "loading" is not user-jumpable; only the in-flight optimization can land there
        }}
      />

      {error && (
        <div style={{ padding: "10px 24px", background: "var(--surface)", borderBottom: "1px solid var(--red)", color: "var(--red)", fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      {screen === "input" && (
        <InputScreen
          onSubmit={handleSubmit}
          resumeText={resumeText} setResumeText={setResumeText}
          jobText={jobText} setJobText={setJobText}
          jobUrl={jobUrl} setJobUrl={setJobUrl}
          notes={notes} setNotes={setNotes}
          length={length} setLength={setLength}
          styleCfg={styleCfg} setStyleCfg={setStyleCfg}
          busy={false}
        />
      )}
      {screen === "loading" && <LoadingScreen />}
      {screen === "results" && results && (
        <ResultsScreen results={results} styleCfg={styleCfg} onReset={() => { setScreen("input"); setResults(null); }} />
      )}
    </div>
  );
};

export default ResumeOptimizer;
export { ResumeOptimizer };

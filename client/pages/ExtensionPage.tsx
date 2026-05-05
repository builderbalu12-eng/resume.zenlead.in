import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppConfig } from "@/contexts/AppConfigContext";
import { User as UserIcon, CreditCard, Receipt, LogOut, Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";

/* ─── Navbar (reused from landing page style) ──────────────────────── */
const ExtNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = ((user?.firstName?.slice(0, 1) ?? "") + (user?.lastName?.slice(0, 1) ?? "")).toUpperCase() || "?";
  const navLinks = [{ label: "Features", href: "/#features" }, { label: "Pricing", href: "/pricing" }, { label: "Dashboard", href: "/" }];

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      padding: isMobile ? "14px 20px" : "16px 64px",
      background: scrolled || menuOpen ? "rgba(7,9,15,0.97)" : "transparent",
      backdropFilter: scrolled || menuOpen ? "blur(20px)" : "none",
      borderBottom: scrolled || menuOpen ? "1px solid rgba(255,255,255,0.07)" : "none",
      transition: "all 0.3s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/logo/lo9o.png" alt="LandYourJob" style={{ width: 34, height: 34, borderRadius: 9, objectFit: "contain" }} />
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 19, color: "white", letterSpacing: "-0.02em" }}>LandYourJob</span>
        </a>

        {!isMobile && (
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {navLinks.map(item => (
              <a key={item.label} href={item.href} style={{ color: "#94a3b8", textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "white")}
                onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}>{item.label}</a>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {isAuthenticated && user ? (
            <div ref={dropRef} style={{ position: "relative" }}>
              <button onClick={() => setDropOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: isMobile ? 0 : 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: isMobile ? "7px 8px" : "7px 14px 7px 8px", cursor: "pointer" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#9333ea)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white" }}>{initials}</div>
                {!isMobile && (
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "white", lineHeight: 1.2 }}>{user.firstName}</div>
                    <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.2 }}>{user.email}</div>
                  </div>
                )}
              </button>
              {dropOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 200, background: "#0d1220", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", overflow: "hidden", zIndex: 9999 }}>
                  {[
                    { icon: <UserIcon size={14} />, label: "Profile", path: "/profile" },
                    { icon: <CreditCard size={14} />, label: "Billing", path: "/billing" },
                    { icon: <Receipt size={14} />, label: "Credit Activity", path: "/billing#credits" },
                  ].map((item, i) => (
                    <button key={i} onClick={() => { navigate(item.path); setDropOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", background: "transparent", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif", textAlign: "left" }}>
                      <span style={{ color: "#64748b" }}>{item.icon}</span>{item.label}
                    </button>
                  ))}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    <button onClick={() => { logout(); navigate("/login"); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", background: "transparent", border: "none", color: "#f87171", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                      <LogOut size={14} /> Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {!isMobile && <a href="/login" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Sign in</a>}
              {!isMobile && <a href="/register" style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "white", padding: "10px 22px", borderRadius: 9, fontSize: 14, fontWeight: 600, textDecoration: "none", display: "inline-block" }}>Get Started Free</a>}
            </>
          )}
          {isMobile && (
            <button onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4 }}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>

      {isMobile && menuOpen && (
        <div style={{ paddingTop: 16, paddingBottom: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          {navLinks.map(item => (
            <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)} style={{ color: "#94a3b8", textDecoration: "none", fontSize: 15, fontWeight: 500, padding: "10px 4px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{item.label}</a>
          ))}
          {!isAuthenticated && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 12 }}>
              <a href="/login" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 15, fontWeight: 500, textAlign: "center", padding: "10px" }}>Sign in</a>
              <a href="/register" style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "white", padding: "12px", borderRadius: 9, fontSize: 15, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>Get Started Free</a>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

/* ─── Animated Extension Popup Mockup ──────────────────────────────── */
const PopupMockup: React.FC<{ phase: number }> = ({ phase }) => {
  const score = phase === 0 ? 42 : phase === 1 ? 68 : 91;
  const scoreColor = phase === 0 ? "#ef4444" : phase === 1 ? "#f59e0b" : "#10b981";

  const matched = ["React", "Node.js", "TypeScript", "REST API", "Git"];
  const missing = phase === 0
    ? ["Agile", "CI/CD", "AWS", "Docker", "GraphQL"]
    : phase === 1
    ? ["CI/CD", "Docker", "GraphQL"]
    : ["Docker"];

  return (
    <div style={{ width: 340, background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.7)", fontFamily: "Inter, sans-serif", flexShrink: 0 }}>
      {/* Header */}
      <div style={{ padding: "12px 14px", background: "rgba(124,58,237,0.12)", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo/lo9o.png" alt="" style={{ width: 26, height: 26, borderRadius: 7, objectFit: "contain" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>LandYourJob</span>
        </div>
        <span style={{ fontSize: 10, background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 4, padding: "2px 7px", fontWeight: 700 }}>LIVE</span>
      </div>

      {/* Job Detected */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Detected Job</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>Senior Full Stack Engineer</div>
        <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Google · Bangalore, India · Full-time</div>
      </div>

      {/* ATS Score */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>ATS Match Score</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: scoreColor, transition: "color 0.5s" }}>{score}%</span>
        </div>
        <div style={{ height: 7, borderRadius: 4, background: "rgba(255,255,255,0.07)" }}>
          <div style={{ height: "100%", width: `${score}%`, borderRadius: 4, background: phase === 2 ? "linear-gradient(90deg,#7c3aed,#10b981)" : scoreColor, transition: "width 0.8s ease, background 0.5s" }} />
        </div>
        <div style={{ fontSize: 11, color: "#334155", marginTop: 6 }}>
          {phase === 0 ? "Low match — needs significant improvement" : phase === 1 ? "Improving — tailoring in progress…" : "Excellent match — ready to apply!"}
        </div>
      </div>

      {/* Keywords */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>Matched Keywords</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
          {matched.map(k => (
            <span key={k} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399", fontWeight: 500 }}>{k}</span>
          ))}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>Missing Keywords</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {missing.map(k => (
            <span key={k} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontWeight: 500 }}>{k}</span>
          ))}
          {missing.length === 0 && <span style={{ fontSize: 11, color: "#34d399" }}>All keywords covered ✓</span>}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "12px 14px", display: "flex", gap: 8 }}>
        <button style={{ flex: 1, padding: "10px", borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
          ⚡ Tailor Resume
        </button>
        <button style={{ flex: 1, padding: "10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
          Download PDF
        </button>
      </div>
    </div>
  );
};

/* ─── How It Works Step ─────────────────────────────────────────────── */
const HowStep: React.FC<{ num: string; icon: string; title: string; desc: string; accent: string; isMobile?: boolean }> = ({ num, icon, title, desc, accent, isMobile }) => (
  <div style={{ flex: 1, minWidth: isMobile ? 0 : 240, padding: isMobile ? "24px 20px" : "36px 32px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, background: "rgba(255,255,255,0.02)", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: accent, filter: "blur(40px)", opacity: 0.3 }} />
    <div style={{ fontSize: 11, fontWeight: 700, color: accent.includes("7c3aed") ? "#a78bfa" : accent.includes("06b6d4") ? "#38bdf8" : "#34d399", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Step {num}</div>
    <div style={{ fontSize: 36, marginBottom: 14 }}>{icon}</div>
    <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 20, fontWeight: 700, color: "white", marginBottom: 10, lineHeight: 1.2 }}>{title}</div>
    <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.8 }}>{desc}</div>
  </div>
);

/* ─── Feature Section ───────────────────────────────────────────────── */
const FeatureBlock: React.FC<{
  tag: string; tagColor: string; title: string; body: string;
  visual: React.ReactNode; reverse?: boolean; isMobile?: boolean;
}> = ({ tag, tagColor, title, body, visual, reverse, isMobile }) => (
  <div style={{ display: "flex", gap: isMobile ? 32 : 80, alignItems: "center", flexDirection: isMobile ? "column" : (reverse ? "row-reverse" : "row"), maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 16px" : "0 80px" }}>
    <div style={{ flex: 1, width: "100%" }}>
      <div style={{ display: "inline-block", fontSize: 12, fontWeight: 700, color: tagColor, background: `${tagColor}18`, border: `1px solid ${tagColor}30`, borderRadius: 6, padding: "4px 12px", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.07em" }}>{tag}</div>
      <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: isMobile ? 26 : 34, fontWeight: 800, color: "white", lineHeight: 1.15, letterSpacing: "-0.025em", marginBottom: 20 }}>{title}</h3>
      <p style={{ fontSize: isMobile ? 14 : 16, color: "#64748b", lineHeight: 1.9 }}>{body}</p>
    </div>
    <div style={{ flex: isMobile ? "none" : 1, display: "flex", justifyContent: "center", width: isMobile ? "100%" : undefined }}>{visual}</div>
  </div>
);

/* ─── Small score card visual ───────────────────────────────────────── */
const ScoreCard: React.FC = () => (
  <div style={{ width: 300, background: "#0d1220", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 16, padding: 24, fontFamily: "Inter, sans-serif" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>ATS Match Score</span>
      <span style={{ fontSize: 11, background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 20, padding: "2px 8px", fontWeight: 700 }}>LIVE</span>
    </div>
    {[{ label: "Before", score: 42, color: "#ef4444", w: "42%" }, { label: "After", score: 91, color: "#10b981", w: "91%" }].map(item => (
      <div key={item.label} style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "#475569" }}>{item.label}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: item.color }}>{item.score}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
          <div style={{ height: "100%", width: item.w, borderRadius: 4, background: item.label === "After" ? "linear-gradient(90deg,#7c3aed,#10b981)" : item.color }} />
        </div>
      </div>
    ))}
    <div style={{ marginTop: 8, padding: "10px 14px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 10, fontSize: 13, color: "#34d399", fontWeight: 600 }}>
      +49 point improvement in seconds ✓
    </div>
  </div>
);

const KeywordCard: React.FC = () => (
  <div style={{ width: 300, background: "#0d1220", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 16, padding: 22, fontFamily: "Inter, sans-serif" }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Keyword Analysis</div>
    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>✓ Matched (5)</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
      {["React", "TypeScript", "Node.js", "REST API", "Git"].map(k => (
        <span key={k} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}>{k}</span>
      ))}
    </div>
    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>✗ Missing (3)</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {["Docker", "CI/CD", "AWS"].map(k => (
        <span key={k} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>{k}</span>
      ))}
    </div>
    <div style={{ marginTop: 16, fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
      AI suggests adding these to your skills and experience sections for an immediate score boost.
    </div>
  </div>
);

const DownloadCard: React.FC = () => (
  <div style={{ width: 300, background: "#0d1220", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 16, padding: 22, fontFamily: "Inter, sans-serif" }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 6 }}>Tailored Resume Ready</div>
    <div style={{ fontSize: 12, color: "#475569", marginBottom: 20 }}>Optimized for Senior Full Stack Engineer @ Google</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[{ fmt: "PDF", icon: "📄", color: "#a78bfa", bg: "rgba(124,58,237,0.12)" }, { fmt: "DOCX", icon: "📝", color: "#38bdf8", bg: "rgba(6,182,212,0.1)" }].map(item => (
        <div key={item.fmt} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 10, background: item.bg, border: `1px solid ${item.color}30` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>Download {item.fmt}</div>
              <div style={{ fontSize: 11, color: "#475569" }}>ATS-ready · 91% match</div>
            </div>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: item.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "white" }}>↓</div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, fontSize: 12, color: "#334155", textAlign: "center" as const }}>
      Download in under 5 seconds
    </div>
  </div>
);

/* ─── Main ExtensionPage ────────────────────────────────────────────── */
const ExtensionPage: React.FC = () => {
  const { app_name: appName } = useAppConfig();
  const name = appName ?? "LandYourJob";
  const isMobile = useIsMobile();

  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase(p => (p + 1) % 3), 2800);
    return () => clearInterval(t);
  }, []);

  const boards = ["LinkedIn", "Indeed", "Naukri", "Glassdoor", "Unstop", "Internshala", "Wellfound", "Workday"];

  return (
    <div style={{ background: "#07090f", minHeight: "100vh", color: "white", fontFamily: "Inter, sans-serif", overflowX: "hidden" }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse-glow { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        @keyframes slide-in { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <ExtNavbar />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section style={{ paddingTop: isMobile ? 100 : 140, paddingBottom: isMobile ? 60 : 100, textAlign: "center", position: "relative", overflow: "hidden", padding: isMobile ? "100px 20px 60px" : "140px 80px 100px" }}>
        <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 100, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(124,58,237,0.08)", padding: "6px 16px", marginBottom: 28 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#a78bfa", display: "inline-block", animation: "pulse-glow 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#a78bfa" }}>Chrome Extension · Free to Install</span>
        </div>

        <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: isMobile ? 36 : 64, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", maxWidth: 800, margin: "0 auto 24px", color: "white" }}>
          Your resume,{" "}
          <span style={{ background: "linear-gradient(135deg,#a78bfa,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            tailored instantly
          </span>
          <br />on every job site
        </h1>

        <p style={{ fontSize: isMobile ? 15 : 19, color: "#64748b", maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Install once. Browse any job board. The extension lives in your browser sidebar, analyzes every job post in real time, and rewrites your resume to match — all without leaving the page.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: isMobile ? 48 : 80, flexDirection: isMobile ? "column" : "row", alignItems: "center", padding: isMobile ? "0 8px" : 0 }}>
          <a href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "white", padding: isMobile ? "14px 28px" : "16px 36px", borderRadius: 12, fontSize: isMobile ? 15 : 16, fontWeight: 700, textDecoration: "none", boxShadow: "0 0 40px rgba(124,58,237,0.4)", width: isMobile ? "100%" : undefined, justifyContent: "center" }}>
            ⚡ Install Free Extension
          </a>
          <a href="#how-it-works" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: isMobile ? "14px 28px" : "16px 32px", borderRadius: 12, fontSize: isMobile ? 15 : 16, fontWeight: 600, textDecoration: "none", width: isMobile ? "100%" : undefined, justifyContent: "center" }}>
            See how it works →
          </a>
        </div>

        {/* Animated popup mockup — hidden on very small screens to avoid overflow */}
        {!isMobile && (
          <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
            <div style={{ animation: "float 4s ease-in-out infinite" }}>
              <PopupMockup phase={phase} />
            </div>
            <div style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", width: 400, height: 60, background: "radial-gradient(ellipse,rgba(124,58,237,0.25) 0%,transparent 70%)", filter: "blur(20px)" }} />
          </div>
        )}
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
            <PopupMockup phase={phase} />
          </div>
        )}

        <div style={{ marginTop: 24, fontSize: 13, color: "#334155" }}>
          ↑ Watch the ATS score update live as your resume gets tailored
        </div>
      </section>

      {/* ── WORKS WITH ──────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "28px 16px" : "40px 80px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: isMobile ? 8 : 32, flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ fontSize: 13, color: "#334155", fontWeight: 600, whiteSpace: "nowrap" }}>Works on</span>
          {boards.map(b => (
            <span key={b} style={{ fontSize: isMobile ? 12 : 14, color: "#475569", fontWeight: 600, padding: isMobile ? "4px 10px" : "6px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>{b}</span>
          ))}
          <span style={{ fontSize: 13, color: "#334155" }}>& 40+ more</span>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: isMobile ? "60px 16px" : "100px 80px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 64 }}>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: isMobile ? 30 : 44, fontWeight: 800, letterSpacing: "-0.025em", color: "white", marginBottom: 16 }}>Three steps to a perfect application</h2>
            <p style={{ fontSize: isMobile ? 14 : 17, color: "#64748b", maxWidth: 500, margin: "0 auto" }}>From install to interview-ready resume in under a minute.</p>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
            <HowStep num="01" icon="🔌" title="Install & Connect" accent="rgba(124,58,237,1)" isMobile={isMobile}
              desc="Add the extension to Chrome in one click. Sign into your LandYourJob account to sync your master resume. Setup takes under 60 seconds — no configuration needed." />
            <HowStep num="02" icon="🔍" title="Browse Any Job Post" accent="rgba(6,182,212,1)" isMobile={isMobile}
              desc="Visit any job listing on LinkedIn, Indeed, Naukri, Glassdoor, or any other supported platform. The extension sidebar opens automatically and reads the job description in real time." />
            <HowStep num="03" icon="⚡" title="Tailor & Apply" accent="rgba(16,185,129,1)" isMobile={isMobile}
              desc="See your live ATS score, review missing keywords, and hit 'Tailor Resume' for an AI-rewritten version optimized for that specific role. Download as PDF or DOCX and apply immediately." />
          </div>
        </div>
      </section>

      {/* ── FEATURE: ATS SCORING ────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "48px 0" : "80px 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <FeatureBlock
          tag="ATS Score Analysis"
          tagColor="#a78bfa"
          title={`See your exact match score before you apply`}
          body={`Most resumes get rejected by Applicant Tracking Systems before a human ever reads them. The ${name} extension solves this at the source. The moment you open a job post, it reads the full job description and compares every keyword, skill, and qualification against your master resume — producing a live match score between 0 and 100. A score under 60 typically means your application will be filtered out automatically. The extension shows you exactly where you stand, so you're never applying blind. The score updates in real time as you tailor your resume, giving you instant feedback on every improvement.`}
          visual={<ScoreCard />}
          isMobile={isMobile}
        />
      </section>

      {/* ── FEATURE: KEYWORD GAP ────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "48px 0" : "80px 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <FeatureBlock
          tag="Keyword Gap Analysis"
          tagColor="#38bdf8"
          title="Know exactly which keywords you're missing"
          body={`ATS systems work by scanning for specific terms from the job description — if those words aren't in your resume, you're out. The ${name} extension breaks this down visually: green chips for keywords already present in your resume, red chips for the critical terms that are absent. These aren't generic suggestions — they're pulled directly from the job post you're looking at right now. The AI also understands context, so it differentiates between a skill you have but haven't mentioned explicitly, versus a qualification you'd need to learn. Each missing keyword comes with a specific suggestion for where and how to add it naturally to your resume.`}
          visual={<KeywordCard />}
          reverse
          isMobile={isMobile}
        />
      </section>

      {/* ── FEATURE: TAILORING ──────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "48px 0" : "80px 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <FeatureBlock
          tag="One-Click Tailoring"
          tagColor="#34d399"
          title="Your resume, rewritten for this exact job"
          body={`Hitting 'Tailor Resume' doesn't just swap in keywords — it rewrites your bullet points, reorders your experience sections, and restructures your skills to best match the specific requirements of the role you're applying for. The AI preserves all your real accomplishments and facts while adapting the language, emphasis, and structure to speak directly to what this particular employer is looking for. The result is a resume that reads like it was written specifically for that job. Average users go from a 42% match score to above 85% with a single click — a difference that translates directly into more callbacks and interviews.`}
          visual={
            <div style={{ width: isMobile ? "100%" : 300, background: "#0d1220", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 16, padding: 22, fontFamily: "Inter, sans-serif" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Tailoring Complete</div>
              {[
                { section: "Summary", change: "Emphasized full-stack architecture experience" },
                { section: "Skills", change: "Added Docker, CI/CD, AWS to tech stack" },
                { section: "Experience", change: "Reframed 3 bullet points with Agile terminology" },
                { section: "Projects", change: "Moved cloud deployment project to top" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12, padding: "10px 12px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)", borderRadius: 9 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>✓</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{item.section}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{item.change}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 4, padding: "8px 12px", background: "rgba(124,58,237,0.1)", borderRadius: 8, fontSize: 12, color: "#a78bfa", fontWeight: 600, textAlign: "center" as const }}>Score: 42% → 91% ↑</div>
            </div>
          }
          isMobile={isMobile}
        />
      </section>

      {/* ── FEATURE: DOWNLOAD ───────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "48px 0" : "80px 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <FeatureBlock
          tag="Instant Download"
          tagColor="#f59e0b"
          title="Download your tailored resume in seconds"
          body={`Once your resume is tailored, downloading it is instantaneous. The extension generates a perfectly formatted PDF or editable DOCX file from within the browser — no switching tabs, no copy-pasting, no reformatting. Both formats are fully ATS-compatible: clean structure, proper headings, no tables or graphics that confuse parsing systems. The PDF version is ready to attach and submit immediately. The DOCX version lets you make any last manual tweaks before applying. Each downloaded resume is named and versioned automatically, so you always know which tailored version was created for which job. Your application history is saved in your LandYourJob dashboard for easy reference.`}
          visual={<DownloadCard />}
          reverse
          isMobile={isMobile}
        />
      </section>

      {/* ── STATS ───────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "48px 16px" : "80px 80px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 0, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
          {[
            { num: "10,000+", label: "Active users", color: "#a78bfa" },
            { num: "91%", label: "Avg ATS score after tailoring", color: "#38bdf8" },
            { num: "3×", label: "More interview callbacks", color: "#34d399" },
            { num: "Free", label: "Core extension features", color: "#f59e0b" },
          ].map((s, i) => (
            <div key={i} style={{ padding: isMobile ? "28px 16px" : "40px 32px", borderRight: isMobile ? (i % 2 === 0 ? "1px solid rgba(255,255,255,0.05)" : "none") : (i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none"), borderBottom: isMobile && i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none", textAlign: "center" as const }}>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: isMobile ? 28 : 40, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 8 }}>{s.num}</div>
              <div style={{ fontSize: isMobile ? 12 : 14, color: "#334155", lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIAL ─────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "40px 16px 60px" : "60px 80px 80px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 16 }}>
            {[
              { name: "Sneha R.", role: "Software Engineer", text: "I installed it on a Friday, spent the weekend applying to 12 jobs with tailored resumes, and had 4 interview requests by Monday. The ATS score jumping from 38% to 87% on my first try was unreal.", avatar: "S" },
              { name: "Karan M.", role: "Data Analyst", text: "The keyword gap feature alone is worth it. I had no idea I was missing 'SQL Server' and 'Power BI' from my resume even though I use them daily. Added them, score went from 55% to 88% instantly.", avatar: "K" },
            ].map((t, i) => (
              <div key={i} style={{ padding: isMobile ? "24px 20px" : "32px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, background: "rgba(255,255,255,0.02)" }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ color: "#f59e0b", fontSize: 14 }}>★</span>)}</div>
                <p style={{ fontSize: isMobile ? 14 : 15, color: "#94a3b8", lineHeight: 1.8, marginBottom: 20 }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: ["rgba(124,58,237,0.25)", "rgba(6,182,212,0.25)"][i], border: `1px solid ${["rgba(124,58,237,0.4)", "rgba(6,182,212,0.4)"][i]}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white" }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#334155" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "60px 20px" : "100px 80px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 12, color: "#334155", marginBottom: 18, textTransform: "uppercase", letterSpacing: "0.08em" }}>Get started today</div>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: isMobile ? 30 : 44, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 20, color: "white" }}>
            Stop guessing.<br />Start landing interviews.
          </h2>
          <p style={{ fontSize: isMobile ? 14 : 16, color: "#334155", marginBottom: 40, lineHeight: 1.7 }}>
            The {name} Chrome extension is free to install. Add it to your browser in 10 seconds and start with your very next job application.
          </p>
          <a href="/register" style={{ background: "white", color: "#07090f", padding: isMobile ? "16px 40px" : "20px 60px", borderRadius: 14, fontSize: isMobile ? 15 : 16, fontWeight: 700, textDecoration: "none", display: "inline-block" }}>
            Install Free Extension →
          </a>
          <div style={{ marginTop: 24, fontSize: 13, color: "#1e293b" }}>Free forever · No credit card · Works on Chrome</div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer style={{ background: "#040608", borderTop: "1px solid rgba(255,255,255,0.06)", padding: isMobile ? "28px 20px" : "40px 80px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 16 : 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/logo/lo9o.png" alt="LandYourJob" style={{ width: 28, height: 28, borderRadius: 7, objectFit: "contain" }} />
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, color: "white" }}>{name}</span>
          </div>
          <div style={{ display: "flex", gap: isMobile ? 16 : 24, flexWrap: "wrap" }}>
            {[{ label: "Home", href: "/" }, { label: "Pricing", href: "/pricing" }, { label: "Privacy", href: "/privacy-policy" }, { label: "Terms", href: "/terms" }, { label: "Contact", href: "/contact" }].map(l => (
              <a key={l.label} href={l.href} style={{ fontSize: 14, color: "#334155", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#94a3b8")}
                onMouseLeave={e => (e.currentTarget.style.color = "#334155")}>{l.label}</a>
            ))}
          </div>
          <span style={{ fontSize: 13, color: "#1e293b" }}>© 2026 {name}. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default ExtensionPage;

import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, User as UserIcon, CreditCard, Receipt, LogOut, Menu, X } from "lucide-react";
import { ResumeData } from "@/types";
import { getMasterResume } from "@/utils/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useAppConfig } from "@/contexts/AppConfigContext";
import { FloatingChatButton } from "@/components/chat/FloatingChatButton";
import { apiClient } from "@/services/api";
import { useIsMobile } from "@/hooks/useIsMobile";

interface PipelineCounts {
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
}

/* ─── V3 Shared Inline Components ──────────────────────────────────── */

interface V3NavbarProps { isAuthenticated: boolean; user?: { firstName?: string; lastName?: string; email?: string } | null; onLogout: () => void; }
const V3Navbar: React.FC<V3NavbarProps> = ({ isAuthenticated, user, onLogout }) => {
  const [scrolled, setScrolled] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const dropRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
  const navLinks = [{ label: "Features", href: "#features" }, { label: "Pricing", href: "/pricing" }, { label: "Extension", href: "/extension" }];

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        padding: isMobile ? "0 16px" : "0 64px",
        height: 64,
        background: scrolled || menuOpen ? "rgba(7,9,15,0.96)" : "transparent",
        backdropFilter: scrolled || menuOpen ? "blur(20px)" : "none",
        borderBottom: scrolled || menuOpen ? "1px solid rgba(255,255,255,0.07)" : "none",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "background 0.3s, backdrop-filter 0.3s",
        fontFamily: "Inter, sans-serif",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo/lo9o.png" alt="LandYourJob" style={{ width: 32, height: 32, borderRadius: 9, objectFit: "contain" }} />
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: isMobile ? 16 : 19, color: "white", letterSpacing: "-0.02em" }}>LandYourJob</span>
        </div>

        {/* Desktop nav links */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {navLinks.map(item => (
              <a key={item.label} href={item.href} style={{ color: "#94a3b8", textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "white")}
                onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}>{item.label}</a>
            ))}
          </div>
        )}

        {/* Right */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {isAuthenticated && user ? (
            <div ref={dropRef} style={{ position: "relative" }}>
              <button onClick={() => setDropOpen(o => !o)} style={{
                display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                padding: isMobile ? "6px 8px" : "7px 14px 7px 8px",
                cursor: "pointer",
              }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#9333ea)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0 }}>{initials}</div>
                {!isMobile && (
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "white", lineHeight: 1.2 }}>{user.firstName}</div>
                    <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.2 }}>{user.email}</div>
                  </div>
                )}
              </button>
              {dropOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 220, background: "#0d1220", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", overflow: "hidden", zIndex: 9999 }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{user.firstName} {user.lastName}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{user.email}</div>
                  </div>
                  {[
                    { icon: <UserIcon size={14} />, label: "Profile", action: () => { navigate("/profile"); setDropOpen(false); } },
                    { icon: <CreditCard size={14} />, label: "Billing", action: () => { navigate("/billing"); setDropOpen(false); } },
                    { icon: <Receipt size={14} />, label: "Credit Activity", action: () => { navigate("/billing#credits"); setDropOpen(false); } },
                  ].map((item, i) => (
                    <button key={i} onClick={item.action} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", background: "transparent", border: "none", color: "#94a3b8", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif", textAlign: "left" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "white"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}>
                      <span style={{ color: "#64748b" }}>{item.icon}</span>{item.label}
                    </button>
                  ))}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    <button onClick={() => { onLogout(); navigate("/login"); setDropOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", background: "transparent", border: "none", color: "#f87171", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                      <LogOut size={14} /> Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {!isMobile && <a href="/login" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Sign in</a>}
              <a href="/register" style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "white", padding: isMobile ? "8px 14px" : "10px 22px", borderRadius: 9, fontSize: isMobile ? 13 : 14, fontWeight: 600, textDecoration: "none", display: "inline-block", whiteSpace: "nowrap" }}>
                {isMobile ? "Join Free" : "Get Started Free"}
              </a>
            </>
          )}

          {/* Hamburger */}
          {isMobile && (
            <button onClick={() => setMenuOpen(o => !o)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px", cursor: "pointer", display: "flex", alignItems: "center", color: "white" }}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <div style={{
          position: "fixed", top: 64, left: 0, right: 0, zIndex: 999,
          background: "rgba(7,9,15,0.98)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "12px 16px 20px",
          fontFamily: "Inter, sans-serif",
        }}>
          {navLinks.map(item => (
            <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}
              style={{ display: "block", padding: "12px 8px", color: "#94a3b8", textDecoration: "none", fontSize: 15, fontWeight: 500, borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "white")}
              onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}>
              {item.label}
            </a>
          ))}
          {!isAuthenticated && (
            <a href="/login" onClick={() => setMenuOpen(false)}
              style={{ display: "block", padding: "12px 8px", color: "#94a3b8", textDecoration: "none", fontSize: 15, fontWeight: 500 }}>
              Sign in
            </a>
          )}
        </div>
      )}
    </>
  );
};

const V3ResumeMockup = () => (
  <div style={{ width: 300, borderRadius: 16, background: "#0d1220", border: "1px solid rgba(124,58,237,0.267)", overflow: "hidden", boxShadow: "0 0 60px rgba(124,58,237,0.13),0 20px 60px rgba(0,0,0,0.5)", fontFamily: "Inter, sans-serif" }}>
    <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 6 }}>
      {["#ef4444", "#f59e0b", "#10b981"].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />)}
      <span style={{ fontSize: 11, color: "#64748b", marginLeft: 6 }}>LandYourJob — ATS Optimizer</span>
    </div>
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: "#475569", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Current Application</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "white", lineHeight: 1.2 }}>Software Development Lead</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Google · Mountain View, CA</div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>ATS Match Score</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>89%</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)" }}>
          <div style={{ height: "100%", width: "89%", borderRadius: 3, background: "linear-gradient(90deg,#7c3aed,#10b981)" }} />
        </div>
      </div>
      {[{ t: "Keywords optimized", ok: true }, { t: "Skills section enhanced", ok: true }, { t: "Add leadership metrics", ok: false }].map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
          <div style={{ width: 15, height: 15, borderRadius: 4, background: item.ok ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${item.ok ? "#10b981" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {item.ok && <span style={{ fontSize: 9, color: "#10b981" }}>✓</span>}
          </div>
          <span style={{ fontSize: 12, color: item.ok ? "#e2e8f0" : "#475569" }}>{item.t}</span>
        </div>
      ))}
      <button style={{ width: "100%", marginTop: 12, padding: "10px", borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Tailor Your Resume →</button>
    </div>
  </div>
);

const V3NovaCard = () => (
  <div style={{ width: "100%", maxWidth: 320, background: "#0d1120", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 16, overflow: "hidden", fontFamily: "Inter, sans-serif", flexShrink: 0 }}>
    <div style={{ padding: "10px 14px", background: "rgba(124,58,237,0.08)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>✦</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>Nova AI</span>
      </div>
      <span style={{ fontSize: 11, color: "#475569" }}>AI Job Assistant</span>
    </div>
    <div style={{ padding: "12px 14px" }}>
      <div style={{ background: "rgba(248,196,113,0.1)", border: "1px solid rgba(248,196,113,0.2)", borderRadius: 20, padding: "7px 14px", display: "inline-block", marginBottom: 10, fontSize: 12, color: "#fbbf24" }}>Find more jobs like these</div>
      <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 12, padding: "10px 12px", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "#a78bfa", marginBottom: 6 }}>Found 5 job listings matching your profile</div>
        {[{ t: "Software Engineer, Advanced", co: "Zebra Technologies · Bengaluru", pct: "94%", col: "#10b981" }, { t: "Full Stack Engineer", co: "UnitedHealth Group · Gurugram", pct: "88%", col: "#38bdf8" }].map((j, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 10px", marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "white", flex: 1, marginRight: 8 }}>{j.t}</div>
              <span style={{ fontSize: 12, fontWeight: 700, color: j.col }}>{j.pct}</span>
            </div>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>{j.co}</div>
            <div style={{ display: "flex", gap: 5 }}>
              {["Track", "Evaluate", "Tailor"].map(a => (
                <button key={a} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#94a3b8", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>{a}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "7px 12px" }}>
        <span style={{ fontSize: 12, color: "#334155", flex: 1 }}>Message Nova...</span>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#9333ea)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>↑</div>
      </div>
    </div>
  </div>
);

const V3FindJobsCard = () => (
  <div style={{ width: "100%", maxWidth: 340, background: "#0d1120", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 16, overflow: "hidden", fontFamily: "Inter, sans-serif", flexShrink: 0 }}>
    <div style={{ padding: "10px 14px", background: "rgba(6,182,212,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>Find Jobs</span>
      <span style={{ fontSize: 11, color: "#475569" }}>10 matches today</span>
    </div>
    <div style={{ padding: "12px 14px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "6px 10px", fontSize: 11, color: "#475569" }}>Job title, role...</div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "6px 10px", fontSize: 11, color: "#475569" }}>Location...</div>
        <button style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)", border: "none", borderRadius: 7, padding: "6px 12px", color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Search</button>
      </div>
      {[
        { t: "Full Stack Engineer (Backend & Data Science)", co: "ReNoteAI · Hyderabad", pct: "71%", col: "#f59e0b", skills: ["Python", "NLP", "REST APIs"], miss: ["OCR"] },
        { t: "Backend Reporting Developer", co: "Imaging Endpoints · Hyderabad", pct: "72%", col: "#10b981", skills: ["Python", "React", "PostgreSQL"], miss: ["clinical domain"] }
      ].map((j, i) => (
        <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 12px", marginBottom: 7 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "white", flex: 1, marginRight: 8, lineHeight: 1.3 }}>{j.t}</div>
            <span style={{ fontSize: 14, fontWeight: 800, color: j.col, whiteSpace: "nowrap" }}>{j.pct}</span>
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>{j.co}</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const, marginBottom: 4 }}>
            {j.skills.map(s => <span key={s} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }}>{s}</span>)}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {j.miss.map(s => <span key={s} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>{s}</span>)}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const V3TrackerCard = () => (
  <div style={{ width: "100%", maxWidth: 360, background: "#0d1120", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 16, overflow: "hidden", fontFamily: "Inter, sans-serif", flexShrink: 0 }}>
    <div style={{ padding: "10px 14px", background: "rgba(16,185,129,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>Application Tracker</span>
      <div style={{ display: "flex", gap: 6 }}>
        {["Kanban", "Table", "Insights"].map(t => <button key={t} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 5, background: t === "Kanban" ? "rgba(16,185,129,0.15)" : "transparent", border: t === "Kanban" ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.07)", color: t === "Kanban" ? "#34d399" : "#475569", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>{t}</button>)}
      </div>
    </div>
    <div style={{ padding: "12px 14px", display: "flex", gap: 8, overflowX: "hidden" as const }}>
      {[
        { label: "EVALUATED", count: 2, color: "#7c3aed", cards: [{ t: "ReNoteAI", r: "Backend Engineer", pct: "78%", col: "#f59e0b", over: false }, { t: "NetApp", r: "Software Engineer", pct: "88%", col: "#10b981", over: false }] },
        { label: "APPLIED", count: 1, color: "#3b82f6", cards: [{ t: "NetApp", r: "Software Engineer", pct: "88%", col: "#10b981", over: true }] },
        { label: "INTERVIEW", count: 0, color: "#f59e0b", cards: [] },
      ].map((col, i) => (
        <div key={i} style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.05em" }}>{col.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "white", background: "rgba(255,255,255,0.08)", borderRadius: 4, padding: "1px 6px" }}>{col.count}</span>
          </div>
          <div style={{ background: `${col.color}11`, border: `1px solid ${col.color}22`, borderRadius: 10, minHeight: 80, padding: "7px" }}>
            {col.cards.map((c, j) => (
              <div key={j} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px", marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "white", marginBottom: 2 }}>{c.t}</div>
                <div style={{ fontSize: 10, color: "#475569", marginBottom: 5 }}>{c.r}</div>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: c.col, background: `${c.col}18`, padding: "2px 6px", borderRadius: 4 }}>{c.pct}</span>
                  {c.over && <span style={{ fontSize: 10, color: "#f87171", background: "rgba(239,68,68,0.1)", padding: "2px 6px", borderRadius: 4 }}>Overdue</span>}
                </div>
              </div>
            ))}
            {col.cards.length === 0 && <div style={{ fontSize: 10, color: "#334155", textAlign: "center" as const, padding: "16px 0" }}>Drop here</div>}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const V3FindClientsCard = () => (
  <div style={{ width: "100%", maxWidth: 320, background: "#0d1120", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 16, overflow: "hidden", fontFamily: "Inter, sans-serif", flexShrink: 0 }}>
    <div style={{ padding: "10px 14px", background: "rgba(236,72,153,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>Find Clients</span>
      <span style={{ fontSize: 11, color: "#475569" }}>8 near you</span>
    </div>
    <div style={{ padding: "12px 14px" }}>
      <div style={{ height: 100, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, marginBottom: 10, position: "relative" as const, overflow: "hidden" as const }}>
        <div style={{ position: "absolute" as const, inset: 0, backgroundImage: "linear-gradient(rgba(124,58,237,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.06) 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
        {[{ top: "25%", left: "30%", c: "#ec4899" }, { top: "50%", left: "55%", c: "#7c3aed" }, { top: "35%", left: "65%", c: "#10b981" }, { top: "65%", left: "40%", c: "#f59e0b" }].map((p, i) => (
          <div key={i} style={{ position: "absolute" as const, top: p.top, left: p.left, width: 10, height: 10, borderRadius: "50%", background: p.c, boxShadow: `0 0 8px ${p.c}`, transform: "translate(-50%,-50%)" }} />
        ))}
        <div style={{ position: "absolute" as const, bottom: 6, right: 8, fontSize: 10, color: "#334155" }}>📍 Hyderabad, IN</div>
      </div>
      {[{ n: "TechServe Solutions", cat: "Web Development", dist: "1.2 km", status: "Hot Lead" }, { n: "DigitalEdge Marketing", cat: "SEO & Content", dist: "2.8 km", status: "New" }].map((b, i) => (
        <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 10px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "white", marginBottom: 2 }}>{b.n}</div>
            <div style={{ fontSize: 10, color: "#475569" }}>{b.cat} · {b.dist}</div>
          </div>
          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, background: i === 0 ? "rgba(236,72,153,0.12)" : "rgba(16,185,129,0.1)", color: i === 0 ? "#f472b6" : "#34d399", border: `1px solid ${i === 0 ? "rgba(236,72,153,0.3)" : "rgba(16,185,129,0.3)"}` }}>{b.status}</span>
        </div>
      ))}
    </div>
  </div>
);

const V3ExtensionCard = () => (
  <div style={{ width: "100%", maxWidth: 280, background: "#0d1120", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 16, overflow: "hidden", fontFamily: "Inter, sans-serif", flexShrink: 0, boxShadow: "0 0 40px rgba(124,58,237,0.15)" }}>
    <div style={{ padding: "10px 14px", background: "rgba(124,58,237,0.1)", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 20, height: 20, borderRadius: 5, background: "linear-gradient(135deg,#7c3aed,#9333ea)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>L</div>
      <span style={{ fontSize: 12, fontWeight: 600, color: "white" }}>LandYourJob Extension</span>
      <span style={{ marginLeft: "auto", fontSize: 10, background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 4, padding: "2px 6px", fontWeight: 600 }}>LIVE</span>
    </div>
    <div style={{ padding: "12px 14px" }}>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Detected Job Post</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 1 }}>Senior Full Stack Engineer</div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>Google · LinkedIn</div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>ATS Match Score</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#10b981" }}>89%</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.07)", marginBottom: 4 }}>
          <div style={{ height: "100%", width: "89%", borderRadius: 3, background: "linear-gradient(90deg,#7c3aed,#10b981)" }} />
        </div>
        <div style={{ fontSize: 10, color: "#34d399" }}>↑ Was 42% · +47 points after tailoring</div>
      </div>
      <button style={{ width: "100%", padding: "9px", borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: "0 4px 16px rgba(124,58,237,0.4)" }}>Tailor Resume →</button>
    </div>
  </div>
);

const V3FeatureSlides = () => {
  const isMobile = useIsMobile();
  const tabs = [
    { label: "Nova AI", icon: "🤖" },
    { label: "Find Jobs", icon: "🔍" },
    { label: "App Tracker", icon: "📋" },
    { label: "Find Clients", icon: "📍" },
    { label: "Extension", icon: "🔧" },
  ];
  const [active, setActive] = useState(0);
  const cards = [<V3NovaCard />, <V3FindJobsCard />, <V3TrackerCard />, <V3FindClientsCard />, <V3ExtensionCard />];
  const descriptions = [
    "Chat with Nova — our AI agent — to find jobs, get match analysis, and track applications. Just say what you want, Nova handles the rest.",
    "Search across 50+ job boards at once. Each job shows your match percentage, matched skills, missing skills, and one-click actions.",
    "Drag-and-drop Kanban pipeline with 5 stages. Track every application from Evaluated through to Interview. Never lose track.",
    "Discover local businesses on a live map that need your skills. Filter by category, distance, and status. Build your client pipeline.",
    "Install once. Tailors your master resume to any job post on LinkedIn, Indeed, Naukri, Glassdoor — live ATS score, keyword tips, what changed.",
  ];
  const titles = [
    "AI-Powered Job Discovery",
    "Intelligent Job Matching",
    "Full Pipeline Management",
    "Find Clients Near You",
    "Resume Tailoring on Any Site",
  ];
  const bullets = [
    ["Nova finds jobs while you sleep", "Explains why you match each role", "Track, evaluate, and tailor in one click"],
    ["50+ job boards covered", "Matched & missing skills shown", "One-click View Job, Evaluate, Track"],
    ["Kanban, Table & Insights views", "Follow-up reminders", "Overdue application alerts"],
    ["Live map of local businesses", "CRM to manage leads", "Bulk status updates"],
    ["ATS score shown live as you browse", "Keyword gap analysis", "PDF export in seconds"],
  ];

  return (
    <div id="features" style={{ padding: isMobile ? "0 20px 80px" : "0 80px 120px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ textAlign: "center" as const, marginBottom: 48 }}>
        <div style={{ fontSize: 13, color: "#7c3aed", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 12 }}>The Full Platform</div>
        <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: isMobile ? 28 : 38, fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 16, color: "white" }}>
          Everything you need,{" "}
          <span style={{ background: "linear-gradient(135deg,#a78bfa,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>in one place</span>
        </h2>
        <p style={{ fontSize: isMobile ? 15 : 17, color: "#64748b", maxWidth: 480, margin: "0 auto" }}>Five powerful tools working together to land you the job — automatically.</p>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" as const, marginBottom: 40, flexWrap: "wrap" as const }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            display: "flex", alignItems: "center", gap: isMobile ? 4 : 8, padding: isMobile ? "8px 12px" : "10px 20px", borderRadius: 100,
            border: `1px solid ${active === i ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.08)"}`, cursor: "pointer",
            fontFamily: "Inter, sans-serif", fontSize: isMobile ? 11 : 13, fontWeight: 600, transition: "all 0.2s",
            background: active === i ? "linear-gradient(135deg,#7c3aed,#9333ea)" : "rgba(255,255,255,0.04)",
            color: active === i ? "white" : "#64748b",
            boxShadow: active === i ? "0 4px 20px rgba(124,58,237,0.25)" : "none",
          }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "center" as const, alignItems: isMobile ? "center" : "flex-start", gap: isMobile ? 24 : 24 }}>
        <div style={{ width: "100%", maxWidth: isMobile ? "100%" : undefined, display: "flex", justifyContent: "center" }}>{cards[active]}</div>
        <div style={{ maxWidth: isMobile ? "100%" : 320, width: "100%", paddingTop: isMobile ? 0 : 20 }}>
          <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: isMobile ? 22 : 26, fontWeight: 800, color: "white", marginBottom: 12, letterSpacing: "-0.02em" }}>{titles[active]}</h3>
          <p style={{ fontSize: isMobile ? 14 : 15, color: "#64748b", lineHeight: 1.75, marginBottom: 20 }}>{descriptions[active]}</p>
          {bullets[active].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 9, color: "#a78bfa" }}>✓</span>
              </div>
              <span style={{ fontSize: 14, color: "#cbd5e1" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const V3ExtensionDetail = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["ATS Score", "What Changed", "Statistics"];
  const content = [
    <div key="ats">
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Before LandYourJob</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>42%</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.07)" }}>
          <div style={{ height: "100%", width: "42%", borderRadius: 4, background: "#ef4444" }} />
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>After LandYourJob</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>89%</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.07)" }}>
          <div style={{ height: "100%", width: "89%", borderRadius: 4, background: "linear-gradient(90deg,#7c3aed,#10b981)" }} />
        </div>
      </div>
      <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "12px", textAlign: "center" as const }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#34d399", fontFamily: "Space Grotesk, sans-serif" }}>+47pts</div>
        <div style={{ fontSize: 12, color: "#64748b" }}>average score improvement</div>
      </div>
    </div>,
    <div key="changed">
      {[
        { type: "add", text: "Added: React, TypeScript, Node.js to skills" },
        { type: "add", text: "Added: Leadership & ownership keywords" },
        { type: "add", text: "Strengthened: Impact metrics in experience" },
        { type: "tip", text: "Tip: Quantify your achievements (e.g. \"reduced load time by 40%\")" },
        { type: "tip", text: "Tip: Mirror exact job title in summary section" },
      ].map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, padding: "9px 12px", borderRadius: 9, background: item.type === "add" ? "rgba(16,185,129,0.07)" : "rgba(245,158,11,0.07)", border: `1px solid ${item.type === "add" ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}` }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>{item.type === "add" ? "✚" : "💡"}</span>
          <span style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>{item.text}</span>
        </div>
      ))}
    </div>,
    <div key="stats">
      {[
        { label: "Keywords inserted", val: "12", col: "#a78bfa" },
        { label: "Sections improved", val: "4", col: "#38bdf8" },
        { label: "ATS improvement", val: "+47%", col: "#34d399" },
        { label: "Time saved", val: "23 min", col: "#f472b6" },
      ].map((s, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>{s.label}</span>
          <span style={{ fontSize: 17, fontWeight: 800, color: s.col, fontFamily: "Space Grotesk, sans-serif" }}>{s.val}</span>
        </div>
      ))}
    </div>,
  ];

  return (
    <section style={{ padding: isMobile ? "40px 20px" : "80px", background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 40 : 80, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 100, padding: "7px 18px", marginBottom: 28, fontSize: 12, color: "#a78bfa", fontWeight: 600 }}>
            Chrome Extension · Free · Works Everywhere
          </div>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: isMobile ? 28 : 38, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.025em", marginBottom: 20, color: "white" }}>
            Tailor your resume<br />
            <span style={{ background: "linear-gradient(135deg,#a78bfa,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>on any job site</span>
          </h2>
          <p style={{ fontSize: isMobile ? 14 : 16, color: "#64748b", lineHeight: 1.8, marginBottom: 32, maxWidth: 460 }}>
            Install once. Browse any job board — LinkedIn, Indeed, Naukri, Glassdoor, Internshala. Our extension detects the job post, analyzes your master resume, and shows you a live ATS score with exactly what to fix.
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" as const }}>
            {["LinkedIn", "Indeed", "Naukri", "Glassdoor", "Unstop", "Internshala"].map(p => (
              <span key={p} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#94a3b8" }}>{p}</span>
            ))}
          </div>
          <a href="/extension" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", color: "white", padding: isMobile ? "12px 24px" : "15px 32px", borderRadius: 12, fontSize: isMobile ? 14 : 15, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: "0 0 40px rgba(124,58,237,0.4)", textDecoration: "none" }}>
            Install Free Extension →
          </a>
        </div>
        <div style={{ background: "#0d1220", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 20, overflow: "hidden", boxShadow: "0 0 60px rgba(124,58,237,0.12)" }}>
          <div style={{ padding: "12px 16px", background: "rgba(124,58,237,0.08)", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#7c3aed,#9333ea)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", fontFamily: "Space Grotesk, sans-serif" }}>L</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "white", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>LandYourJob · Senior Full Stack Engineer @ Google</span>
            <span style={{ fontSize: 10, background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 5, padding: "2px 8px", fontWeight: 700, flexShrink: 0 }}>LIVE</span>
          </div>
          <div style={{ padding: "16px", fontFamily: "Inter, sans-serif" }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
              {tabs.map((t, i) => (
                <button key={i} onClick={() => setActiveTab(i)} style={{ flex: 1, padding: "7px", borderRadius: 8, border: `1px solid ${activeTab === i ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.07)"}`, cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, transition: "all 0.2s", background: activeTab === i ? "rgba(124,58,237,0.2)" : "transparent", color: activeTab === i ? "#a78bfa" : "#475569" }}>
                  {t}
                </button>
              ))}
            </div>
            {content[activeTab]}
            <button style={{ width: "100%", marginTop: 16, padding: "11px", borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}>
              Apply Tailoring to Resume →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const V3FAQ = () => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "How does LandYourJob automatically find jobs for me?", a: "LandYourJob connects to 50+ job boards including LinkedIn, Indeed, Naukri, Unstop, Glassdoor and more. Every day, our AI scans new postings, matches them against your master resume, and sends you a ranked list of opportunities — with match percentages and skill gap analysis. Zero manual searching." },
    { q: "What exactly does the Chrome extension do?", a: "Once installed, the extension activates whenever you visit a job posting on any supported site. It reads the job description, compares it to your master resume, shows a live ATS score, highlights missing keywords, and lets you tailor your resume with one click. The tailored version is ready to download as a PDF in seconds." },
    { q: "Which job boards and platforms are supported?", a: "We support LinkedIn, Indeed, Naukri, Unstop, Glassdoor, Internshala, talent.com, jobrapido, and more. The extension works on any page with a job description — even company career pages. New platforms are added regularly." },
    { q: "Is there a free plan?", a: "Yes! LandYourJob has a generous free plan that includes daily job alerts, basic resume tailoring, and the Chrome extension. Paid plans unlock unlimited tailoring, priority matching, the client finder map, advanced analytics, and more. No credit card required to start." },
    { q: "How accurate is the ATS scoring?", a: "Our ATS scoring is based on real ATS algorithms used by Taleo, Workday, Greenhouse, and other popular applicant tracking systems. We analyze keyword density, skills matching, section formatting, and content relevance. Users consistently report a 40–60% improvement in callback rates after optimizing with LandYourJob." },
    { q: "Can freelancers and consultants use LandYourJob?", a: "Absolutely. The \"Find Clients\" feature is built specifically for freelancers. It shows local businesses near you on a live map, lets you filter by industry and category, and includes a built-in CRM to manage your leads from discovery to closed deal." },
    { q: "How is LandYourJob different from just using LinkedIn?", a: "LinkedIn shows you jobs, but you still have to manually tailor each application — which takes hours. LandYourJob automates the entire pipeline: it finds jobs across all boards (not just LinkedIn), scores your match, tailors your resume automatically, tracks every application, and even finds freelance clients." },
    { q: "Is my resume data secure?", a: "Yes. Your master resume is stored encrypted and is never shared with third parties. We only use it to match you with jobs and tailor applications. You can delete your data at any time from your account settings." },
  ];
  return (
    <section style={{ padding: isMobile ? "60px 20px" : "100px 80px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ textAlign: "center" as const, marginBottom: 64 }}>
        <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: isMobile ? 28 : 38, fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 16, color: "white" }}>Frequently asked questions</h2>
        <p style={{ fontSize: isMobile ? 15 : 17, color: "#64748b" }}>Everything you need to know about LandYourJob.</p>
      </div>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {faqs.map((faq, i) => (
          <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 0", background: "transparent", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", textAlign: "left" as const, gap: 16 }}>
              <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, color: open === i ? "white" : "#cbd5e1", transition: "color 0.2s", lineHeight: 1.4 }}>{faq.q}</span>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: open === i ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s", border: `1px solid ${open === i ? "rgba(124,58,237,0.267)" : "rgba(255,255,255,0.1)"}` }}>
                <span style={{ fontSize: 14, color: open === i ? "#a78bfa" : "#64748b", transition: "transform 0.3s", display: "block", transform: open === i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
              </div>
            </button>
            {open === i && (
              <div style={{ paddingBottom: 24 }}>
                <p style={{ fontSize: isMobile ? 14 : 15, color: "#64748b", lineHeight: 1.8 }}>{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

interface V3FooterProps {
  appName: string;
}
const V3Footer: React.FC<V3FooterProps> = ({ appName }) => {
  const isMobile = useIsMobile();
  return (
    <footer style={{ background: "#040608", borderTop: "1px solid rgba(255,255,255,0.06)", padding: isMobile ? "40px 20px 28px" : "64px 80px 36px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr 1fr", gap: isMobile ? 32 : 40, marginBottom: 48 }}>
          <div style={{ gridColumn: isMobile ? "1 / -1" : undefined }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <img src="/logo/lo9o.png" alt="LandYourJob" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, color: "white" }}>{appName}</span>
            </div>
            <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, maxWidth: 220 }}>AI-powered job search, resume tailoring & client discovery for modern professionals.</p>
          </div>
          {[
            { title: "Product", links: [{ label: "Pricing", href: "/pricing" }, { label: "Find Jobs", href: "/findjob" }, { label: "Find Clients", href: "/find-business" }, { label: "Chrome Extension", href: "/extension" }, { label: "App Tracker", href: "/tracker" }] },
            { title: "Account", links: [{ label: "Sign Up", href: "/register" }, { label: "Sign In", href: "/login" }, { label: "Dashboard", href: "/" }, { label: "Settings", href: "/profile" }] },
            { title: "Legal", links: [{ label: "Privacy Policy", href: "/privacy-policy" }, { label: "Terms of Service", href: "/terms" }, { label: "Refund Policy", href: "/refund-policy" }] },
            { title: "Support", links: [{ label: "Contact Us", href: "/contact" }, { label: "Help Center", href: "/contact" }] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 16, textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>{col.title}</div>
              {col.links.map(link => (
                <a key={link.label} href={link.href} style={{ display: "block", fontSize: 14, color: "#334155", textDecoration: "none", marginBottom: 10, transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#94a3b8")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#334155")}>{link.label}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 24, display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 8 : 0 }}>
          <span style={{ fontSize: 13, color: "#1e293b" }}>© 2026 {appName}. All rights reserved.</span>
          <span style={{ fontSize: 13, color: "#1e293b" }}>Built for job seekers, by job seekers.</span>
        </div>
      </div>
    </footer>
  );
};

/* ─── Video Feature Cards (WhatYouCanObtain) ───────────────────────── */
const V3VideoCards = () => {
  const isMobile = useIsMobile();
  const cards = [
    { title: "Daily AI Notifications", src: "/videos/telegram.mp4", desc: "Instant AI notifications about new jobs daily with ready-made resumes. Get new business clients too." },
    { title: "Auto AI Resume", src: "/videos/Resume_Tailor.mp4", desc: "A Chrome extension that readily tailors your resume wherever you see a job post — automatically." },
    { title: "AI Job Search", src: "/videos/AI_Job_Search.mp4", desc: "Automatically searches LinkedIn, Naukri and many more websites and sends daily notifications." },
    { title: "Find Clients", src: "/videos/Find_business.mp4", desc: "Easily view on the map who needs your assistance and turn it into a real business opportunity." },
  ];
  const [errors, setErrors] = React.useState<boolean[]>(cards.map(() => false));
  const refs = React.useRef<(HTMLVideoElement | null)[]>([]);
  React.useEffect(() => {
    refs.current.forEach(v => { if (v) v.play().catch(() => {}); });
  }, []);

  return (
    <section style={{ padding: isMobile ? "40px 20px" : "64px 80px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ textAlign: "center" as const, marginBottom: 40 }}>
        <div style={{ fontSize: 12, color: "#7c3aed", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 10 }}>See it in action</div>
        <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: isMobile ? 28 : 38, fontWeight: 800, color: "white", letterSpacing: "-0.025em", marginBottom: 10 }}>
          What you can{" "}
          <span style={{ background: "linear-gradient(135deg,#06b6d4,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>obtain</span>
        </h2>
        <p style={{ fontSize: 15, color: "#475569" }}>Everything you need to land your dream job, automated.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: isMobile ? 12 : 16 }}>
        {cards.map((card, i) => (
          <div key={card.title} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(13,18,32,0.8)", transition: "transform 0.2s,border-color 0.2s", cursor: "pointer" }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,58,237,0.3)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)"; }}>
            <div style={{ position: "relative" as const, paddingTop: "min(100%, 260px)", overflow: "hidden" }}>
              <div style={{ position: "absolute" as const, inset: 0, zIndex: 1, background: "linear-gradient(to bottom,rgba(0,0,0,0.7) 0%,transparent 50%)" }} />
              <span style={{ position: "absolute" as const, top: 10, left: 12, zIndex: 2, fontSize: isMobile ? 10 : 12, fontWeight: 700, color: "white" }}>{card.title}</span>
              {errors[i] ? (
                <div style={{ position: "absolute" as const, inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0d1120" }}>
                  <span style={{ fontSize: 12, color: "#334155" }}>🎬 Preview Coming Soon</span>
                </div>
              ) : (
                <video ref={el => { refs.current[i] = el; }} autoPlay muted loop playsInline preload="auto"
                  style={{ position: "absolute" as const, inset: 0, width: "100%", height: "100%", objectFit: "cover" as const }}
                  onError={() => setErrors(prev => { const n = [...prev]; n[i] = true; return n; })}>
                  <source src={card.src} type="video/mp4" />
                </video>
              )}
            </div>
            <div style={{ padding: isMobile ? "10px 10px 12px" : "12px 14px 14px" }}>
              <p style={{ fontSize: isMobile ? 11 : 12, color: "#475569", lineHeight: 1.6 }}>{card.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ─── Main Dashboard Component ─────────────────────────────────────── */

export const Dashboard: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { app_name: appName } = useAppConfig();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [masterResume, setMasterResume] = useState<ResumeData | null>(null);
  const [pipeline, setPipeline] = useState<PipelineCounts | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  // V3 hero cycling state — simple fade, no typing
  const headlines = [
    { pre: "The AI that tailors", highlight: "your resume", sub: "Live ATS scoring + instant tailoring on every job post. Land interviews 3x faster." },
    { pre: "The AI that finds", highlight: "your next job", sub: "Searches LinkedIn, Naukri, Indeed & more. Daily curated matches delivered to you." },
    { pre: "The AI that finds", highlight: "your next client", sub: "Discover local businesses on a live map. Turn nearby opportunities into paying work." },
    { pre: "The AI that works on", highlight: "every job site", sub: "Chrome extension with live ATS score, keyword gaps, and one-click resume tailoring." },
  ];
  const [cur, setCur] = useState(0);
  const [vis, setVis] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVis(false);
      setTimeout(() => { setCur(c => (c + 1) % headlines.length); setVis(true); }, 350);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const h = headlines[cur];

  const loadDashboardData = async () => {
    try {
      const resume = await getMasterResume();
      setMasterResume(resume);
    } catch (e) {
      // non-critical
    }
  };

  useEffect(() => {
    loadDashboardData();
    apiClient.getPublicStats()
      .then(res => setTotalUsers(res?.data?.total_users ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDashboardData();
      apiClient.getApplicationStats()
        .then((stats: any) => {
          const b = stats?.stageBreakdown ?? {};
          setPipeline({ applied: b.applied ?? 0, interview: b.interview ?? 0, offer: b.offer ?? 0, rejected: b.rejected ?? 0 });
        })
        .catch(() => {});
    } else {
      setMasterResume(null);
      setPipeline(null);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        const resume = await getMasterResume();
        setMasterResume(resume);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    const handleStorageChange = async () => {
      const resume = await getMasterResume();
      if (resume) setMasterResume(resume);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <div style={{ background: "#07090f", minHeight: "100vh", color: "white", fontFamily: "Inter, sans-serif", overflowX: "hidden" }}>

      {/* Navbar */}
      <V3Navbar isAuthenticated={isAuthenticated} user={user} onLogout={logout} />

      {/* ── Authenticated Workspace Strip ── */}
      {isAuthenticated && user && (
        <div style={{ marginTop: 66, borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(13,18,32,0.85)", backdropFilter: "blur(12px)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "10px 16px" : "10px 40px", display: "flex", alignItems: "center", gap: 12, overflowX: "auto" as const, scrollbarWidth: "none" as const }}>

            {/* Greeting */}
            <span style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1", whiteSpace: "nowrap" as const }}>
              👋 {user.firstName}
            </span>

            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />

            {/* Credits */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 20, padding: "3px 10px", flexShrink: 0 }}>
              <Zap style={{ width: 11, height: 11, color: "#22d3ee" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#22d3ee", whiteSpace: "nowrap" }}>{user.credits ?? 0} credits</span>
            </div>

            {/* Plan badge */}
            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, border: user.has_payments ? "1px solid rgba(167,139,250,0.3)" : "1px solid rgba(100,116,139,0.3)", color: user.has_payments ? "#a78bfa" : "#64748b", background: user.has_payments ? "rgba(124,58,237,0.1)" : "transparent", flexShrink: 0, whiteSpace: "nowrap" as const }}>
              {user.has_payments ? "Pro" : "Free"}
            </span>

            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />

            {/* Quick links */}
            {[
              { label: "Find Jobs", to: "/findjob", color: "#f472b6" },
              { label: masterResume ? "Tailor Resume" : "Upload Resume", to: masterResume ? "/tailor" : "/upload", color: "#a78bfa" },
              { label: "Find Clients", to: "/find-business", color: "#34d399" },
              { label: "Extension", to: "/resume", color: "#818cf8" },
              { label: "Tracker", to: "/tracker", color: "#38bdf8" },
            ].map(item => (
              <Link key={item.label} to={item.to} style={{ fontSize: 12, fontWeight: 500, color: "#64748b", textDecoration: "none", transition: "color 0.15s", whiteSpace: "nowrap" as const, flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = item.color)}
                onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}>
                {item.label}
              </Link>
            ))}

            {/* Pipeline badges */}
            {pipeline && (pipeline.applied + pipeline.interview + pipeline.offer + pipeline.rejected) > 0 && (
              <>
                <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />
                {pipeline.applied > 0 && (
                  <button onClick={() => navigate("/tracker?stage=applied")} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(96,165,250,0.3)", color: "#93c5fd", background: "rgba(59,130,246,0.1)", cursor: "pointer", fontFamily: "Inter, sans-serif", flexShrink: 0, whiteSpace: "nowrap" }}>
                    {pipeline.applied} Applied
                  </button>
                )}
                {pipeline.interview > 0 && (
                  <button onClick={() => navigate("/tracker?stage=interview")} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(251,191,36,0.3)", color: "#fcd34d", background: "rgba(245,158,11,0.1)", cursor: "pointer", fontFamily: "Inter, sans-serif", flexShrink: 0, whiteSpace: "nowrap" }}>
                    {pipeline.interview} Interview
                  </button>
                )}
                {pipeline.offer > 0 && (
                  <button onClick={() => navigate("/tracker?stage=offer")} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(52,211,153,0.3)", color: "#6ee7b7", background: "rgba(16,185,129,0.1)", cursor: "pointer", fontFamily: "Inter, sans-serif", flexShrink: 0, whiteSpace: "nowrap" }}>
                    {pipeline.offer} Offer
                  </button>
                )}
                {pipeline.rejected > 0 && (
                  <button onClick={() => navigate("/tracker?stage=rejected")} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(248,113,113,0.3)", color: "#fca5a5", background: "rgba(239,68,68,0.1)", cursor: "pointer", fontFamily: "Inter, sans-serif", flexShrink: 0, whiteSpace: "nowrap" }}>
                    {pipeline.rejected} Rejected
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── HERO ──────────────────────────────────────────── */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isAuthenticated ? (isMobile ? "60px 20px 60px" : "80px 40px 80px") : (isMobile ? "110px 20px 60px" : "140px 40px 80px"), textAlign: "center" as const, position: "relative" as const, overflow: "hidden" }}>
        <div style={{ position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -20%,rgba(124,58,237,0.15) 0%,transparent 60%)", pointerEvents: "none" }} />

        {/* Social proof pill */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: isMobile ? 10 : 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, padding: isMobile ? "6px 16px 6px 6px" : "8px 24px 8px 8px", marginBottom: isMobile ? 28 : 44 }}>
          <div style={{ display: "flex" }}>
            {["#7c3aed", "#06b6d4", "#ec4899", "#10b981"].map((c, i) => (
              <div key={i} style={{ width: isMobile ? 22 : 28, height: isMobile ? 22 : 28, borderRadius: "50%", background: c, border: "2px solid #07090f", marginLeft: i > 0 ? -8 : 0, fontSize: 10, color: "white", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {["R", "S", "A", "M"][i]}
              </div>
            ))}
          </div>
          <span style={{ fontSize: isMobile ? 12 : 13, color: "#94a3b8", fontWeight: 500 }}>Trusted by <strong style={{ color: "white" }}>{totalUsers !== null ? totalUsers.toLocaleString() : "..."}</strong> job seekers</span>
        </div>

        <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: isMobile ? 34 : 60, fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", marginBottom: isMobile ? 16 : 28, maxWidth: 860, opacity: vis ? 1 : 0, transition: "opacity 0.35s" }}>
          <span style={{ color: "#64748b", fontWeight: 600 }}>{h.pre} </span>
          <span style={{ color: "white" }}>{h.highlight}</span>
        </h1>

        <p style={{ fontSize: isMobile ? 15 : 17, color: "#475569", lineHeight: 1.7, marginBottom: isMobile ? 28 : 44, maxWidth: 540, opacity: vis ? 1 : 0, transition: "opacity 0.35s 0.05s" }}>{h.sub}</p>

        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 20, width: isMobile ? "100%" : undefined, maxWidth: isMobile ? 320 : undefined }}>
          <a href="/register" style={{ background: "white", color: "#0a0b14", padding: isMobile ? "14px 32px" : "17px 44px", borderRadius: 12, fontSize: isMobile ? 15 : 16, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", border: "none", textDecoration: "none", display: "inline-block", transition: "transform 0.2s,box-shadow 0.2s", width: isMobile ? "100%" : undefined, textAlign: "center" as const }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(255,255,255,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
            Start for Free →
          </a>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, justifyContent: "center" as const, marginBottom: 24 }}>
          {[{ icon: "🤖", l: "Nova AI" }, { icon: "🔍", l: "Job Matching" }, { icon: "📋", l: "App Tracker" }, { icon: "📍", l: "Find Clients" }, { icon: "🔧", l: "Extension" }].map(f => (
            <span key={f.l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "5px 14px", borderRadius: 100, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#475569" }}>
              {f.icon} {f.l}
            </span>
          ))}
        </div>

        <div style={{ fontSize: 13, color: "#1e293b", marginBottom: 72 }}>Free plan · No credit card · Ready in 2 minutes</div>

        {/* Two-panel mockup — hidden on mobile to avoid overflow */}
        {!isMobile && (
          <div style={{ maxWidth: 820, width: "100%", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: "28px", display: "flex", justifyContent: "center" as const, gap: 28, alignItems: "flex-start" }}>
            <V3ResumeMockup />
            <div style={{ flex: 1, paddingTop: 4, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "#334155", marginBottom: 14, textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>Today's AI Matches</div>
              {[
                { title: "Senior Software Engineer", co: "Flipkart · Bangalore", match: "94%", col: "#10b981" },
                { title: "Full Stack Developer", co: "Razorpay · Remote", match: "87%", col: "#38bdf8" },
                { title: "Backend Engineer", co: "Swiggy · Hyderabad", match: "81%", col: "#a78bfa" },
              ].map((job, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ minWidth: 0, marginRight: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 2, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{job.title}</div>
                    <div style={{ fontSize: 11, color: "#334155" }}>{job.co}</div>
                  </div>
                  <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: job.col, fontFamily: "Space Grotesk, sans-serif" }}>{job.match}</div>
                    <div style={{ fontSize: 10, color: "#334155" }}>match</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile: show job matches only */}
        {isMobile && (
          <div style={{ width: "100%", maxWidth: 400, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "20px 16px" }}>
            <div style={{ fontSize: 11, color: "#334155", marginBottom: 14, textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>Today's AI Matches</div>
            {[
              { title: "Senior Software Engineer", co: "Flipkart · Bangalore", match: "94%", col: "#10b981" },
              { title: "Full Stack Developer", co: "Razorpay · Remote", match: "87%", col: "#38bdf8" },
              { title: "Backend Engineer", co: "Swiggy · Hyderabad", match: "81%", col: "#a78bfa" },
            ].map((job, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ minWidth: 0, marginRight: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{job.title}</div>
                  <div style={{ fontSize: 11, color: "#334155" }}>{job.co}</div>
                </div>
                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: job.col, fontFamily: "Space Grotesk, sans-serif" }}>{job.match}</div>
                  <div style={{ fontSize: 10, color: "#334155" }}>match</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination dots */}
        <div style={{ position: "absolute" as const, bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
          {headlines.map((_, i) => (
            <button key={i} onClick={() => { setVis(false); setTimeout(() => { setCur(i); setVis(true); }, 200); }} style={{ width: 6, height: 6, borderRadius: "50%", background: i === cur ? "white" : "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", transition: "all 0.3s", padding: 0 }} />
          ))}
        </div>
      </section>

      {/* ── TRUST LOGOS ───────────────────────────────────── */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: isMobile ? "20px 20px" : "28px 80px", textAlign: "center" as const }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ fontSize: 11, color: "#1e293b", marginBottom: 18, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Works with</div>
          <div style={{ display: "flex", justifyContent: "center" as const, gap: isMobile ? 20 : 48, alignItems: "center", flexWrap: "wrap" as const }}>
            {["LinkedIn", "Indeed", "Naukri", "Unstop", "Glassdoor", "Internshala"].map(p => (
              <span key={p} style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, color: "#1e293b", letterSpacing: "-0.01em" }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "40px 20px 20px" : "80px 80px 40px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: isMobile ? 1 : 2 }}>
          {[
            { num: "10,000+", label: "Successful applications placed", color: "#a78bfa" },
            { num: "50+", label: "Job boards monitored 24/7", color: "#38bdf8" },
            { num: "10s", label: "Average resume tailoring time", color: "#34d399" },
            { num: "4.9/5", label: "Rating from verified users", color: "#f472b6" },
          ].map((s, i) => (
            <div key={i} style={{ padding: isMobile ? "24px 16px" : "40px", borderRight: !isMobile && i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none", borderBottom: isMobile && i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: isMobile ? 28 : 40, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 10 }}>{s.num}</div>
              <div style={{ fontSize: isMobile ? 13 : 15, color: "#334155", lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURE SLIDES ────────────────────────────────── */}
      <V3FeatureSlides />

      {/* ── CHROME EXTENSION DETAIL ───────────────────────── */}
      <V3ExtensionDetail />

      {/* ── VIDEO FEATURE CARDS ───────────────────────────── */}
      <V3VideoCards />

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section style={{ padding: isMobile ? "40px 20px 60px" : "60px 80px 80px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-end", gap: isMobile ? 16 : 0, marginBottom: isMobile ? 32 : 52 }}>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: isMobile ? 26 : 36, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1, color: "white" }}>What our users<br />are saying</h2>
          <div style={{ fontSize: 14, color: "#334155", textAlign: isMobile ? "left" : "right" as const }}>
            <span style={{ fontSize: isMobile ? 28 : 36, fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, color: "white", display: "block" }}>⭐ 4.9</span>
            from 2,000+ reviews
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 16 : 20 }}>
          {[
            { name: "Rahul Sharma", role: "Full Stack Engineer", text: "Got 3 interviews in my first week. The AI resume tailoring jumped my ATS score from 40% to 91%. Nova found jobs I never would have searched for.", avatar: "R" },
            { name: "Priya Mehta", role: "Product Designer", text: "Finally stopped spending hours customizing resumes. LandYourJob does it in 10 seconds and it actually works — landed a role at a Series B startup.", avatar: "P" },
            { name: "Amit Gupta", role: "Data Scientist", text: "The daily job alerts are insane. Woke up to 7 new matches, applied to 3 with tailored resumes, got 2 calls back same week.", avatar: "A" },
          ].map((t, i) => (
            <div key={i} style={{ padding: isMobile ? "24px 20px" : "32px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, background: "rgba(255,255,255,0.02)", transition: "border-color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}>
              <div style={{ display: "flex", gap: 3, marginBottom: 18 }}>{[1, 2, 3, 4, 5].map(s => <span key={s} style={{ color: "#f59e0b", fontSize: 14 }}>★</span>)}</div>
              <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.8, marginBottom: 24 }}>"{t.text}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: ["rgba(124,58,237,0.25)", "rgba(6,182,212,0.25)", "rgba(16,185,129,0.25)"][i], border: `1px solid ${["rgba(124,58,237,0.4)", "rgba(6,182,212,0.4)", "rgba(16,185,129,0.4)"][i]}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white" }}>{t.avatar}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "#334155" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <V3FAQ />

      {/* ── CTA ───────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "60px 20px" : "100px 80px", textAlign: "center" as const, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 12, color: "#334155", marginBottom: 18, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Get started today</div>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: isMobile ? 28 : 36, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 20, color: "white" }}>Land your dream job.</h2>
          <p style={{ fontSize: 15, color: "#334155", marginBottom: 48, lineHeight: 1.6 }}>Join {totalUsers !== null ? totalUsers.toLocaleString() : "..."} professionals already using LandYourJob.</p>
          <a href="/register" style={{ background: "white", border: "none", color: "#07090f", padding: isMobile ? "16px 40px" : "20px 60px", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", textDecoration: "none", display: "inline-block", transition: "transform 0.2s,box-shadow 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(255,255,255,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}>
            Start for Free →
          </a>
          <div style={{ marginTop: 24, fontSize: 13, color: "#1e293b" }}>Free plan · No credit card · Setup in 2 min</div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <V3Footer appName={appName ?? "LandYourJob"} />

      {/* Floating chat for auth users */}
      {isAuthenticated && <FloatingChatButton />}
    </div>
  );
};

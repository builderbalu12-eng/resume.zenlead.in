import * as React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { LogOut, User as UserIcon, CreditCard, Receipt, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppConfig } from "@/contexts/AppConfigContext";
import { PRIMARY_NAV, ACCOUNT_NAV, type NavItem } from "./nav";

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);
  React.useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

function AppNavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const [hovered, setHovered] = React.useState(false);
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      onClick={onClick}
      style={({ isActive }) => ({
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 14px", borderRadius: 8,
        fontSize: 13, fontWeight: isActive ? 600 : 500,
        color: isActive ? "white" : hovered ? "#94a3b8" : "#64748b",
        background: isActive ? "rgba(255,255,255,0.09)" : "transparent",
        textDecoration: "none",
        transition: "color 0.2s, background 0.2s",
        whiteSpace: "nowrap",
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon className="w-3.5 h-3.5" />
      {item.label}
    </NavLink>
  );
}

export function AppHeader({ primaryAction }: { primaryAction?: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { logo_url: logoUrl, app_name: appName } = useAppConfig();
  const [dropOpen, setDropOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const dropRef = React.useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Close mobile menu on route change
  React.useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = ((user?.firstName?.slice(0, 1) ?? "") + (user?.lastName?.slice(0, 1) ?? "")).toUpperCase() || "?";
  const name = appName ?? "LandYourJob";
  const allNavItems = [...PRIMARY_NAV, ...ACCOUNT_NAV];

  const userDropdown = (
    <div ref={dropRef} style={{ position: "relative" }}>
      <button
        onClick={() => setDropOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, padding: "6px 10px 6px 8px", cursor: "pointer",
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg,#7c3aed,#9333ea)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0,
        }}>{initials}</div>
        {!isMobile && (
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "white", lineHeight: 1.2 }}>{user?.firstName}</div>
            <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.2 }}>{user?.email}</div>
          </div>
        )}
      </button>
      {dropOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, width: 200,
          background: "#0d1220", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", overflow: "hidden", zIndex: 9999,
        }}>
          {[
            { icon: <UserIcon size={14} />, label: "Profile", path: "/profile" },
            { icon: <CreditCard size={14} />, label: "Billing", path: "/billing" },
            { icon: <Receipt size={14} />, label: "Credit Activity", path: "/billing#credits" },
          ].map((item, i) => (
            <button key={i} onClick={() => { navigate(item.path); setDropOpen(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", background: "transparent", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif", textAlign: "left" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}>
              <span style={{ color: "#64748b" }}>{item.icon}</span>{item.label}
            </button>
          ))}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <button onClick={() => { logout(); navigate("/login"); setDropOpen(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", background: "transparent", border: "none", color: "#f87171", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              <LogOut size={14} /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        height: 60,
        background: "rgba(7,9,15,0.96)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px",
        fontFamily: "Inter, sans-serif",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <img src={logoUrl || "/logo/lo9o.png"} alt="" style={{ width: 30, height: 30, borderRadius: 8, objectFit: "contain" }} />
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 17, color: "white", letterSpacing: "-0.02em" }}>{name}</span>
        </div>

        {/* Desktop nav items */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {allNavItems.map(item => <AppNavLink key={item.path} item={item} />)}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {primaryAction}

          {isAuthenticated && user ? userDropdown : (
            <>
              {!isMobile && (
                <a href="/login" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>Sign in</a>
              )}
              <a href="/register" style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "white", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", display: "inline-block", whiteSpace: "nowrap" }}>
                {isMobile ? "Join" : "Get Started"}
              </a>
            </>
          )}

          {/* Hamburger — mobile only */}
          {isMobile && (
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile drawer */}
      {isMobile && menuOpen && (
        <div style={{
          position: "fixed", top: 60, left: 0, right: 0, zIndex: 999,
          background: "rgba(7,9,15,0.98)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "12px 16px 20px",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {allNavItems.map(item => (
              <AppNavLink key={item.path} item={item} onClick={() => setMenuOpen(false)} />
            ))}
          </div>
          {!isAuthenticated && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <a href="/login" style={{ display: "block", textAlign: "center", color: "#94a3b8", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "10px" }}>Sign in</a>
            </div>
          )}
        </div>
      )}
    </>
  );
}

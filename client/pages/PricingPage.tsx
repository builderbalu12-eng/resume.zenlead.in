import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAppConfig } from "@/contexts/AppConfigContext";
import { paymentService, type BillingCycle, type SubscriptionPlan } from "@/services/paymentService";
import { useCashfree } from "@/hooks/useCashfree";
import { User as UserIcon, CreditCard, Receipt, LogOut, Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";

/* ─── Types ──────────────────────────────────────────────────────────── */
type CouponState =
  | { status: "idle" }
  | { status: "applying" }
  | { status: "applied"; code: string; planId: string; original: number; discounted: number; discount: number }
  | { status: "error"; message: string };

/* ─── Helpers ────────────────────────────────────────────────────────── */
function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

const CheckIcon = ({ color = "#34d399" }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7.5" stroke={color} strokeOpacity="0.25" />
    <path d="M5 8l2.2 2.2L11 5.8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ─── Navbar ─────────────────────────────────────────────────────────── */
const PricingNavbar: React.FC = () => {
  const [scrolled, setScrolled] = React.useState(false);
  const [dropOpen, setDropOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const dropRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const isMobile = useIsMobile();

  React.useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = ((user?.firstName?.slice(0, 1) ?? "") + (user?.lastName?.slice(0, 1) ?? "")).toUpperCase() || "?";

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        padding: isMobile ? "0 16px" : "0 64px",
        height: 64,
        background: scrolled || menuOpen ? "rgba(7,9,15,0.93)" : "transparent",
        backdropFilter: scrolled || menuOpen ? "blur(20px)" : "none",
        borderBottom: scrolled || menuOpen ? "1px solid rgba(255,255,255,0.07)" : "none",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all 0.3s",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/logo/lo9o.png" alt="" style={{ width: 32, height: 32, borderRadius: 9, objectFit: "contain" }} />
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: isMobile ? 16 : 19, color: "white", letterSpacing: "-0.02em" }}>LandYourJob</span>
        </a>

        {!isMobile && (
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {[{ label: "Home", href: "/" }, { label: "Extension", href: "/extension" }].map(item => (
              <a key={item.label} href={item.href} style={{ color: "#64748b", textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "white")}
                onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}>{item.label}</a>
            ))}
            <span style={{ fontSize: 14, fontWeight: 600, color: "white" }}>Pricing</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {isAuthenticated && user ? (
            <div ref={dropRef} style={{ position: "relative" }}>
              <button onClick={() => setDropOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: isMobile ? "6px 8px" : "7px 14px 7px 8px", cursor: "pointer" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#9333ea)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0 }}>{initials}</div>
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
                    <button key={i} onClick={() => { navigate(item.path); setDropOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", background: "transparent", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif", textAlign: "left" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "white"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}>
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
              <a href="/register" style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "white", padding: isMobile ? "8px 14px" : "10px 22px", borderRadius: 9, fontSize: isMobile ? 13 : 14, fontWeight: 600, textDecoration: "none", display: "inline-block", whiteSpace: "nowrap" }}>
                {isMobile ? "Join Free" : "Get Started Free"}
              </a>
            </>
          )}
          {isMobile && (
            <button onClick={() => setMenuOpen(o => !o)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px", cursor: "pointer", display: "flex", alignItems: "center", color: "white" }}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </nav>

      {isMobile && menuOpen && (
        <div style={{ position: "fixed", top: 64, left: 0, right: 0, zIndex: 999, background: "rgba(7,9,15,0.98)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 16px 20px", fontFamily: "Inter, sans-serif" }}>
          {[{ label: "Home", href: "/" }, { label: "Extension", href: "/extension" }, { label: "Pricing", href: "/pricing" }].map(item => (
            <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "12px 8px", color: "#94a3b8", textDecoration: "none", fontSize: 15, fontWeight: 500, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{item.label}</a>
          ))}
          {!isAuthenticated && <a href="/login" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "12px 8px", color: "#94a3b8", textDecoration: "none", fontSize: 15, fontWeight: 500 }}>Sign in</a>}
        </div>
      )}
    </>
  );
};

/* ─── Billing Toggle ─────────────────────────────────────────────────── */
const BillingToggle: React.FC<{ value: BillingCycle; onChange: (v: BillingCycle) => void }> = ({ value, onChange }) => {
  const annual = value === "yearly";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 48 }}>
      <span style={{ fontSize: 14, fontWeight: 500, color: annual ? "#475569" : "white", transition: "color 0.2s" }}>Monthly</span>
      <button
        onClick={() => onChange(annual ? "monthly" : "yearly")}
        style={{ width: 48, height: 26, borderRadius: 13, position: "relative", cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)", background: annual ? "white" : "rgba(255,255,255,0.1)", transition: "background 0.25s" }}
      >
        <span style={{ position: "absolute", top: 4, left: annual ? 25 : 3, width: 16, height: 16, borderRadius: "50%", background: annual ? "#07090f" : "rgba(255,255,255,0.5)", transition: "left 0.25s, background 0.25s", display: "block" }} />
      </button>
      <span style={{ fontSize: 14, fontWeight: 500, color: annual ? "white" : "#475569", transition: "color 0.2s" }}>Annual</span>
      {annual && (
        <span style={{ fontSize: 12, fontWeight: 600, color: "#34d399", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 100, padding: "3px 10px" }}>Save ~30%</span>
      )}
    </div>
  );
};

/* ─── Plan Card ──────────────────────────────────────────────────────── */
const V3PlanCard: React.FC<{
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  isMostPopular: boolean;
  discountedAmount: number | null;
  discountLabel: string | null;
  onGetStarted: () => void;
  isLoading: boolean;
}> = ({ plan, billingCycle, isMostPopular, discountedAmount, discountLabel, onGetStarted, isLoading }) => {
  const isFree = plan.amount === 0;
  const finalAmount = discountedAmount ?? plan.amount;
  const [hovered, setHovered] = React.useState(false);
  const tagline = isFree ? "Start your search" : isMostPopular ? "For serious job seekers" : "For teams & agencies";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ height: 28, display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 8 }}>
        {isMostPopular && (
          <span style={{ fontSize: 11, fontWeight: 700, color: "white", background: "linear-gradient(135deg,#7c3aed,#9333ea)", borderRadius: 100, padding: "4px 16px", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>MOST POPULAR</span>
        )}
      </div>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderRadius: 20, padding: "28px 24px",
          background: isMostPopular ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
          border: isMostPopular ? "1px solid rgba(255,255,255,0.18)" : `1px solid ${hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)"}`,
          transition: "border-color 0.2s, transform 0.2s",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          display: "flex", flexDirection: "column", flex: 1,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>{tagline}</div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 26, fontWeight: 800, color: "white" }}>{plan.plan_name}</div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 44, fontWeight: 800, color: "white", letterSpacing: "-0.03em", lineHeight: 1 }}>
              {isFree ? "₹0" : formatINR(finalAmount)}
            </span>
            <span style={{ fontSize: 14, color: "#334155", fontWeight: 500 }}>/mo</span>
          </div>
          {plan.billing_cycle === "yearly" && !isFree && <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>Billed annually · saves ~2 months</div>}
          {discountLabel && <div style={{ marginTop: 6, fontSize: 12, color: "#34d399", fontWeight: 600 }}>{discountLabel}</div>}
          {discountedAmount !== null && <div style={{ fontSize: 12, color: "#334155", textDecoration: "line-through" }}>{formatINR(plan.amount)}</div>}
          <div style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>{plan.credits_per_cycle} credits / cycle</div>
        </div>
        <button
          onClick={onGetStarted}
          disabled={isLoading}
          style={{
            width: "100%", padding: "13px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer",
            fontFamily: "Inter, sans-serif", marginBottom: 20, transition: "all 0.2s",
            background: isMostPopular ? "white" : "transparent",
            color: isMostPopular ? "#07090f" : "#94a3b8",
            border: isMostPopular ? "none" : "1px solid rgba(255,255,255,0.15)",
            opacity: isLoading ? 0.7 : 1,
          }}
          onMouseEnter={e => { if (isMostPopular) { e.currentTarget.style.background = "#e2e8f0"; } else { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; e.currentTarget.style.color = "white"; } }}
          onMouseLeave={e => { if (isMostPopular) { e.currentTarget.style.background = "white"; } else { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#94a3b8"; } }}
        >
          {isLoading ? "Processing…" : isFree ? "Get Started Free" : isMostPopular ? "Start Pro Free" : "Get Started"}
        </button>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
          {(plan.points || []).map((point, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}><CheckIcon color={isMostPopular ? "#34d399" : "#475569"} /></span>
              <span style={{ fontSize: 13, color: isMostPopular ? "#cbd5e1" : "#475569", lineHeight: 1.5 }}>{point}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Skeleton ─────────────────────────────────────────────────────── */
const CardSkeleton = () => (
  <div style={{ borderRadius: 20, padding: "28px 24px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)" }}>
    {[60, 40, 80, 100, 90, 70, 85].map((w, i) => (
      <div key={i} style={{ height: i === 0 ? 36 : 12, width: `${w}%`, borderRadius: 6, background: "rgba(255,255,255,0.06)", marginBottom: 14 }} />
    ))}
  </div>
);

/* ─── Main PricingPage ───────────────────────────────────────────────── */
export function PricingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { app_name: appName } = useAppConfig();
  const { openCheckout } = useCashfree();
  const isMobile = useIsMobile();

  const [plans, setPlans] = React.useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = React.useState(true);
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>("monthly");
  const [couponCode, setCouponCode] = React.useState("");
  const [coupon, setCoupon] = React.useState<CouponState>({ status: "idle" });
  const [processingPlanId, setProcessingPlanId] = React.useState<string | null>(null);
  const [showCoupon, setShowCoupon] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    setLoadingPlans(true);
    paymentService.getPlans()
      .then((res) => { if (active) setPlans(res.data.items || []); })
      .catch((e: any) => { toast.error(e?.message || "Failed to load plans", { duration: 5000 }); })
      .finally(() => { if (active) setLoadingPlans(false); });
    return () => { active = false; };
  }, []);

  const visiblePlans = React.useMemo(
    () => plans.filter((p) => p.amount === 0 || p.billing_cycle === billingCycle),
    [plans, billingCycle]
  );

  const mostPopularId = React.useMemo(() => {
    const paid = visiblePlans.filter((p) => p.amount > 0).sort((a, b) => a.amount - b.amount);
    return paid.length >= 2 ? paid[paid.length - 2]._id : paid[paid.length - 1]?._id ?? null;
  }, [visiblePlans]);

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;
    const targetPlanId = mostPopularId || plans[0]?._id;
    if (!targetPlanId) return;
    try {
      if (!isAuthenticated) { navigate(`/login?redirect=${encodeURIComponent("/pricing")}`); return; }
      setCoupon({ status: "applying" });
      const res = await paymentService.validateCoupon(code, targetPlanId);
      setCoupon({ status: "applied", code: res.data.code, planId: targetPlanId, original: res.data.original_amount, discounted: res.data.discounted_amount, discount: res.data.discount });
      toast.success(`Coupon ${res.data.code} applied`, { duration: 3000 });
    } catch (e: any) {
      setCoupon({ status: "error", message: e?.message || "Invalid coupon code" });
      toast.error(e?.message || "Invalid coupon code", { duration: 5000 });
    }
  };

  const getDiscountedAmountForPlan = (plan: SubscriptionPlan) => {
    if (coupon.status !== "applied") return { amount: null, label: null };
    if (coupon.planId !== plan._id) return { amount: null, label: null };
    const base = billingCycle === "yearly" ? plan.amount * 10 : plan.amount;
    const ratio = coupon.original > 0 ? coupon.discounted / coupon.original : 1;
    const discounted = Math.max(0, Math.round(base * ratio));
    return { amount: discounted, label: `Discount applied: -${Math.round((coupon.discount / coupon.original) * 100)}%` };
  };

  const startPayment = async (plan: SubscriptionPlan) => {
    try {
      if (plan.amount === 0) {
        if (!isAuthenticated) { navigate("/register"); return; }
        toast.success("You're on the Free plan!", { duration: 3000 });
        navigate("/resume");
        return;
      }
      if (!isAuthenticated) { navigate(`/login?redirect=${encodeURIComponent("/pricing")}`); return; }
      setProcessingPlanId(plan._id);
      const coupon_code = coupon.status === "applied" ? coupon.code : undefined;
      let sessionId: string, cashfreeOrderId: string;
      if (plan.is_recurring) {
        const res = await paymentService.createSubscription({ plan_id: plan._id, billing_cycle: billingCycle, is_recurring: true, coupon_code });
        if (!res.data.payment_session_id) { toast.success("Plan activated!", { duration: 3000 }); navigate(`/payment/success?plan=${encodeURIComponent(plan.plan_name)}`); return; }
        sessionId = res.data.payment_session_id; cashfreeOrderId = res.data.cashfree_order_id;
      } else {
        const orderRes = await paymentService.createOrder({ plan_id: plan._id, billing_cycle: billingCycle, is_recurring: false, coupon_code });
        sessionId = orderRes.data.payment_session_id; cashfreeOrderId = orderRes.data.cashfree_order_id;
      }
      await openCheckout({ paymentSessionId: sessionId, onFailure: (reason) => { toast.error(reason, { duration: 5000 }); } });
    } catch (e: any) {
      toast.error(e?.message || "Payment failed", { duration: 5000 });
    } finally { setProcessingPlanId(null); }
  };

  const name = appName ?? "LandYourJob";
  const cols = isMobile ? 1 : Math.min(visiblePlans.length, 3);

  return (
    <div style={{ background: "#07090f", minHeight: "100vh", color: "white", fontFamily: "Inter, sans-serif", overflowX: "hidden" }}>
      <PricingNavbar />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ paddingTop: isMobile ? 100 : 140, paddingBottom: isMobile ? 40 : 64, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "0%", left: "50%", transform: "translateX(-50%)", width: "100%", height: "100%", background: "radial-gradient(ellipse 70% 45% at 50% -10%, rgba(124,58,237,0.13) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px", position: "relative" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 16 }}>Pricing</div>
          <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: isMobile ? 34 : 56, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16, color: "white" }}>
            Pay for what<br />
            <span style={{ color: "#475569" }}>you actually use</span>
          </h1>
          <p style={{ fontSize: isMobile ? 15 : 18, color: "#334155", lineHeight: 1.75, marginBottom: isMobile ? 32 : 48 }}>
            Start free. Upgrade when you're ready. No contracts, no surprises.
          </p>
          <BillingToggle value={billingCycle} onChange={setBillingCycle} />
        </div>
      </section>

      {/* ── PLAN CARDS ──────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "0 16px 60px" : "0 80px 80px", maxWidth: 1280, margin: "0 auto" }}>
        {loadingPlans ? (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 20 }}>
            {[0, 1, 2].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 16 : 20, alignItems: "stretch" }}>
              {visiblePlans.map(plan => {
                const { amount, label } = getDiscountedAmountForPlan(plan);
                return (
                  <V3PlanCard
                    key={plan._id}
                    plan={plan}
                    billingCycle={billingCycle}
                    isMostPopular={plan._id === mostPopularId}
                    discountedAmount={amount}
                    discountLabel={label}
                    onGetStarted={() => startPayment(plan)}
                    isLoading={processingPlanId === plan._id}
                  />
                );
              })}
            </div>

            {/* Coupon */}
            <div style={{ marginTop: 32, maxWidth: 400 }}>
              <button
                onClick={() => setShowCoupon(p => !p)}
                style={{ fontSize: 13, color: "#475569", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3, fontFamily: "Inter, sans-serif" }}
              >
                Have a coupon code? Click here
              </button>
              {showCoupon && (
                <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                  <input
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value); if (coupon.status === "error") setCoupon({ status: "idle" }); }}
                    placeholder="Enter coupon code"
                    style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "white", fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none" }}
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={coupon.status === "applying"}
                    style={{ padding: "10px 20px", borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                  >
                    {coupon.status === "applying" ? "…" : "Apply"}
                  </button>
                </div>
              )}
              {coupon.status === "error" && <div style={{ marginTop: 8, fontSize: 13, color: "#f87171" }}>{coupon.message}</div>}
              {coupon.status === "applied" && <div style={{ marginTop: 8, fontSize: 13, color: "#34d399", fontWeight: 600 }}>✓ {coupon.code} applied</div>}
            </div>
          </>
        )}
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{ background: "#040608", borderTop: "1px solid rgba(255,255,255,0.05)", padding: isMobile ? "24px 20px" : "32px 80px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 12 : 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/logo/lo9o.png" alt="" style={{ width: 28, height: 28, borderRadius: 7, objectFit: "contain" }} />
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, color: "white" }}>{name}</span>
          </div>
          <span style={{ fontSize: 13, color: "#1e293b" }}>© 2026 {name}. All rights reserved.</span>
          <div style={{ display: "flex", gap: 20 }}>
            {[{ l: "Privacy", h: "/privacy-policy" }, { l: "Terms", h: "/terms" }, { l: "Contact", h: "/contact" }].map(item => (
              <a key={item.l} href={item.h} style={{ fontSize: 13, color: "#1e293b", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#475569")}
                onMouseLeave={e => (e.currentTarget.style.color = "#1e293b")}>{item.l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

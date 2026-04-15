import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutDashboard, Users, Zap, Tag, Trash2, Plus, Save, Loader2, Eye, CreditCard, Cpu, RefreshCw, EyeOff, Database, HeartHandshake, Twitter, Linkedin, Github, Facebook, Instagram, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PremiumCard } from "@/components/premium/PremiumCard";
import { StatCard } from "@/components/premium/StatCard";
import { Page } from "@/components/layout/Page";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  getAdminStats, listAdminUsers, adjustUserCredits,
  listFeatureCosts, updateFeatureCost,
  listAdminCoupons, createAdminCoupon, deleteAdminCoupon, getCouponUsage,
  getUserCreditsLog, getUserBilling,
  getAdminAnalytics,
  getGeminiResource, updateGeminiConfig, listGeminiModels, getMongoDBResource,
  getJSearchResource, getJSearchDailyFeed,
  getDefaultCredits, updateDefaultCredits,
  listAdminPlans, updateAdminPlan, deleteAdminPlan,
  getAppConfig, updateAppConfig,
  AdminStats, AdminUser, FeatureCost, AdminCoupon, CreateCouponData, CouponUsageEntry,
  AdminCreditLogEntry, AdminUserBilling,
  AnalyticsData, AnalyticsPeriod,
  GeminiResource, GeminiModel, MongoDBResource, JSearchResource,
  DailyFeedEntry, DailyFeedData, AdminPlan,
  AppConfig, Collaborator,
} from "@/services/adminService";
import { AvatarGroup } from "@/components/AvatarGroup";

type Tab = "overview" | "features" | "users" | "coupons" | "resources" | "plans" | "support";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview",   label: "Overview",        icon: LayoutDashboard },
  { id: "features",   label: "Feature Credits", icon: Zap },
  { id: "plans",      label: "Plans & Pricing", icon: CreditCard },
  { id: "users",      label: "Users",           icon: Users },
  { id: "coupons",    label: "Coupons",         icon: Tag },
  { id: "resources",  label: "Resources",       icon: Cpu },
  { id: "support",    label: "Support",         icon: HeartHandshake },
];

// ── Helpers ───────────────────────────────────────────────

const PERIODS: { id: AnalyticsPeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
];

const CHART_COLORS = {
  sessions: "#6366f1",
  users: "#10b981",
  pageviews: "#f59e0b",
  pie1: "#6366f1",
  pie2: "#10b981",
  pie3: "#f59e0b",
  pie4: "#ef4444",
};

function fmtDuration(secs: number): string {
  if (secs < 60) return `${Math.round(secs)}s`;
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}m ${s}s`;
}

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--background))",
  color: "hsl(var(--foreground))",
};

// ── Overview ──────────────────────────────────────────────

function OverviewTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const period = (searchParams.get("period") as AnalyticsPeriod) || "today";
  const setPeriod = (p: AnalyticsPeriod) =>
    setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set("period", p); return next; });
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => toast.error("Failed to load stats"))
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    setLoadingAnalytics(true);
    getAdminAnalytics(period)
      .then(setAnalytics)
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoadingAnalytics(false));
  }, [period]);

  return (
    <div className="space-y-5">
      {/* App stat cards */}
      {loadingStats ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Users" value={stats.total_users} />
          <StatCard label="Credits in System" value={stats.total_credits_in_system.toLocaleString()} />
          <StatCard label="Active Coupons" value={stats.active_coupons} />
          <StatCard label="Features Tracked" value={stats.total_features} />
        </div>
      ) : null}

      {/* GA header: live dot + period toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Google Analytics</span>
          {analytics && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              {analytics.realtime_users} live now
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-all",
                period === p.id
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loadingAnalytics ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : analytics ? (
        <div className="space-y-4">
          {/* Summary metric strip */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Sessions" value={analytics.summary.sessions.toLocaleString()} />
            <StatCard label="Users" value={analytics.summary.users.toLocaleString()} />
            <StatCard label="Page Views" value={analytics.summary.pageviews.toLocaleString()} />
            <StatCard label="New Users" value={analytics.summary.new_users.toLocaleString()} />
            <StatCard label="Bounce Rate" value={`${analytics.summary.bounce_rate}%`} />
            <StatCard label="Avg Session" value={fmtDuration(analytics.summary.avg_session_duration)} />
          </div>

          {/* Row 1: Sessions+Users trend | Top Pages */}
          <div className="grid gap-4 lg:grid-cols-2">
            <PremiumCard hover={false}>
              <p className="text-sm font-medium mb-4">Sessions &amp; Users</p>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={analytics.trend} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="sessions" name="Sessions" fill={CHART_COLORS.sessions} radius={[3, 3, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="users" name="Users" fill={CHART_COLORS.users} radius={[3, 3, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </PremiumCard>

            <PremiumCard hover={false}>
              <p className="text-sm font-medium mb-4">Top Pages</p>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={analytics.top_pages}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="page"
                    type="category"
                    tick={{ fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    width={110}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="views" name="Views" fill={CHART_COLORS.sessions} radius={[0, 3, 3, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </PremiumCard>
          </div>

          {/* Row 2: Page Views trend | New vs Returning | Devices */}
          <div className="grid gap-4 lg:grid-cols-3">
            <PremiumCard hover={false}>
              <p className="text-sm font-medium mb-4">Page Views</p>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={analytics.trend} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="pageviews" name="Page Views" fill={CHART_COLORS.pageviews} radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </PremiumCard>

            <PremiumCard hover={false}>
              <p className="text-sm font-medium mb-2">New vs Returning</p>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={analytics.new_vs_returning}
                    dataKey="sessions"
                    nameKey="type"
                    cx="50%"
                    cy="45%"
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {analytics.new_vs_returning.map((_, i) => (
                      <Cell
                        key={i}
                        fill={[CHART_COLORS.pie1, CHART_COLORS.pie2][i % 2]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </PremiumCard>

            <PremiumCard hover={false}>
              <p className="text-sm font-medium mb-2">Devices</p>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={analytics.devices}
                    dataKey="sessions"
                    nameKey="device"
                    cx="50%"
                    cy="45%"
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {analytics.devices.map((_, i) => (
                      <Cell
                        key={i}
                        fill={[CHART_COLORS.pie1, CHART_COLORS.pie2, CHART_COLORS.pie3, CHART_COLORS.pie4][i % 4]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </PremiumCard>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Feature Credits ───────────────────────────────────────

function FeaturesTab() {
  const [features, setFeatures] = useState<FeatureCost[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listFeatureCosts().then(setFeatures).catch(() => toast.error("Failed to load features")).finally(() => setLoading(false));
  }, []);

  const handleSave = async (feature: string) => {
    const val = parseFloat(edits[feature] ?? "");
    if (isNaN(val) || val < 0) { toast.error("Enter a valid non-negative number"); return; }
    setSaving((s) => ({ ...s, [feature]: true }));
    try {
      await updateFeatureCost(feature, val);
      setFeatures((prev) => prev.map((f) => f.feature === feature ? { ...f, credits_per_unit: val } : f));
      setEdits((e) => { const n = { ...e }; delete n[feature]; return n; });
      toast.success(`${feature} updated to ${val} credits`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update");
    } finally {
      setSaving((s) => ({ ...s, [feature]: false }));
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <PremiumCard className="overflow-hidden" hover={false}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Feature</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Description</th>
            <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Unit</th>
            <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Current Cost</th>
            <th className="text-right px-4 py-3 font-semibold text-muted-foreground">New Cost</th>
            <th className="text-right px-4 py-3 font-semibold text-muted-foreground"></th>
          </tr>
        </thead>
        <tbody>
          {features.map((f) => (
            <tr key={f.feature} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3">
                <div className="font-medium text-sm">{f.display_name || f.feature}</div>
                <div className="font-mono text-xs text-muted-foreground mt-0.5">{f.feature}</div>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs">{f.description || "—"}</td>
              <td className="px-4 py-3 text-center text-xs text-muted-foreground">{f.unit || "—"}</td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {f.credits_per_unit} cr
                </span>
              </td>
              <td className="px-4 py-3">
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={edits[f.feature] ?? ""}
                  onChange={(e) => setEdits((prev) => ({ ...prev, [f.feature]: e.target.value }))}
                  placeholder={String(f.credits_per_unit)}
                  className="h-8 w-24 ml-auto text-right"
                />
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSave(f.feature)}
                  disabled={!edits[f.feature] || saving[f.feature]}
                  className="h-8"
                >
                  {saving[f.feature] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Save
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </PremiumCard>
  );
}

// ── Users ─────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [creditsLogModal, setCreditsLogModal] = useState<{ userId: string; email: string; entries: AdminCreditLogEntry[] } | null>(null);
  const [loadingLog, setLoadingLog] = useState(false);
  const [billingModal, setBillingModal] = useState<{ email: string; data: AdminUserBilling } | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);

  useEffect(() => {
    listAdminUsers().then((r) => setUsers(r.items)).catch(() => toast.error("Failed to load users")).finally(() => setLoading(false));
  }, []);

  const handleAdjust = async (userId: string) => {
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount === 0) { toast.error("Enter a non-zero amount"); return; }
    setSaving(true);
    try {
      await adjustUserCredits(userId, amount, form.reason);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, credits: Math.max(0, u.credits + amount) } : u));
      toast.success(`Credits ${amount > 0 ? "added" : "deducted"} successfully`);
      setAdjusting(null);
      setForm({ amount: "", reason: "" });
    } catch (e: any) {
      toast.error(e?.message || "Failed to adjust credits");
    } finally {
      setSaving(false);
    }
  };

  const handleViewBilling = async (user: AdminUser) => {
    setBillingModal({ email: user.email, data: { subscription: null, billing_history: [] } });
    setLoadingBilling(true);
    try {
      const data = await getUserBilling(user._id);
      setBillingModal({ email: user.email, data });
    } catch {
      toast.error("Failed to load billing info");
    } finally {
      setLoadingBilling(false);
    }
  };

  const handleViewCreditsLog = async (user: AdminUser) => {
    setCreditsLogModal({ userId: user._id, email: user.email, entries: [] });
    setLoadingLog(true);
    try {
      const entries = await getUserCreditsLog(user._id);
      setCreditsLogModal((prev) => prev ? { ...prev, entries } : null);
    } catch {
      toast.error("Failed to load credits log");
    } finally {
      setLoadingLog(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <>
    <PremiumCard className="overflow-hidden" hover={false}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Email</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Name</th>
            <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Credits</th>
            <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <React.Fragment key={u._id}>
              <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-xs font-mono">{u.email}</td>
                <td className="px-4 py-3 hidden md:table-cell">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-center font-semibold">{u.credits}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      title="View credits history"
                      onClick={() => handleViewCreditsLog(u)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      title="View billing info"
                      onClick={() => handleViewBilling(u)}
                    >
                      <CreditCard className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setAdjusting(adjusting === u._id ? null : u._id)}
                    >
                      Adjust Credits
                    </Button>
                  </div>
                </td>
              </tr>
              {adjusting === u._id && (
                <tr className="border-b border-border bg-muted/10">
                  <td colSpan={4} className="px-4 py-3">
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <Input
                        type="number"
                        placeholder="Amount (+add / -deduct)"
                        value={form.amount}
                        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                        className="h-8 w-40 text-sm"
                      />
                      <Input
                        type="text"
                        placeholder="Reason (optional)"
                        value={form.reason}
                        onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                        className="h-8 flex-1 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="gradient" className="h-8" onClick={() => handleAdjust(u._id)} disabled={saving}>
                          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => { setAdjusting(null); setForm({ amount: "", reason: "" }); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </PremiumCard>

    {/* Billing modal */}
    {billingModal && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-xl shadow-xl border border-border w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base font-mono">{billingModal.email}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Billing information</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setBillingModal(null)}>✕</Button>
          </div>
          <div className="overflow-auto flex-1 p-6 space-y-6">
            {loadingBilling ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                {/* Current subscription */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Current Subscription</h4>
                  {billingModal.data.subscription ? (
                    <div className="rounded-lg border border-border p-4 grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground text-xs">Plan</span><p className="font-semibold">{billingModal.data.subscription.plan_name || "—"}</p></div>
                      <div><span className="text-muted-foreground text-xs">Status</span><p className="font-semibold capitalize">{billingModal.data.subscription.status}</p></div>
                      <div><span className="text-muted-foreground text-xs">Amount</span><p className="font-semibold">{billingModal.data.subscription.currency?.toUpperCase()} {billingModal.data.subscription.amount_paid}</p></div>
                      <div><span className="text-muted-foreground text-xs">Billing Cycle</span><p className="font-semibold capitalize">{billingModal.data.subscription.billing_cycle || "—"}</p></div>
                      {billingModal.data.subscription.renewal_date && (
                        <div><span className="text-muted-foreground text-xs">Renews</span><p className="font-semibold">{new Date(billingModal.data.subscription.renewal_date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</p></div>
                      )}
                      {billingModal.data.subscription.cancelled_at && (
                        <div><span className="text-muted-foreground text-xs">Cancelled</span><p className="font-semibold text-red-500">{new Date(billingModal.data.subscription.cancelled_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</p></div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No active subscription.</p>
                  )}
                </div>

                {/* Billing history */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Payment History</h4>
                  {billingModal.data.billing_history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payment records.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Plan</th>
                          <th className="text-center px-3 py-2 font-semibold text-muted-foreground">Amount</th>
                          <th className="text-center px-3 py-2 font-semibold text-muted-foreground hidden sm:table-cell">Status</th>
                          <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingModal.data.billing_history.map((entry, i) => {
                          const isSuccess = entry.payment_status === "succeeded";
                          return (
                            <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20">
                              <td className="px-3 py-2.5 font-medium">
                                {entry.invoice_url ? (
                                  <a href={entry.invoice_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{entry.plan_name}</a>
                                ) : entry.plan_name}
                              </td>
                              <td className="px-3 py-2.5 text-center tabular-nums">{entry.currency?.toUpperCase()} {entry.amount}</td>
                              <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", isSuccess ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400")}>
                                  {entry.payment_status}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-right text-xs text-muted-foreground">
                                {entry.payment_date ? new Date(entry.payment_date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Credits log modal */}
    {creditsLogModal && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-xl shadow-xl border border-border w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base font-mono">{creditsLogModal.email}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Credits activity log</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setCreditsLogModal(null)}>✕</Button>
          </div>
          <div className="overflow-auto flex-1">
            {loadingLog ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : creditsLogModal.entries.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">No credit activity yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Feature</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Credits</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Balance After</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {creditsLogModal.entries.map((entry, i) => {
                    const isDeduction = entry.type === "deduction";
                    const sign = isDeduction ? "−" : "+";
                    const color = isDeduction ? "text-red-500" : "text-green-500";
                    return (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-medium">{entry.display_name || entry.feature}</td>
                        <td className={cn("px-4 py-2.5 text-center font-semibold tabular-nums", color)}>
                          {sign}{entry.amount} cr
                        </td>
                        <td className="px-4 py-2.5 text-center text-xs text-muted-foreground hidden sm:table-cell tabular-nums">
                          {entry.balance_after} cr
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ── Coupons ───────────────────────────────────────────────

const EMPTY_COUPON: CreateCouponData = {
  code: "",
  coupon_type: "individual",
  applicable_to_email: "",
  applicable_to_domains: [],
  discount_percent: undefined,
  discount_amount: undefined,
  max_uses: undefined,
  expires_at: undefined,
  is_active: true,
};

function CouponsTab() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateCouponData>(EMPTY_COUPON);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [domainInput, setDomainInput] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [usageModal, setUsageModal] = useState<{ couponId: string; couponCode: string; entries: CouponUsageEntry[] } | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const loadCoupons = () => {
    setLoading(true);
    listAdminCoupons(false).then((r) => setCoupons(r.items)).catch(() => toast.error("Failed to load coupons")).finally(() => setLoading(false));
  };

  useEffect(loadCoupons, []);

  const handleCreate = async () => {
    if (!form.code.trim()) { toast.error("Code is required"); return; }
    if (discountType === "percent" && (!form.discount_percent || form.discount_percent <= 0)) { toast.error("Enter a valid discount percent"); return; }
    if (discountType === "amount" && (!form.discount_amount || form.discount_amount <= 0)) { toast.error("Enter a valid discount amount"); return; }
    if (form.coupon_type === "individual" && !form.applicable_to_email?.trim()) { toast.error("Enter the user's email for individual coupon"); return; }
    if (form.coupon_type === "domain" && (!form.applicable_to_domains || form.applicable_to_domains.length === 0)) { toast.error("Enter at least one domain"); return; }

    const payload: CreateCouponData = {
      ...form,
      code: form.code.toUpperCase().trim(),
      discount_percent: discountType === "percent" ? form.discount_percent : undefined,
      discount_amount: discountType === "amount" ? form.discount_amount : undefined,
    };

    setSaving(true);
    try {
      await createAdminCoupon(payload);
      toast.success(`Coupon ${payload.code} created`);
      setShowForm(false);
      setForm(EMPTY_COUPON);
      setDomainInput("");
      loadCoupons();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    setDeleting(id);
    try {
      await deleteAdminCoupon(id);
      toast.success(`Coupon ${code} deleted`);
      setCoupons((prev) => prev.filter((c) => c._id !== id));
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const handleViewUsage = async (coupon: AdminCoupon) => {
    setUsageModal({ couponId: coupon._id, couponCode: coupon.code, entries: [] });
    setLoadingUsage(true);
    try {
      const entries = await getCouponUsage(coupon._id);
      setUsageModal((prev) => prev ? { ...prev, entries } : null);
    } catch {
      toast.error("Failed to load usage data");
    } finally {
      setLoadingUsage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="flex justify-end">
        <Button variant="gradient" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "New Coupon"}
        </Button>
      </div>

      {showForm && (
        <PremiumCard className="p-6 space-y-4" hover={false}>
          <h3 className="font-semibold text-base">Create coupon</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Code</label>
              <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="PROMO20" className="font-mono uppercase" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
              <select
                value={form.coupon_type}
                onChange={(e) => setForm((f) => ({ ...f, coupon_type: e.target.value as "individual" | "domain" | "public" }))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="individual">Individual (specific user)</option>
                <option value="domain">Domain (email domain)</option>
                <option value="public">Public (anyone)</option>
              </select>
            </div>

            {form.coupon_type === "individual" ? (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">User email</label>
                <Input
                  type="email"
                  value={form.applicable_to_email ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, applicable_to_email: e.target.value }))}
                  placeholder="user@example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">The coupon will only work for this specific user.</p>
              </div>
            ) : form.coupon_type === "domain" ? (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Domains (comma-separated, e.g. gmail.com)</label>
                <Input
                  value={domainInput}
                  onChange={(e) => {
                    setDomainInput(e.target.value);
                    setForm((f) => ({ ...f, applicable_to_domains: e.target.value.split(",").map((d) => d.trim()).filter(Boolean) }));
                  }}
                  placeholder="university.edu, company.com"
                />
              </div>
            ) : (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground py-2">Anyone with this code can use it. Use max uses to cap total redemptions.</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Discount type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "percent" | "amount")}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="percent">Percentage (%)</option>
                <option value="amount">Fixed amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {discountType === "percent" ? "Discount %" : "Discount amount (₹)"}
              </label>
              <Input
                type="number"
                min={0}
                max={discountType === "percent" ? 100 : undefined}
                value={discountType === "percent" ? (form.discount_percent ?? "") : (form.discount_amount ?? "")}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || undefined;
                  setForm((f) => discountType === "percent" ? { ...f, discount_percent: val } : { ...f, discount_amount: val });
                }}
                placeholder={discountType === "percent" ? "20" : "100"}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Max uses (optional)</label>
              <Input
                type="number"
                min={1}
                value={form.max_uses ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, max_uses: parseInt(e.target.value) || undefined }))}
                placeholder="Unlimited"
              />
              <p className="text-xs text-muted-foreground mt-1">Total times this code can be redeemed across all users. Leave blank = unlimited.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Expires at (optional)</label>
              <Input
                type="datetime-local"
                value={form.expires_at ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value || undefined }))}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="gradient" onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create coupon
            </Button>
          </div>
        </PremiumCard>
      )}

      {/* Coupons list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : coupons.length === 0 ? (
        <PremiumCard className="p-8 text-center text-muted-foreground" hover={false}>No coupons yet.</PremiumCard>
      ) : (
        <PremiumCard className="overflow-hidden" hover={false}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Type</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Discount</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Uses</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-xs">{c.code}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{c.coupon_type}</td>
                  <td className="px-4 py-3 text-center text-xs font-medium">
                    {c.discount_percent != null ? `${c.discount_percent}%` : c.discount_amount != null ? `₹${c.discount_amount}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-xs hidden md:table-cell">
                    {c.uses_count}{c.max_uses ? `/${c.max_uses}` : ""}
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", c.is_active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground")}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7"
                        onClick={() => handleViewUsage(c)}
                        title="View usage"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(c._id, c.code)}
                        disabled={deleting === c._id}
                      >
                        {deleting === c._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PremiumCard>
      )}

      {/* Usage modal */}
      {usageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-xl border border-border w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base font-mono">{usageModal.couponCode}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Redemption history</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setUsageModal(null)}>✕</Button>
            </div>
            <div className="overflow-auto flex-1">
              {loadingUsage ? (
                <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : usageModal.entries.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-12">No redemptions yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">User</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Plan</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Discount</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Type</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageModal.entries.map((entry, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <div className="text-xs font-mono">{entry.user_email}</div>
                          {entry.user_name && <div className="text-xs text-muted-foreground mt-0.5">{entry.user_name}</div>}
                        </td>
                        <td className="px-4 py-3 text-xs hidden sm:table-cell">{entry.plan_id}</td>
                        <td className="px-4 py-3 text-center text-xs font-medium">₹{entry.discount_applied.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center text-xs hidden md:table-cell">{entry.payment_type}</td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Resources Tab ─────────────────────────────────────────

type ResourceSubTab = "google" | "mongodb" | "vercel" | "jsearch";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ── Google sub-tab ─────────────────────────────────────────

function GoogleResourcePanel() {
  const [data, setData] = useState<GeminiResource | null>(null);
  const [models, setModels] = useState<GeminiModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([getGeminiResource(), listGeminiModels()])
      .then(([res, mods]) => {
        setData(res);
        setModels(mods);
        setApiKey(res.api_key_full || "");
        setSelectedModel(res.model);
      })
      .catch(() => toast.error("Failed to load Gemini data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const update: Record<string, string> = {};
      if (apiKey && apiKey !== data?.api_key_full) update.api_key = apiKey;
      if (selectedModel !== data?.model) update.model = selectedModel;
      if (Object.keys(update).length === 0) { toast.info("Nothing changed"); return; }
      await updateGeminiConfig(update);
      toast.success("Config saved — applied immediately");
      load();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  const usagePct = data ? Math.min(100, Math.round((data.today_usage / data.daily_limit) * 100)) : 0;
  const usageColor = usagePct >= 90 ? "#ef4444" : usagePct >= 70 ? "#f97316" : "#10b981";
  const activeModel = models.find((m) => m.id === (data?.model ?? ""));

  return (
    <PremiumCard className="p-6" hover={false}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Cpu className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Gemini API</h2>
            {data?.updated_by && (
              <p className="text-xs text-muted-foreground">
                Last updated by {data.updated_by}
                {data.updated_at ? ` · ${new Date(data.updated_at).toLocaleString()}` : ""}
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={load} title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">API Key</label>
            <div className="flex gap-2">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="font-mono text-sm"
              />
              <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)}>
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Active Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full" variant="gradient">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : <><Save className="h-4 w-4 mr-2" />Save Config</>}
          </Button>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-3">Today's Usage</p>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold" style={{ color: usageColor }}>{data?.today_usage ?? 0}</span>
            <span className="text-sm text-muted-foreground mb-1">/ {data?.daily_limit ?? 1500} req/day</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden mb-1">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${usagePct}%`, background: usageColor }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{usagePct}% used · {activeModel?.rpm ?? "—"} RPM limit</p>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-medium text-muted-foreground mb-3">Available Models (Free Tier)</p>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Model</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Req/Day</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Req/Min</th>
                <th className="px-4 py-2 text-xs font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id} className={cn("border-b border-border last:border-0", m.id === data?.model && "bg-primary/5")}>
                  <td className="px-4 py-2.5 font-medium">{m.name}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{m.rpd.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{m.rpm}</td>
                  <td className="px-4 py-2.5 text-right">
                    {m.id === data?.model ? (
                      <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />Active
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2"
                        disabled={saving}
                        onClick={async () => {
                          setSelectedModel(m.id);
                          setSaving(true);
                          try {
                            await updateGeminiConfig({ model: m.id });
                            toast.success(`Switched to ${m.name}`);
                            load();
                          } catch (e: any) {
                            toast.error(e.message || "Switch failed");
                          } finally {
                            setSaving(false);
                          }
                        }}
                      >
                        Switch
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data?.usage_history && data.usage_history.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium text-muted-foreground mb-3">30-Day Usage</p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={data.usage_history} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [v, "Requests"]}
                labelFormatter={(l) => l}
              />
              <Bar dataKey="count" fill="#667eea" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </PremiumCard>
  );
}

// ── MongoDB sub-tab ────────────────────────────────────────

function MongoDBResourcePanel() {
  const [data, setData] = useState<MongoDBResource | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getMongoDBResource()
      .then(setData)
      .catch(() => toast.error("Failed to load MongoDB stats"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (!data) return null;

  const storagePct = Math.min(100, Math.round((data.storage_size_bytes / data.free_tier_limit_bytes) * 100));
  const storageColor = storagePct >= 90 ? "#ef4444" : storagePct >= 70 ? "#f97316" : "#10b981";

  return (
    <div className="space-y-6">
      <PremiumCard className="p-6" hover={false}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Database className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold">MongoDB Atlas</h2>
              <p className="text-xs text-muted-foreground">Database: {data.db_name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={load} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Storage gauge */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">Storage Usage (Free Tier: 512 MB)</p>
            <span className="text-xs font-medium" style={{ color: storageColor }}>{storagePct}%</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${storagePct}%`, background: storageColor }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">{formatBytes(data.storage_size_bytes)} used</span>
            <span className="text-xs text-muted-foreground">{formatBytes(data.free_tier_limit_bytes)} total</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Collections", value: data.collections },
            { label: "Documents", value: data.objects.toLocaleString() },
            { label: "Data Size", value: formatBytes(data.data_size_bytes) },
            { label: "Index Size", value: formatBytes(data.index_size_bytes) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-border bg-muted/20 px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-lg font-bold tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        {/* Per-collection table */}
        {data.collection_details.length > 0 && (
          <>
            <p className="text-xs font-medium text-muted-foreground mb-3">Collections</p>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Collection</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Documents</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Data Size</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Storage</th>
                  </tr>
                </thead>
                <tbody>
                  {data.collection_details.map((col) => (
                    <tr key={col.name} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-mono text-xs">{col.name}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{col.count.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatBytes(col.size_bytes)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatBytes(col.storage_bytes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </PremiumCard>
    </div>
  );
}

// ── Vercel sub-tab ─────────────────────────────────────────

function VercelResourcePanel() {
  return (
    <PremiumCard className="p-6" hover={false}>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-foreground/10 flex items-center justify-center">
          <span className="text-base">▲</span>
        </div>
        <div>
          <h2 className="text-base font-semibold">Vercel</h2>
          <p className="text-xs text-muted-foreground">Deployment & bandwidth usage</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
        Bandwidth, build minutes, and deployment history — coming soon.
      </p>
    </PremiumCard>
  );
}

// ── Site badge colour ────────────────────────────────────────
const SITE_COLORS: Record<string, string> = {
  jsearch:  "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  indeed:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  linkedin: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  naukri:   "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  google:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};
const siteBadge = (site: string) =>
  SITE_COLORS[site.toLowerCase()] ?? "bg-muted text-muted-foreground";

// ── Collapsible feed entry card ───────────────────────────────
function FeedEntryCard({ entry }: { entry: DailyFeedEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            <span className="text-muted-foreground text-xs mr-2">{entry.user_email}</span>
            {entry.search_term}
            <span className="text-muted-foreground font-normal"> · {entry.location}</span>
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground">{entry.total_jobs} jobs</span>
            {Object.entries(entry.site_breakdown).map(([site, cnt]) => (
              <span key={site} className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${siteBadge(site)}`}>
                {site} {cnt}
              </span>
            ))}
          </div>
        </div>
        <span className="text-xs text-muted-foreground shrink-0 ml-4">
          {new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {open ? " ▲" : " ▼"}
        </span>
      </button>

      {/* Expanded job list */}
      {open && (
        <div className="divide-y divide-border">
          {entry.jobs.map((job, i) => (
            <div key={i} className="px-4 py-2.5 flex items-start gap-3 hover:bg-muted/20 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={job.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline text-foreground truncate"
                  >
                    {job.title}
                  </a>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${siteBadge(job.site)}`}>
                    {job.site}
                  </span>
                  {job.is_remote && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 font-medium shrink-0">
                      Remote
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {job.company} · {job.location}
                </p>
                {job.description_summary && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{job.description_summary}</p>
                )}
              </div>
              {job.fit_score > 0 && (
                <span className={`text-xs font-bold shrink-0 px-2 py-1 rounded-md ${
                  job.fit_score >= 80 ? "bg-green-100 text-green-700" :
                  job.fit_score >= 60 ? "bg-yellow-100 text-yellow-700" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {job.fit_score}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── JSearch / RapidAPI sub-tab ──────────────────────────────

function JSearchResourcePanel() {
  const [data, setData] = useState<JSearchResource | null>(null);
  const [loading, setLoading] = useState(true);

  // Daily feed state
  const [feedDate, setFeedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [feedData, setFeedData] = useState<DailyFeedData | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedPage, setFeedPage] = useState(1);

  const load = () => {
    setLoading(true);
    getJSearchResource()
      .then(setData)
      .catch(() => toast.error("Failed to load JSearch data"))
      .finally(() => setLoading(false));
  };

  const loadFeed = (date: string, page: number) => {
    setFeedLoading(true);
    getJSearchDailyFeed(date, page)
      .then(d => { setFeedData(d); setFeedPage(page); })
      .catch(() => toast.error("Failed to load daily feed"))
      .finally(() => setFeedLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { loadFeed(feedDate, 1); }, [feedDate]);

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  const callsToday = data?.calls_today ?? 0;
  const limit      = data?.requests_limit ?? 200;
  const remaining  = data?.requests_remaining ?? 200;
  const usagePct   = Math.min(100, Math.round((callsToday / limit) * 100));
  const usageColor = usagePct >= 90 ? "#ef4444" : usagePct >= 70 ? "#f97316" : "#10b981";

  // Quick date buttons
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      {/* ── Quota card ── */}
      <PremiumCard className="p-6" hover={false}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">🔍</div>
            <div>
              <h2 className="text-base font-semibold">JSearch API (RapidAPI)</h2>
              {data?.last_updated && (
                <p className="text-xs text-muted-foreground">
                  Last call: {new Date(data.last_updated).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={load} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">API Key</label>
          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{data?.api_key_masked || "—"}</code>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-muted/40 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: usageColor }}>{callsToday}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Calls Today</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{remaining}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Remaining</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{limit}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Daily Limit</p>
          </div>
        </div>

        <div className="mb-5">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Usage today</span><span>{usagePct}%</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${usagePct}%`, backgroundColor: usageColor }} />
          </div>
          {data?.requests_reset && (
            <p className="text-xs text-muted-foreground mt-1">Resets: {data.requests_reset}</p>
          )}
        </div>

        {data && data.usage_history.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">30-Day Call History</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={data.usage_history} barSize={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} width={28} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [v, "Calls"]} />
                <Bar dataKey="calls" fill={usageColor} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          Free tier: 200 requests/day. Upgrade at rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch.
        </p>
      </PremiumCard>

      {/* ── Daily Recommended Jobs viewer ── */}
      <PremiumCard className="p-6" hover={false}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold">Daily Recommended Jobs</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Jobs fetched by the 6 AM cron for each user
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => loadFeed(feedDate, feedPage)} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Date selector */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            type="button"
            onClick={() => setFeedDate(today)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium border transition-colors",
              feedDate === today
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setFeedDate(yesterday)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium border transition-colors",
              feedDate === yesterday
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            Yesterday
          </button>
          <input
            type="date"
            value={feedDate}
            max={today}
            onChange={(e) => setFeedDate(e.target.value)}
            className="h-8 px-2 text-sm rounded-md border border-border bg-background text-foreground"
          />
          {feedData && (
            <span className="text-xs text-muted-foreground ml-auto">
              {feedData.total} feed entries
            </span>
          )}
        </div>

        {feedLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : feedData && feedData.entries.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No jobs were recommended on {feedDate}.<br />
            <span className="text-xs">Cron runs at 6 AM IST. If users have no job preferences or past searches, nothing is fetched.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {feedData?.entries.map((entry, i) => (
              <FeedEntryCard key={i} entry={entry} />
            ))}

            {/* Pagination */}
            {feedData && feedData.total_pages > 1 && (
              <div className="flex justify-center items-center gap-3 pt-2">
                <Button
                  variant="outline" size="sm"
                  disabled={feedPage === 1}
                  onClick={() => loadFeed(feedDate, feedPage - 1)}
                >
                  ← Prev
                </Button>
                <span className="text-xs text-muted-foreground">
                  {feedPage} / {feedData.total_pages}
                </span>
                <Button
                  variant="outline" size="sm"
                  disabled={feedPage === feedData.total_pages}
                  onClick={() => loadFeed(feedDate, feedPage + 1)}
                >
                  Next →
                </Button>
              </div>
            )}
          </div>
        )}
      </PremiumCard>
    </div>
  );
}

// ── Plans & Pricing Tab ───────────────────────────────────────

function PlansTab() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultCredits, setDefaultCredits] = useState<number>(150);
  const [creditsInput, setCreditsInput] = useState<string>("150");
  const [savingCredits, setSavingCredits] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<AdminPlan>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([listAdminPlans(), getDefaultCredits()]);
      setPlans(p);
      setDefaultCredits(c);
      setCreditsInput(String(c));
    } catch { toast.error("Failed to load plans"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSaveCredits = async () => {
    const val = parseFloat(creditsInput);
    if (isNaN(val) || val < 0) { toast.error("Enter a valid number"); return; }
    setSavingCredits(true);
    try {
      const updated = await updateDefaultCredits(val);
      setDefaultCredits(updated);
      toast.success("Default signup credits updated");
    } catch { toast.error("Failed to update"); }
    finally { setSavingCredits(false); }
  };

  const startEdit = (plan: AdminPlan) => {
    setEditingId(plan._id);
    setEditDraft({
      plan_name: plan.plan_name,
      amount: plan.amount,
      credits_per_cycle: plan.credits_per_cycle,
      points: plan.points ?? [],
      is_active: plan.is_active,
      description: plan.description ?? "",
    });
  };

  const handleSavePlan = async (id: string) => {
    setSaving(true);
    try {
      await updateAdminPlan(id, editDraft);
      toast.success("Plan updated");
      setEditingId(null);
      load();
    } catch { toast.error("Failed to save plan"); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async (plan: AdminPlan) => {
    try {
      await updateAdminPlan(plan._id, { is_active: !plan.is_active });
      toast.success(plan.is_active ? "Plan deactivated" : "Plan activated");
      load();
    } catch { toast.error("Failed to toggle plan"); }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Default Signup Credits ── */}
      <PremiumCard className="p-6" hover={false}>
        <h2 className="text-base font-semibold mb-1">Default Signup Credits</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Credits given to every new user when they register. Currently <strong>{defaultCredits}</strong>.
        </p>
        <div className="flex items-center gap-3 max-w-sm">
          <Input
            type="number"
            min="0"
            value={creditsInput}
            onChange={(e) => setCreditsInput(e.target.value)}
            className="w-36"
          />
          <Button onClick={handleSaveCredits} disabled={savingCredits}>
            {savingCredits ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </PremiumCard>

      {/* ── Plan Editor ── */}
      <PremiumCard className="p-6" hover={false}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold">Plans & Pricing</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Edit price, credits, features, and active status</p>
          </div>
          <Button variant="ghost" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>

        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={cn(
                "border rounded-xl overflow-hidden",
                plan.is_active ? "border-border" : "border-border/40 opacity-60",
              )}
            >
              {/* Plan header */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    plan.is_active
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-muted text-muted-foreground",
                  )}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </span>
                  <span className="font-semibold text-sm">{plan.plan_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {plan.currency} {plan.amount} / {plan.billing_cycle}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => handleToggleActive(plan)}
                    className="text-xs h-7"
                  >
                    {plan.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => editingId === plan._id ? setEditingId(null) : startEdit(plan)}
                    className="text-xs h-7"
                  >
                    {editingId === plan._id ? "Cancel" : "Edit"}
                  </Button>
                </div>
              </div>

              {/* Edit form */}
              {editingId === plan._id && (
                <div className="px-4 py-4 space-y-4 bg-background">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Plan Name</label>
                      <Input
                        value={editDraft.plan_name ?? ""}
                        onChange={(e) => setEditDraft(d => ({ ...d, plan_name: e.target.value }))}
                        className="text-sm h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Price ({plan.currency})
                      </label>
                      <Input
                        type="number" min="0" step="0.01"
                        value={editDraft.amount ?? 0}
                        onChange={(e) => setEditDraft(d => ({ ...d, amount: parseFloat(e.target.value) || 0 }))}
                        className="text-sm h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Credits / Cycle</label>
                      <Input
                        type="number" min="0"
                        value={editDraft.credits_per_cycle ?? 0}
                        onChange={(e) => setEditDraft(d => ({ ...d, credits_per_cycle: parseFloat(e.target.value) || 0 }))}
                        className="text-sm h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
                      <Input
                        value={editDraft.description ?? ""}
                        onChange={(e) => setEditDraft(d => ({ ...d, description: e.target.value }))}
                        className="text-sm h-8"
                      />
                    </div>
                  </div>

                  {/* Points editor */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Feature Points (one per line)
                    </label>
                    <textarea
                      rows={4}
                      value={(editDraft.points ?? []).join("\n")}
                      onChange={(e) => setEditDraft(d => ({
                        ...d,
                        points: e.target.value.split("\n").map(s => s.trim()).filter(Boolean),
                      }))}
                      className="w-full text-sm rounded-md border border-border bg-background px-3 py-2 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="100 AI resume tailors per month&#10;Advanced ATS scoring&#10;Priority support"
                    />
                  </div>

                  <Button
                    onClick={() => handleSavePlan(plan._id)}
                    disabled={saving}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              )}

              {/* Read-only summary */}
              {editingId !== plan._id && (
                <div className="px-4 py-2.5 flex items-center gap-6 text-xs text-muted-foreground">
                  <span><strong className="text-foreground">{plan.credits_per_cycle}</strong> credits/cycle</span>
                  {plan.points && plan.points.length > 0 && (
                    <span>{plan.points.length} feature points</span>
                  )}
                  {plan.razorpay_plan_id && (
                    <span className="font-mono">{plan.razorpay_plan_id}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </PremiumCard>
    </div>
  );
}

// ── Resources Tab (outer, with inner sub-tabs) ─────────────

function ResourcesTab() {
  const [subTab, setSubTab] = useState<ResourceSubTab>("google");

  const SUB_TABS: { id: ResourceSubTab; label: string; icon: string }[] = [
    { id: "google",  label: "Google",  icon: "✦" },
    { id: "mongodb", label: "MongoDB", icon: "🍃" },
    { id: "vercel",  label: "Vercel",  icon: "▲" },
    { id: "jsearch", label: "JSearch", icon: "🔍" },
  ];

  return (
    <div className="space-y-4">
      {/* Inner sub-tab bar */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-lg w-fit">
        {SUB_TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              subTab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {subTab === "google"  && <GoogleResourcePanel />}
      {subTab === "mongodb" && <MongoDBResourcePanel />}
      {subTab === "vercel"  && <VercelResourcePanel />}
      {subTab === "jsearch" && <JSearchResourcePanel />}
    </div>
  );
}

// ── Support Tab ───────────────────────────────────────────

const DEFAULT_SOCIAL: AppConfig["social_links"] = { twitter: "", linkedin: "", github: "", facebook: "", instagram: "", youtube: "" };
const DEFAULT_CONFIG: AppConfig = { app_name: "LandYourJob", support_email: "zenlead.info@gmail.com", logo_url: "/logo/lo9o.png", social_links: DEFAULT_SOCIAL, collaborators: [] };

function SupportTab() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  // identity form
  const [identity, setIdentity] = useState({ app_name: "", support_email: "", logo_url: "" });
  const [savingIdentity, setSavingIdentity] = useState(false);
  // social form
  const [social, setSocial] = useState<AppConfig["social_links"]>(DEFAULT_SOCIAL);
  const [savingSocial, setSavingSocial] = useState(false);
  // collaborators
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [savingCollabs, setSavingCollabs] = useState(false);
  const [newCollab, setNewCollab] = useState<Collaborator>({ name: "", role: "", image_url: "" });

  useEffect(() => {
    getAppConfig()
      .then((cfg) => {
        setConfig(cfg);
        setIdentity({ app_name: cfg.app_name, support_email: cfg.support_email, logo_url: cfg.logo_url });
        setSocial({ ...DEFAULT_SOCIAL, ...cfg.social_links });
        setCollabs(cfg.collaborators ?? []);
      })
      .catch(() => toast.error("Failed to load app config"))
      .finally(() => setLoading(false));
  }, []);

  const saveIdentity = async () => {
    setSavingIdentity(true);
    try {
      const updated = await updateAppConfig(identity);
      setConfig((c) => ({ ...c, ...updated }));
      toast.success("App identity saved");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingIdentity(false);
    }
  };

  const saveSocial = async () => {
    setSavingSocial(true);
    try {
      const updated = await updateAppConfig({ social_links: social });
      setConfig((c) => ({ ...c, ...updated }));
      toast.success("Social links saved");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingSocial(false);
    }
  };

  const saveCollabs = async (list: Collaborator[]) => {
    setSavingCollabs(true);
    try {
      const updated = await updateAppConfig({ collaborators: list });
      setConfig((c) => ({ ...c, ...updated }));
      setCollabs(list);
      toast.success("Collaborators saved");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingCollabs(false);
    }
  };

  const addCollab = () => {
    if (!newCollab.name.trim()) return;
    const next = [...collabs, { ...newCollab }];
    setNewCollab({ name: "", role: "", image_url: "" });
    saveCollabs(next);
  };

  const removeCollab = (i: number) => {
    const next = collabs.filter((_, idx) => idx !== i);
    saveCollabs(next);
  };

  const SOCIAL_FIELDS: { key: keyof AppConfig["social_links"]; label: string; icon: React.ReactNode; placeholder: string }[] = [
    { key: "twitter",   label: "Twitter / X", icon: <Twitter className="h-4 w-4" />,   placeholder: "https://twitter.com/yourhandle" },
    { key: "linkedin",  label: "LinkedIn",     icon: <Linkedin className="h-4 w-4" />,  placeholder: "https://linkedin.com/company/yourpage" },
    { key: "github",    label: "GitHub",       icon: <Github className="h-4 w-4" />,    placeholder: "https://github.com/yourorg" },
    { key: "facebook",  label: "Facebook",     icon: <Facebook className="h-4 w-4" />,  placeholder: "https://facebook.com/yourpage" },
    { key: "instagram", label: "Instagram",    icon: <Instagram className="h-4 w-4" />, placeholder: "https://instagram.com/yourhandle" },
    { key: "youtube",   label: "YouTube",      icon: <Youtube className="h-4 w-4" />,   placeholder: "https://youtube.com/@yourchannel" },
  ];

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading config…</div>;

  return (
    <div className="space-y-6">
      {/* Card 1 — App Identity */}
      <PremiumCard className="p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">App Identity</h2>
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">App Name</label>
            <Input value={identity.app_name} onChange={(e) => setIdentity((p) => ({ ...p, app_name: e.target.value }))} placeholder="LandYourJob" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Support Email</label>
            <Input value={identity.support_email} onChange={(e) => setIdentity((p) => ({ ...p, support_email: e.target.value }))} placeholder="support@example.com" type="email" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Logo URL</label>
            <Input value={identity.logo_url} onChange={(e) => setIdentity((p) => ({ ...p, logo_url: e.target.value }))} placeholder="/logo/lo9o.png" />
            {identity.logo_url && (
              <div className="mt-2">
                <img src={identity.logo_url} alt="Logo preview" className="h-12 w-12 rounded-xl object-contain bg-white border border-border shadow-sm" />
              </div>
            )}
          </div>
          <Button onClick={saveIdentity} disabled={savingIdentity} className="mt-2">
            {savingIdentity ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : <><Save className="h-4 w-4 mr-2" />Save Identity</>}
          </Button>
        </div>
      </PremiumCard>

      {/* Card 2 — Social Links */}
      <PremiumCard className="p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Social Links</h2>
        <div className="space-y-3 max-w-lg">
          {SOCIAL_FIELDS.map(({ key, label, icon, placeholder }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-32 shrink-0 text-muted-foreground text-sm">
                {icon} {label}
              </div>
              <Input
                value={social[key]}
                onChange={(e) => setSocial((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="flex-1"
              />
            </div>
          ))}
          <Button onClick={saveSocial} disabled={savingSocial} className="mt-2">
            {savingSocial ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : <><Save className="h-4 w-4 mr-2" />Save Social Links</>}
          </Button>
        </div>
      </PremiumCard>

      {/* Card 3 — Collaborators */}
      <PremiumCard className="p-6">
        <h2 className="text-base font-semibold text-foreground mb-1">Collaborators</h2>
        <p className="text-sm text-muted-foreground mb-4">Shown in footer as an avatar group.</p>

        {/* Live preview */}
        {collabs.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-slate-900 flex items-center gap-3">
            <span className="text-xs text-slate-500">Made with ❤️ by</span>
            <AvatarGroup collaborators={collabs} max={4} size="sm" />
          </div>
        )}

        {/* Existing list */}
        {collabs.length > 0 && (
          <div className="space-y-2 mb-4">
            {collabs.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted/30">
                <div className="h-8 w-8 rounded-full overflow-hidden border border-border bg-muted shrink-0">
                  {c.image_url
                    ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">{c.name.charAt(0)}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  {c.role && <p className="text-xs text-muted-foreground truncate">{c.role}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive shrink-0"
                  disabled={savingCollabs}
                  onClick={() => removeCollab(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new collaborator */}
        <div className="border border-dashed border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Add Collaborator</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input value={newCollab.name} onChange={(e) => setNewCollab((p) => ({ ...p, name: e.target.value }))} placeholder="Name *" />
            <Input value={newCollab.role} onChange={(e) => setNewCollab((p) => ({ ...p, role: e.target.value }))} placeholder="Role (e.g. Designer)" />
            <Input value={newCollab.image_url} onChange={(e) => setNewCollab((p) => ({ ...p, image_url: e.target.value }))} placeholder="Image URL (optional)" />
          </div>
          <Button onClick={addCollab} disabled={savingCollabs || !newCollab.name.trim()} size="sm">
            {savingCollabs ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            Add
          </Button>
        </div>
      </PremiumCard>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────

export const AdminPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as Tab) || "overview";
  const setActiveTab = (tab: Tab) =>
    setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set("tab", tab); return next; });

  return (
    <Page size="xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage credits, users, and coupons.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeTab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {activeTab === id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "overview"   && <OverviewTab />}
      {activeTab === "features"   && <FeaturesTab />}
      {activeTab === "plans"      && <PlansTab />}
      {activeTab === "users"      && <UsersTab />}
      {activeTab === "coupons"    && <CouponsTab />}
      {activeTab === "resources"  && <ResourcesTab />}
      {activeTab === "support"    && <SupportTab />}
    </Page>
  );
};

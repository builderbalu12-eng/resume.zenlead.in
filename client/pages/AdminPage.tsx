import React, { useEffect, useState } from "react";
import { LayoutDashboard, Users, Zap, Tag, Trash2, Plus, Save, Loader2, Eye, CreditCard } from "lucide-react";
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
  AdminStats, AdminUser, FeatureCost, AdminCoupon, CreateCouponData, CouponUsageEntry,
  AdminCreditLogEntry, AdminUserBilling,
  AnalyticsData, AnalyticsPeriod,
} from "@/services/adminService";

type Tab = "overview" | "features" | "users" | "coupons";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "features", label: "Feature Credits", icon: Zap },
  { id: "users", label: "Users", icon: Users },
  { id: "coupons", label: "Coupons", icon: Tag },
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
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<AnalyticsPeriod>("today");
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

// ── Main Page ─────────────────────────────────────────────

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

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

      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "features" && <FeaturesTab />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "coupons" && <CouponsTab />}
    </Page>
  );
};

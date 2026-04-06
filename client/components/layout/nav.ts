import {
  Briefcase,
  Building2,
  CreditCard,
  Home,
  MessageCircle,
  Shield,
  User,
  Wand2,
} from "lucide-react";

export type NavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
};

export const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", path: "/", icon: Home },
  { label: "Resume", path: "/resume", icon: Wand2, requiresAuth: true },
  { label: "Find Jobs", path: "/findjob", icon: Briefcase, requiresAuth: true },
  {
    label: "Find Business",
    path: "/find-business",
    icon: Building2,
    requiresAuth: true,
  },
  { label: "AI Chat", path: "/chat", icon: MessageCircle, requiresAuth: true },
];

export const ACCOUNT_NAV: NavItem[] = [
  { label: "Profile", path: "/profile", icon: User, requiresAuth: true },
  { label: "Pricing", path: "/pricing", icon: CreditCard },
  { label: "Billing", path: "/billing", icon: CreditCard, requiresAuth: true },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Admin", path: "/admin", icon: Shield, requiresAuth: true },
];

export function getRouteTitle(pathname: string): string {
  const all = [...PRIMARY_NAV, ...ACCOUNT_NAV];
  const exact = all.find((i) => i.path === pathname)?.label;
  if (exact) return exact;

  if (
    pathname.startsWith("/resume") ||
    pathname.startsWith("/upload") ||
    pathname.startsWith("/tailor")
  ) {
    return "Resume";
  }
  if (pathname.startsWith("/payment")) return "Payment";
  if (pathname.startsWith("/auth")) return "Authentication";
  if (pathname.startsWith("/admin")) return "Admin";
  return "ResumeMatch";
}


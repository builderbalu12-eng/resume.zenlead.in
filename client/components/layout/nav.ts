import {
  Briefcase,
  Clock,
  CreditCard,
  Home,
  Upload,
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
  { label: "Upload", path: "/upload", icon: Upload, requiresAuth: true },
  { label: "Tailor", path: "/tailor", icon: Wand2, requiresAuth: true },
  { label: "Find Jobs", path: "/findjob", icon: Briefcase, requiresAuth: true },
  { label: "History", path: "/history", icon: Clock, requiresAuth: true },
];

export const ACCOUNT_NAV: NavItem[] = [
  { label: "Profile", path: "/profile", icon: User, requiresAuth: true },
  { label: "Pricing", path: "/pricing", icon: CreditCard },
  { label: "Billing", path: "/billing", icon: CreditCard, requiresAuth: true },
];

export function getRouteTitle(pathname: string): string {
  const all = [...PRIMARY_NAV, ...ACCOUNT_NAV];
  const exact = all.find((i) => i.path === pathname)?.label;
  if (exact) return exact;

  if (pathname.startsWith("/payment")) return "Payment";
  if (pathname.startsWith("/auth")) return "Authentication";
  return "ResumeMatch";
}


import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { History } from "./pages/History";
import { NotFound } from "./pages/NotFound";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { AuthCallback } from "./pages/AuthCallback";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Profile } from "./pages/Profile";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsOfService } from "./pages/TermsOfService";
import { RefundPolicy } from "./pages/RefundPolicy";
import { Contact } from "./pages/Contact";
import { FindJob } from "./pages/FindJob";
import { FindBusinessPage } from "./pages/FindBusinessPage";
import ChatPage from "./pages/Chat";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { AppShell } from "./components/layout/AppShell";
import { PricingPage } from "./pages/PricingPage";
import { BillingPage } from "./pages/BillingPage";
import { PaymentSuccessPage } from "./pages/PaymentSuccessPage";
import { ResumeWorkspace } from "./pages/ResumeWorkspace";
import { AdminPage } from "./pages/AdminPage";
import { AdminRoute } from "./components/AdminRoute";
import InterviewPrep from "./pages/InterviewPrep";
import GitHubSync from "./pages/GitHubSync";
import AutoApply from "./pages/AutoApply";
import { Toaster } from "@/components/ui/sonner";
import { usePageTracking } from "@/hooks/usePageTracking";

function AppContent() {
  usePageTracking();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="bottom-right" richColors />
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Public Landing Page - No Auth Required */}
        <Route
          path="/"
          element={
            <AppShell>
              <Dashboard />
            </AppShell>
          }
        />

        {/* Pricing & Payments Hub */}
        <Route
          path="/pricing"
          element={
            <AppShell>
              <PricingPage />
            </AppShell>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <AppShell>
                <BillingPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/success"
          element={
            <AppShell>
              <PaymentSuccessPage />
            </AppShell>
          }
        />

        {/* Protected Feature Routes */}
        <Route
          path="/resume"
          element={
            <ProtectedRoute>
              <AppShell>
                <ResumeWorkspace />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="/upload" element={<Navigate to="/resume?tab=upload" replace />} />
        <Route path="/tailor" element={<Navigate to="/resume?tab=tailor" replace />} />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <AppShell>
                <History />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/findjob"
          element={
            <ProtectedRoute>
              <AppShell>
                <FindJob />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/find-business"
          element={
            <ProtectedRoute>
              <AppShell>
                <FindBusinessPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppShell>
                <Profile />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <AppShell>
                <ChatPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* SimhaCLI-powered features */}
        <Route
          path="/interview-prep"
          element={
            <ProtectedRoute>
              <AppShell>
                <InterviewPrep />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/github-sync"
          element={
            <ProtectedRoute>
              <AppShell>
                <GitHubSync />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/auto-apply"
          element={
            <ProtectedRoute>
              <AppShell>
                <AutoApply />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AppShell>
                <AdminPage />
              </AppShell>
            </AdminRoute>
          }
        />

        {/* Legal & Info Pages */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/contact" element={<Contact />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

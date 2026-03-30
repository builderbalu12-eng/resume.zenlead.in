import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { History } from "./pages/History";
import { NotFound } from "./pages/NotFound";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { AuthCallback } from "./pages/AuthCallback";
import { Profile } from "./pages/Profile";
import { FindJob } from "./pages/FindJob";
import { FindBusinessPage } from "./pages/FindBusinessPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { AppShell } from "./components/layout/AppShell";
import { PricingPage } from "./pages/PricingPage";
import { BillingPage } from "./pages/BillingPage";
import { PaymentSuccessPage } from "./pages/PaymentSuccessPage";
import { ResumeWorkspace } from "./pages/ResumeWorkspace";
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
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <AppShell>
                <ResumeWorkspace initialView="upload" />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tailor"
          element={
            <ProtectedRoute>
              <AppShell>
                <ResumeWorkspace initialView="tailor" />
              </AppShell>
            </ProtectedRoute>
          }
        />
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

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { UploadResume } from "./pages/UploadResume";
import { TailorResume } from "./pages/TailorResume";
import { History } from "./pages/History";
import { NotFound } from "./pages/NotFound";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { AuthCallback } from "./pages/AuthCallback";
import { PricingHub } from "./pages/PricingHub";
import { Profile } from "./pages/Profile";
import { PaymentSuccess } from "./pages/PaymentSuccess";
import { Checkout } from "./pages/Checkout";
import { OneTimePayment } from "./pages/OneTimePayment";
import { FindJob } from "./pages/FindJob";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { AppShell } from "./components/layout/AppShell";

function AppContent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
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
              <PricingHub />
            </AppShell>
          }
        />
        <Route
          path="/payment/success"
          element={
            <AppShell>
              <PaymentSuccess />
            </AppShell>
          }
        />

        {/* Protected Feature Routes */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <AppShell>
                <UploadResume />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tailor"
          element={
            <ProtectedRoute>
              <AppShell>
                <TailorResume />
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
          path="/checkout"
          element={
            <ProtectedRoute>
              <AppShell>
                <Checkout />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/one-time-payment"
          element={
            <ProtectedRoute>
              <AppShell>
                <OneTimePayment />
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

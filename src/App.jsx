import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/features/auth/context/AuthContext";
import { LoginPage } from "@/features/auth/LoginPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SuperadminRoute } from "@/components/SuperadminRoute";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { SuperadminLayout } from "@/layouts/SuperadminLayout";
import { DashboardPage } from "@/features/property-owner/dashboard/ui/DashboardPage";
import { BookingsPage } from "@/features/property-owner/bookings/ui/BookingsPage";
import { ResortsPage } from "@/features/property-owner/resorts/ui/ResortsPage";
import { EarningsPage } from "@/features/property-owner/earnings/ui/EarningsPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { AdminOverviewPage } from "@/features/superadmin/overview/ui/AdminOverviewPage";
import { AdminPropertiesPage } from "@/features/superadmin/properties/ui/AdminPropertiesPage";
import { AdminBookingsPage } from "@/features/superadmin/bookings/ui/AdminBookingsPage";
import { AdminEarningsPage } from "@/features/superadmin/earnings/ui/AdminEarningsPage";
import LandingPage from "@/features/landingPage/LandingPage";

const AuthRedirect = ({ children }) => {
  const { user, role, loading, roleLoading } = useAuth();
  if (loading || (user && roleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8e8e8]">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }
  if (user && role === "superadmin") return <Navigate to="/admin" replace />;
  if (user && role) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <AuthRedirect>
                <LandingPage />
              </AuthRedirect>
            }
          />
          <Route
            path="/login"
            element={
              <AuthRedirect>
                <LoginPage />
              </AuthRedirect>
            }
          />

          {/* Owner dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<DashboardPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="resorts" element={<ResortsPage />} />
            <Route path="earnings" element={<EarningsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Superadmin routes */}
          <Route
            path="/admin"
            element={
              <SuperadminRoute>
                <SuperadminLayout />
              </SuperadminRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AdminOverviewPage />} />
            <Route path="properties" element={<AdminPropertiesPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="earnings" element={<AdminEarningsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

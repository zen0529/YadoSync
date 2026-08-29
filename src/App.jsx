import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/features/auth/context/AuthContext";
import { LoginPage } from "@/features/auth/LoginPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SuperadminRoute } from "@/components/SuperadminRoute";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { SuperadminLayout } from "@/layouts/SuperadminLayout";
import { DashboardPage } from "@/features/property-owner/dashboard/ui/DashboardPage";
import { BookingsPage } from "@/features/property-owner/bookings/ui/BookingsPage";
import { ResortsPage } from "@/features/property-owner/resorts/ui/ResortsPage";
import { AnalyticsPage } from "@/features/property-owner/analytics/ui/AnalyticsPage";
import { RoomAndRatesPage } from "@/features/property-owner/roomAndRates/pages/roomAndRatesPage";
import { InventoryPage as NewInventoryPage } from "@/features/property-owner/inventory";
import { InboxPage } from "@/features/property-owner/inbox/ui/InboxPage";
import ChannelsPage from "@/features/property-owner/channels/ui/ChannelsPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { AdminOverviewPage } from "@/features/superadmin/overview/page/AdminOverviewPage";
import { AdminPropertiesPage } from "@/features/superadmin/properties";
import { BillingPage } from "@/features/superadmin/billing/ui/BillingPage";
import { SystemLogsPage } from "@/features/superadmin/logs/ui/SystemLogsPage.jsx";
import LandingPage from "@/features/landingPage/LandingPage";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

import { PropertyProvider } from "@/features/property-owner/context/PropertyContext";

// Fix for default Leaflet marker icon in React
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

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
        <Toaster position="top-right" richColors closeButton />
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
                <PropertyProvider>
                  <DashboardLayout />
                </PropertyProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<DashboardPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="resorts" element={<ResortsPage />} />
            <Route path="rooms-and-rates" element={<RoomAndRatesPage />} />
            <Route path="inventory" element={<NewInventoryPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="channels" element={<ChannelsPage />} />
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
            <Route path="billing" element={<BillingPage />} />
            <Route path="logs" element={<SystemLogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

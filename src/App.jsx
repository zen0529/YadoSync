import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/features/auth/context/AuthContext";
import { LoginPage } from "@/features/auth/LoginPage";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { BookingsPage } from "@/features/bookings/pages/BookingsPage";
import { ResortsPage } from "@/features/resorts/pages/ResortsPage";
import { EarningsPage } from "@/features/earnings/pages/EarningsPage";

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8e8e8]">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="overview" element={<DashboardPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="resorts" element={<ResortsPage />} />
        <Route path="earnings" element={<EarningsPage />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

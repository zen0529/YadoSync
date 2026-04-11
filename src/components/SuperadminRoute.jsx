import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";

export const SuperadminRoute = ({ children }) => {
  const { user, role, loading, roleLoading } = useAuth();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8e8e8]">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "superadmin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

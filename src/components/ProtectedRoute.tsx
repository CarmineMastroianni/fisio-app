import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const session = useAuthStore((state) => state.session);
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

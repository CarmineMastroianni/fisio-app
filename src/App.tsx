import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CalendarPage } from "./pages/CalendarPage";
import { PatientsPage } from "./features/patients/PatientsPage";
import { PatientDetailPage } from "./features/patients/PatientDetailPage";
import { VisitDetailPage } from "./features/visits/VisitDetailPage";
import { VisitsPage } from "./pages/VisitsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useAuthStore } from "./stores/authStore";

export default function App() {
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);

  // Mostra spinner globale solo al primissimo caricamento
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/summary" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <Layout>
              <CalendarPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <Layout>
              <PatientsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <PatientDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:id/visits/:visitId"
        element={
          <ProtectedRoute>
            <Layout>
              <VisitDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/visits"
        element={
          <ProtectedRoute>
            <Layout>
              <VisitsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

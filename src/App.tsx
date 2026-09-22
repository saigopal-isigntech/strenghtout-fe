import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./App.css";

const LoginPage            = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage         = lazy(() => import("./pages/auth/RegisterPage"));
const ForgotPasswordPage   = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const DashboardPage        = lazy(() => import("./pages/candidate/DashboardPage"));
const CandidateProfilePage = lazy(() => import("./pages/candidate/CandidateProfilePage"));
const NotificationsPage    = lazy(() => import("./pages/candidate/NotificationsPage"));
const DiscoverPage         = lazy(() => import("./pages/company/DiscoverPage"));
const AdminQueuePage       = lazy(() => import("./pages/admin/AdminQueuePage"));
const AdminUsersPage       = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminAuditPage       = lazy(() => import("./pages/admin/AdminAuditPage"));
const AdminDashboardPage   = lazy(() => import("./pages/admin/AdminDashboard"));
const MyRequestsPage       = lazy(() => import("./pages/company/MyRequestsPage"));
const CompanyProfileView   = lazy(() => import("./components/CompanyProfileView"));

const PageLoader = () => (
  <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div className="spinner-lg" />
  </div>
);

// Route helper to direct candidates to CandidateProfilePage and companies to CompanyProfileView
const ProfileRouter: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === "ROLE_COMPANY") {
    return <CompanyProfileView />;
  }
  return <CandidateProfilePage />;
};

const PersistentAppLayout: React.FC = () => {
  const location = useLocation();
  const noFooterPaths = ["/dashboard", "/admin/requests", "/admin/users", "/admin/audit", "/admin/dashboard"];
  const showFooter = !noFooterPaths.some((p) => location.pathname === p || location.pathname.startsWith("/admin/"));

  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        {/* Auth routes without top navbar */}
        <Route path="/login" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
        <Route path="/register" element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />
        <Route path="/forgot-password" element={<Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense>} />

        {/* All application routes with fixed persistent navbar */}
        <Route element={<PersistentAppLayout />}>
          <Route path="/" element={<CandidateProfilePage />} />
          <Route path="/profile" element={<ProtectedRoute roles={["ROLE_CANDIDATE", "ROLE_COMPANY", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><ProfileRouter /></ProtectedRoute>} />
          <Route path="/candidates/:id" element={<ProtectedRoute roles={["ROLE_CANDIDATE", "ROLE_COMPANY", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><CandidateProfilePage /></ProtectedRoute>} />
          <Route path="/candidate/:id" element={<ProtectedRoute roles={["ROLE_CANDIDATE", "ROLE_COMPANY", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><CandidateProfilePage /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute roles={["ROLE_CANDIDATE", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><CandidateProfilePage initialMode="edit" /></ProtectedRoute>} />
          <Route path="/company/profile" element={<ProtectedRoute roles={["ROLE_COMPANY", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><CompanyProfileView /></ProtectedRoute>} />
          <Route path="/about" element={<CandidateProfilePage />} />
          <Route path="/careers" element={<CandidateProfilePage />} />
          <Route path="/services" element={<CandidateProfilePage />} />
          <Route path="/contact" element={<CandidateProfilePage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/discover"
            element={
              <ProtectedRoute roles={["ROLE_COMPANY", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}>
                <DiscoverPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-requests"
            element={
              <ProtectedRoute roles={["ROLE_COMPANY"]}>
                <MyRequestsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute roles={["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}>
                <AdminQueuePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute roles={["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}>
                <AdminAuditPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;

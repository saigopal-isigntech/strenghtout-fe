import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
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
const MyRequestsPage       = lazy(() => import("./pages/company/MyRequestsPage"));

const PageLoader = () => (
  <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div className="spinner-lg" />
  </div>
);

const AppLayout: React.FC<{ children: React.ReactNode; showFooter?: boolean }> = ({
  children,
  showFooter = true,
}) => (
  <div className="app-shell">
    <Navbar />
    <main className="app-main">
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </main>
    {showFooter && <Footer />}
  </div>
);

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/"         element={<AppLayout><CandidateProfilePage /></AppLayout>} />
        <Route path="/profile"  element={<AppLayout><CandidateProfilePage /></AppLayout>} />
        <Route path="/about"    element={<AppLayout><CandidateProfilePage /></AppLayout>} />
        <Route path="/careers"  element={<AppLayout><CandidateProfilePage /></AppLayout>} />
        <Route path="/services" element={<AppLayout><CandidateProfilePage /></AppLayout>} />
        <Route path="/contact"  element={<AppLayout><CandidateProfilePage /></AppLayout>} />

        <Route path="/login"    element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
        <Route path="/register" element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />
        <Route path="/forgot-password" element={<Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense>} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppLayout showFooter={false}><DashboardPage /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/notifications" element={
          <ProtectedRoute>
            <AppLayout><NotificationsPage /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/discover" element={
          <ProtectedRoute roles={["ROLE_COMPANY", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}>
            <AppLayout><DiscoverPage /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/my-requests" element={
          <ProtectedRoute roles={["ROLE_COMPANY"]}>
            <AppLayout><MyRequestsPage /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/requests" element={
          <ProtectedRoute roles={["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}>
            <AppLayout showFooter={false}><AdminQueuePage /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/users" element={
          <ProtectedRoute roles={["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}>
            <AppLayout showFooter={false}><AdminUsersPage /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/audit" element={
          <ProtectedRoute roles={["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}>
            <AppLayout showFooter={false}><AdminAuditPage /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;

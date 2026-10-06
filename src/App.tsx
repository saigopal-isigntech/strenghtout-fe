import CommandPalette from "./components/CommandPalette";
import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoginSuccessToast from "./components/LoginSuccessToast";

// Lazy-loaded pages for bundle splitting
const LoginPage            = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage         = lazy(() => import("./pages/auth/RegisterPage"));
const ForgotPasswordPage   = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const DashboardPage        = lazy(() => import("./pages/candidate/DashboardPage"));
const CandidateProfilePage = lazy(() => import("./pages/candidate/CandidateProfilePage"));
const CandidateOpportunitiesPage = lazy(() => import("./pages/candidate/CandidateOpportunitiesPage"));
const NotificationsPage    = lazy(() => import("./pages/candidate/NotificationsPage"));
const DiscoverPage         = lazy(() => import("./pages/company/DiscoverPage"));
const AdminQueuePage       = lazy(() => import("./pages/admin/AdminQueuePage"));
const AdminUsersPage       = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminAuditPage       = lazy(() => import("./pages/admin/AdminAuditPage"));
const AdminDashboardPage   = lazy(() => import("./pages/admin/AdminDashboard"));
const MyRequestsPage       = lazy(() => import("./pages/company/MyRequestsPage"));
const CompanyProfileView   = lazy(() => import("./components/CompanyProfileView"));
const AboutPage            = lazy(() => import("./pages/AboutPage"));
const ServicesPage         = lazy(() => import("./pages/ServicesPage"));

// Instant Scroll Reset on route change to ensure all pages open cleanly from top (0,0)
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Reset any lingering overflow locks from previous page modals
    document.body.style.overflow = "";
    // Instantly snap to top without smooth-scroll lag
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
};

const PageLoader = () => (
  <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div className="spinner-lg" />
  </div>
);

// Intelligent root / dashboard router that directs users to their identifiable module dashboard
const DashboardRouter: React.FC = () => {
  const { user, isAdmin } = useAuth();
  if (isAdmin()) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (user?.role === "ROLE_COMPANY") {
    return <Navigate to="/company/dashboard" replace />;
  }
  return <Navigate to="/candidate/dashboard" replace />;
};

// Intelligent requests router
const RequestsRouter: React.FC = () => {
  const { user, isAdmin } = useAuth();
  if (isAdmin()) {
    return <Navigate to="/admin/requests" replace />;
  }
  if (user?.role === "ROLE_COMPANY") {
    return <Navigate to="/company/requests" replace />;
  }
  return <Navigate to="/candidate/opportunities" replace />;
};

// Intelligent profile router
const ProfileRouter: React.FC = () => {
  const { user, isAdmin } = useAuth();
  if (isAdmin()) {
    return <Navigate to="/admin/users" replace />;
  }
  if (user?.role === "ROLE_COMPANY") {
    return <Navigate to="/company/profile" replace />;
  }
  return <Navigate to="/candidate/profile" replace />;
};

const PersistentAppLayout: React.FC = () => {
  const location = useLocation();
  const noFooterPaths = [
    "/dashboard",
    "/admin/dashboard",
    "/admin/requests",
    "/admin/users",
    "/admin/audit",
    "/company/dashboard",
    "/candidate/dashboard",
    "/candidate/opportunities",
    "/candidate/requests"
  ];
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
      <LoginSuccessToast />
      <CommandPalette />
    </div>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <ScrollToTop />
    <AuthProvider>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
        <Route path="/register" element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />
        <Route path="/forgot-password" element={<Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense>} />

        {/* Persistent Layout */}
        <Route element={<PersistentAppLayout />}>
          {/* Public Landing & Informational Pages */}
          <Route path="/" element={<AboutPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/careers" element={<AboutPage />} />
          <Route path="/contact" element={<AboutPage />} />

          {/* Smart Unified Routers (Backward-Compatible) */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfileRouter /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute roles={["ROLE_CANDIDATE", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><Navigate to="/candidate/profile/edit" replace /></ProtectedRoute>} />
          <Route path="/discover" element={<ProtectedRoute roles={["ROLE_COMPANY", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><Navigate to="/company/discover" replace /></ProtectedRoute>} />
          <Route path="/my-requests" element={<ProtectedRoute><RequestsRouter /></ProtectedRoute>} />

          {/* ============================================================
              1. ADMIN MODULE ROUTES (/admin/*)
              ============================================================ */}
          <Route path="/admin" element={<ProtectedRoute roles={["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><Navigate to="/admin/dashboard" replace /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute roles={["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/requests" element={<ProtectedRoute roles={["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><AdminQueuePage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute roles={["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><AdminAuditPage /></ProtectedRoute>} />

          {/* ============================================================
              2. COMPANY MODULE ROUTES (/company/*)
              ============================================================ */}
          <Route path="/company" element={<ProtectedRoute roles={["ROLE_COMPANY", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><Navigate to="/company/dashboard" replace /></ProtectedRoute>} />
          <Route path="/company/dashboard" element={<ProtectedRoute roles={["ROLE_COMPANY"]}><DashboardPage /></ProtectedRoute>} />
          <Route path="/company/discover" element={<ProtectedRoute roles={["ROLE_COMPANY", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><DiscoverPage /></ProtectedRoute>} />
          <Route path="/company/requests" element={<ProtectedRoute roles={["ROLE_COMPANY"]}><MyRequestsPage /></ProtectedRoute>} />
          <Route path="/company/profile" element={<ProtectedRoute roles={["ROLE_COMPANY", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><CompanyProfileView /></ProtectedRoute>} />
          <Route path="/companies/:id" element={<ProtectedRoute roles={["ROLE_COMPANY", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><CompanyProfileView /></ProtectedRoute>} />
          <Route path="/company/:id" element={<ProtectedRoute roles={["ROLE_COMPANY", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><CompanyProfileView /></ProtectedRoute>} />

          {/* ============================================================
              3. CANDIDATE MODULE ROUTES (/candidate/*)
              ============================================================ */}
          <Route path="/candidate" element={<ProtectedRoute roles={["ROLE_CANDIDATE"]}><Navigate to="/candidate/dashboard" replace /></ProtectedRoute>} />
          <Route path="/candidate/dashboard" element={<ProtectedRoute roles={["ROLE_CANDIDATE"]}><DashboardPage /></ProtectedRoute>} />
          <Route path="/candidate/opportunities" element={<ProtectedRoute roles={["ROLE_CANDIDATE"]}><CandidateOpportunitiesPage /></ProtectedRoute>} />
          <Route path="/candidate/requests" element={<ProtectedRoute roles={["ROLE_CANDIDATE"]}><CandidateOpportunitiesPage /></ProtectedRoute>} />
          <Route path="/candidate/profile" element={<ProtectedRoute roles={["ROLE_CANDIDATE", "ROLE_COMPANY", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><CandidateProfilePage /></ProtectedRoute>} />
          <Route path="/candidate/profile/edit" element={<ProtectedRoute roles={["ROLE_CANDIDATE", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><CandidateProfilePage initialMode="edit" /></ProtectedRoute>} />
          <Route path="/candidates/:id" element={<ProtectedRoute roles={["ROLE_CANDIDATE", "ROLE_COMPANY", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><CandidateProfilePage /></ProtectedRoute>} />
          <Route path="/candidate/:id" element={<ProtectedRoute roles={["ROLE_CANDIDATE", "ROLE_COMPANY", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}><CandidateProfilePage /></ProtectedRoute>} />

          {/* Shared Notifications */}
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;

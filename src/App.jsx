import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import MainLayout from './layouts/MainLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Route-level code splitting keeps the initial bundle small and lets the
// charting library (only used by the dashboard) load on demand.
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const AnalyzePage = lazy(() => import('./pages/AnalyzePage.jsx'));
const ResultsPage = lazy(() => import('./pages/ResultsPage.jsx'));
const HistoryPage = lazy(() => import('./pages/HistoryPage.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner label="Loading page…" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public marketing pages */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Route>

        {/* Application pages (sidebar layout) — guarded so that once a real
            auth API is configured, signed-out visitors are sent to /login */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          {/* Keep /about reachable from both shells */}
          <Route path="/app/about" element={<AboutPage />} />
        </Route>

        {/* Authentication pages */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

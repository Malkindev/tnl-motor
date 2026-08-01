import { useEffect, Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
const HomePage = lazy(() => import('./pages/HomePage'));
const VehiclesPage = lazy(() => import('./pages/VehiclesPage'));
const VehicleDetailsPage = lazy(() => import('./pages/VehicleDetailsPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const AdminEntryPage = lazy(() => import('./pages/AdminEntryPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminVehiclesPage = lazy(() => import('./pages/AdminVehiclesPage'));
const AdminInquiriesPage = lazy(() => import('./pages/AdminInquiriesPage'));
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import { useAuthStore } from './stores/authStore';

function App() {
  const { setUser } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('tnl_token');
    const user = localStorage.getItem('tnl_user');
    if (token && user) {
      setUser(JSON.parse(user), token);
    }
  }, [setUser]);

  return (
    <Suspense fallback={<div className="container py-12">Loading…</div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/:id" element={<VehicleDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/account" element={<PrivateRoute><AccountPage /></PrivateRoute>} />
        <Route path="/admin" element={<AdminEntryPage />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/vehicles" element={<AdminRoute><AdminVehiclesPage /></AdminRoute>} />
        <Route path="/admin/inquiries" element={<AdminRoute><AdminInquiriesPage /></AdminRoute>} />
      </Routes>
    </Suspense>
  );
}

export default App;

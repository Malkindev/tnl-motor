import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleDetailsPage from './pages/VehicleDetailsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AccountPage from './pages/AccountPage';
import AdminEntryPage from './pages/AdminEntryPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminVehiclesPage from './pages/AdminVehiclesPage';
import AdminInquiriesPage from './pages/AdminInquiriesPage';
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
  );
}

export default App;

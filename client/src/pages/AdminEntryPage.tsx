import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuthStore } from '../stores/authStore';

type AdminLoginInputs = {
  email: string;
  password: string;
};

export default function AdminEntryPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<AdminLoginInputs>();
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: AdminLoginInputs) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await axios.post('/api/auth/login', data);
      if (!response.data.user?.isAdmin) {
        setAuthError('Administrator access is required.');
        setLoading(false);
        return;
      }
      localStorage.setItem('tnl_token', response.data.token);
      localStorage.setItem('tnl_user', JSON.stringify(response.data.user));
      setUser(response.data.user, response.data.token);
      navigate('/admin/vehicles');
    } catch (error: any) {
      setAuthError(error.response?.data?.message || 'Unable to authenticate admin.');
    }
    setLoading(false);
  };

  return (
    <div>
      <Header />
      <main className="container section">
        <div className="form-card" style={{ maxWidth: 520, margin: '0 auto' }}>
          <p className="badge">Administrator Login</p>
          <h2>Secure Admin Access</h2>
          <p className="small-text">Enter your admin credentials to manage TNL Motors inventory.</p>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="admin@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' }
                })}
              />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>
            <div className="input-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter admin password"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  className="btn btn-light"
                  style={{ position: 'absolute', top: 12, right: 12, padding: '0.45rem 0.75rem' }}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password.message}</p>}
            </div>
            {authError && <p className="field-error">{authError}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Signing in…' : 'Sign in as Admin'}
            </button>
          </form>
          <p style={{ marginTop: '1rem', color: '#555' }}>
            This page is for TNL Motors administrators only.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

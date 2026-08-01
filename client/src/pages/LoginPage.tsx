import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuthStore } from '../stores/authStore';

type LoginInputs = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInputs>();
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const googleToken = searchParams.get('google_token');
    const googleUser = searchParams.get('google_user');
    const callbackError = searchParams.get('error');
    if (callbackError) {
      setAuthError('Google sign-in could not complete.');
    }
    if (googleToken && googleUser) {
      try {
        const parsed = JSON.parse(decodeURIComponent(googleUser));
        localStorage.setItem('tnl_token', googleToken);
        localStorage.setItem('tnl_user', JSON.stringify(parsed));
        setUser(parsed, googleToken);
        navigate(parsed.isAdmin ? '/admin/vehicles' : '/account');
      } catch {
        setAuthError('Google login completed, but we could not complete sign-in.');
      }
    }
  }, [navigate, searchParams, setUser]);

  const onSubmit = async (data: LoginInputs) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await axios.post('/api/auth/login', data);
      localStorage.setItem('tnl_token', response.data.token);
      localStorage.setItem('tnl_user', JSON.stringify(response.data.user));
      setUser(response.data.user, response.data.token);
      navigate(response.data.user.isAdmin ? '/admin/vehicles' : '/account');
    } catch (error: any) {
      setAuthError(error.response?.data?.message || 'Unable to sign in.');
    }
    setLoading(false);
  };

  const continueWithGoogle = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div>
      <Header />
      <main className="container section">
        <div className="form-card" style={{ maxWidth: 520, margin: '0 auto' }}>
          <p className="badge">Member Login</p>
          <h1 style={{ marginTop: 8, marginBottom: 6 }}>TNL MOTORS</h1>
          <h2 style={{ marginTop: 0 }}>Member Login</h2>
          <p className="small-text">Sign in to manage your profile, inquiries, saved vehicles and account.</p>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com" {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' }
              })} />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>
            <div className="input-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  className="btn btn-light toggle-button"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password.message}</p>}
            </div>
            <div className="row-gap">
              <label className="checkbox-label">
                <input type="checkbox" /> Remember Me
              </label>
              <Link to="/forgot-password" className="nav-link">Forgot Password?</Link>
            </div>
            {authError && <p className="field-error">{authError}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem 1rem', fontSize: '1rem' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="mb-4 text-sm">──────── Or continue with ────────</p>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={continueWithGoogle}>Continue with Google</button>
            <p className="mt-4 text-sm">Don't have an account? <Link to="/signup" className="text-blue-600">Create Account</Link></p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

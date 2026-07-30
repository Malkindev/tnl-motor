import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuthStore } from '../stores/authStore';

type SignupInputs = {
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const countryCodes = [
  { label: '+254 Kenya', value: '+254' },
  { label: '+1 USA', value: '+1' },
  { label: '+44 UK', value: '+44' },
  { label: '+234 Nigeria', value: '+234' }
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<SignupInputs>({
    defaultValues: { countryCode: '+254', phone: '' }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const onSubmit = async (data: SignupInputs) => {
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone ? `${data.countryCode}${data.phone}` : '',
        password: data.password
      };
      const response = await axios.post('/api/auth/signup', payload);
      localStorage.setItem('tnl_token', response.data.token);
      localStorage.setItem('tnl_user', JSON.stringify(response.data.user));
      setUser(response.data.user, response.data.token);
      navigate('/account');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to create account.');
    }
    setLoading(false);
  };

  const passwordStrength = password?.length >= 12 ? 'Strong' : password?.length >= 8 ? 'Good' : 'Weak';

  return (
    <div>
      <Header />
      <main className="container section">
        <div className="form-card" style={{ maxWidth: 600, margin: '0 auto' }}>
          <p className="badge">Create your account</p>
          <h2>Start buying with confidence</h2>
          <p className="small-text">Sign up to browse vehicles, save favorites, and send inquiries.</p>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="input-group">
              <label>Full Name</label>
              <input {...register('name', { required: 'Full name is required' })} placeholder="Your full name" />
              {errors.name && <p className="field-error">{errors.name.message}</p>}
            </div>
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' }
              })} placeholder="you@example.com" />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>
            <div className="input-group">
              <label>Phone Number</label>
              <div className="grid-2">
                <div>
                  <Controller
                    name="countryCode"
                    control={control}
                    render={({ field }) => (
                      <select {...field}>
                        {countryCodes.map((code) => (
                          <option key={code.value} value={code.value}>{code.label}</option>
                        ))}
                      </select>
                    )}
                  />
                </div>
                <div>
                  <input
                    {...register('phone', {
                      pattern: { value: /^[0-9]{6,15}$/, message: 'Enter a valid phone number' }
                    })}
                    placeholder="712345678"
                  />
                </div>
              </div>
              {errors.phone && <p className="field-error">{errors.phone.message}</p>}
            </div>
            <div className="input-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Minimum 8 characters' },
                    pattern: { value: /(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])/, message: 'Use uppercase, lowercase and numbers' }
                  })}
                  placeholder="Create a password"
                />
                <button type="button" className="btn btn-light toggle-button" onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password.message}</p>}
              {password && <p style={{ color: '#555' }}>Strength: {passwordStrength}</p>}
            </div>
            <div className="input-group">
              <label>Confirm Password</label>
              <input type={showPassword ? 'text' : 'password'} {...register('confirmPassword', { required: 'Please confirm your password' })} placeholder="Confirm password" />
              {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}
              {confirmPassword && password !== confirmPassword && <p className="field-error">Passwords do not match.</p>}
            </div>
            {error && <p className="field-error">{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating account…' : 'Sign Up'}
            </button>
          </form>
          <p style={{ marginTop: '1rem', textAlign: 'center' }}>Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

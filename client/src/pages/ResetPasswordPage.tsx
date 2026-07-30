import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus('Passwords must match.');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/auth/reset-password', { token, password });
      setStatus('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error: any) {
      setStatus(error.response?.data?.message || 'Unable to reset password.');
    }
    setLoading(false);
  };

  return (
    <div>
      <Header />
      <main className="container section">
        <div className="form-card" style={{ maxWidth: 520, margin: '0 auto' }}>
          <p className="badge">Reset password</p>
          <h2>Create a new password</h2>
          <p className="small-text">Enter a secure password to restore access to your account.</p>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" required />
            </div>
            <div className="input-group">
              <label>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Saving...' : 'Save new password'}
            </button>
          </form>
          {status && <p style={{ marginTop: 16 }}>{status}</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
}

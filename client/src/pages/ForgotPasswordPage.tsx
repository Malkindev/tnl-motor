import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/auth/forgot-password', { email });
      setStatus('If that email is registered, we sent reset instructions.');
    } catch (error: any) {
      setStatus(error.response?.data?.message || 'Unable to send reset instructions.');
    }
    setLoading(false);
  };

  return (
    <div>
      <Header />
      <main className="container section">
        <div className="form-card" style={{ maxWidth: 520, margin: '0 auto' }}>
          <p className="badge">Reset password</p>
          <h2>Forgot your password?</h2>
          <p className="small-text">Enter the email associated with your account and we’ll send instructions to reset your password.</p>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>{loading ? 'Sending...' : 'Send reset link'}</button>
          </form>
          {status && <p style={{ color: '#333', marginTop: 16 }}>{status}</p>}
          <p style={{ marginTop: 16, textAlign: 'center' }}>Remembered your password? <Link to="/login">Sign In</Link></p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

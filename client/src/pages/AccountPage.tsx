import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

export default function AccountPage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setPhone(user.phone || '');
    const fetchData = async () => {
      try {
        const [meResponse, inquiriesResponse] = await Promise.all([
          axios.get('/api/auth/me'),
          axios.get('/api/user/inquiries')
        ]);
        setUser(meResponse.data, localStorage.getItem('tnl_token'));
        setName(meResponse.data.name || '');
        setPhone(meResponse.data.phone || '');
        setInquiries(inquiriesResponse.data);
      } catch (error) {
        console.error('Unable to load account data.', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, setUser]);

  if (!user) return null;

  const saveProfile = async () => {
    setSaving(true);
    try {
      const response = await axios.patch('/api/auth/profile', { name, phone });
      setUser(response.data, localStorage.getItem('tnl_token'));
      setStatus('Profile updated successfully.');
    } catch (error: any) {
      setStatus(error.response?.data?.message || 'Unable to update profile.');
      console.error('Profile update failed', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <main className="container section">
        <div className="section-header">
          <div>
            <h1>Account</h1>
            <p className="small-text">Manage your profile, view your inquiries, and keep your account information up to date.</p>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-card">
            <h3>Profile</h3>
            <div className="input-group">
              <label>Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Email Address</label>
              <input value={user.email} disabled />
            </div>
            <div className="input-group">
              <label>Phone Number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {status ? <p className="field-note">{status}</p> : null}
          </div>

          <div className="form-card">
            <h3>Recent inquiries</h3>
            {loading ? (
              <p>Loading your inquiries…</p>
            ) : inquiries.length ? (
              inquiries.map((inquiry) => (
                <div key={inquiry.id} className="inquiry-card">
                  <p className="bold">{inquiry.vehicleTitle}</p>
                  <p className="small-text">{new Date(inquiry.createdAt).toLocaleDateString()}</p>
                  <p>{inquiry.message}</p>
                  <p className="small-text">Status: {inquiry.status}</p>
                </div>
              ))
            ) : (
              <p>You have not submitted any inquiries yet.</p>
            )}
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}

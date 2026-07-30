import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuthStore } from '../stores/authStore';
import { useVehicleStore } from '../stores/vehicleStore';

export default function AccountPage() {
  const { user, setUser } = useAuthStore();
  const { inquiries } = useVehicleStore();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [status, setStatus] = useState<string | null>(null);

  if (!user) return null;

  const saveProfile = () => {
    setUser({ ...user, name, phone }, null);
    setStatus('Profile updated.');
  };

  return (
    <div>
      <Header />
      <main className="container section">
        <div className="section-header">
          <div>
            <h2>Account</h2>
            <p className="small-text">Manage your information and review any inquiries you submitted.</p>
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
            <button className="btn btn-primary" onClick={saveProfile}>Save Changes</button>
            {status ? <p style={{ color: '#0a7', marginTop: 12 }}>{status}</p> : null}
          </div>

          <div className="form-card">
            <h3>Recent inquiries</h3>
            {inquiries.length ? inquiries.map((inquiry) => (
              <div key={inquiry.id} style={{ marginBottom: '1rem' }}>
                <p style={{ margin: '0.25rem 0', fontWeight: 700 }}>{inquiry.vehicleTitle}</p>
                <p style={{ margin: 0, color: '#555' }}>{inquiry.message}</p>
              </div>
            )) : <p>No inquiries submitted yet.</p>}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

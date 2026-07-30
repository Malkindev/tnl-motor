import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AdminSidebar from '../components/AdminSidebar';
import { useVehicleStore } from '../stores/vehicleStore';

export default function AdminInquiriesPage() {
  const { inquiries, setInquiries } = useVehicleStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/inquiries').then((response) => {
      setInquiries(response.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [setInquiries]);

  const updateStatus = async (id: string, status: string) => {
    const response = await axios.patch(`/api/admin/inquiries/${id}`, { status });
    setInquiries(inquiries.map((inquiry) => (inquiry.id === id ? response.data : inquiry)));
  };

  return (
    <div>
      <Header />
      <main className="container section">
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
          <AdminSidebar />
          <div>
            <div className="section-header">
              <div>
                <h2>Customer Inquiries</h2>
                <p className="small-text">Track new, contacted, and closed customer requests.</p>
              </div>
            </div>
            <div className="inquiry-grid">
              {loading ? (
                <p>Loading inquiries…</p>
              ) : inquiries.length ? inquiries.map((inquiry) => (
                <div key={inquiry.id} className="inquiry-card">
                  <h3>{inquiry.name}</h3>
                  <p>{inquiry.email} • {inquiry.phone || 'No phone'}</p>
                  <p style={{ color: '#555' }}>{inquiry.message}</p>
                  <p><strong>Vehicle:</strong> {inquiry.vehicleTitle}</p>
                  <p><strong>Status:</strong> {inquiry.status}</p>
                  <div style={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', marginTop: 10 }}>
                    {['New', 'Contacted', 'Closed'].map((statusLabel) => (
                      <button key={statusLabel} type="button" className="btn btn-secondary" onClick={() => updateStatus(inquiry.id, statusLabel)}>{statusLabel}</button>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="empty-state">
                  <h3>No inquiries yet.</h3>
                  <p>Customers will see their messages here once they contact you.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

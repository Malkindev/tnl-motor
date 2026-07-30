import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AdminSidebar from '../components/AdminSidebar';
import { ShieldCheck, Car, CheckCircle2, Users, Mail } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    axios.get('/api/admin/stats')
      .then((response) => setStats(response.data))
      .catch(() => setStats(null));
  }, []);

  return (
    <div>
      <Header />
      <main className="container section">
        <div className="dashboard-layout">
          <AdminSidebar />
          <div className="dashboard-main">
            <div className="section-header">
              <div>
                <h2>Admin Dashboard</h2>
                <p className="small-text">Manage inventory, inquiries, and premium listings.</p>
              </div>
            </div>

            <div className="dashboard-stat-grid">
              <article className="stats-card stats-card-hero">
                <div className="stats-icon"><ShieldCheck size={24} /></div>
                <h3>{stats?.totalVehicles ?? '--'}</h3>
                <p>Total Vehicles</p>
              </article>
              <article className="stats-card">
                <div className="stats-icon"><Car size={24} /></div>
                <h3>{stats?.activeListings ?? '--'}</h3>
                <p>Active Listings</p>
              </article>
              <article className="stats-card">
                <div className="stats-icon"><CheckCircle2 size={24} /></div>
                <h3>{stats?.soldVehicles ?? '--'}</h3>
                <p>Sold Vehicles</p>
              </article>
              <article className="stats-card">
                <div className="stats-icon"><Users size={24} /></div>
                <h3>{stats?.totalUsers ?? '--'}</h3>
                <p>Registered Users</p>
              </article>
              <article className="stats-card">
                <div className="stats-icon"><Mail size={24} /></div>
                <h3>{stats?.totalInquiries ?? '--'}</h3>
                <p>Total Inquiries</p>
              </article>
            </div>

            <div className="section-header" style={{ marginTop: '2rem' }}>
              <div>
                <h3>Condition Breakdown</h3>
                <p className="small-text">New vs Used vehicles in the showroom.</p>
              </div>
            </div>
            <div className="chart-panel">
              <div className="chart-bar">
                <span>New</span>
                <div className="bar"><div style={{ width: `${((stats?.conditionBreakdown?.New ?? 0) / Math.max(stats?.totalVehicles || 1, 1)) * 100}%` }} /></div>
                <strong>{stats?.conditionBreakdown?.New ?? 0}</strong>
              </div>
              <div className="chart-bar">
                <span>Used</span>
                <div className="bar"><div style={{ width: `${((stats?.conditionBreakdown?.Used ?? 0) / Math.max(stats?.totalVehicles || 1, 1)) * 100}%` }} /></div>
                <strong>{stats?.conditionBreakdown?.Used ?? 0}</strong>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

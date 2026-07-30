import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Car, MessageCircle, Settings } from 'lucide-react';

const links = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Vehicles', href: '/admin/vehicles', icon: Car },
  { label: 'Inquiries', href: '/admin/inquiries', icon: MessageCircle },
  { label: 'Account', href: '/account', icon: Settings }
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/assets/tnl-logo.png" alt="TNL Motors" style={{ width: 56, height: 'auto' }} />
          <div>
            <div style={{ fontWeight: 800 }}>TNL MOTORS</div>
            <div className="brand-sub">Automotive Management</div>
          </div>
        </div>
      </div>
      <nav className="sidebar-links">
        {links.map(({ label, href, icon: Icon }) => (
          <Link key={href} to={href} className={`sidebar-link ${location.pathname === href ? 'active' : ''}`}>
            <Icon size={18} />
            <span className="link-text">{label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-profile">
          <div className="profile-initials">AM</div>
          <div>
            <strong>Admin</strong>
            <div className="small-text">Manage account</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

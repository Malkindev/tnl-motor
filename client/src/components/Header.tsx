import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Menu, Search, ChevronDown, LogOut, Settings, User, Grid } from 'lucide-react';

const links = [
  { label: 'Home', href: '/' },
  { label: 'Inventory', href: '/vehicles' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' }
];

export default function Header() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = useMemo(() => {
    if (!user?.name) return 'AM';
    return user.name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [user]);

  return (
    <header className="page-header">
      <div className="navbar container">
        <Link to="/" className="brand">
          <div className="brand-logo">
            <img src="/assets/tnl-logo.png" alt="TNL Motors" />
          </div>
          <div className="brand-text">
            <strong>TNL Motors</strong>
            <small>Luxury auto marketplace</small>
          </div>
        </Link>

        <div className="nav-wrapper">
          <div className="nav-links">
            {links.map((item) => (
              <Link key={item.href} to={item.href} className="nav-link">
                {item.label}
              </Link>
            ))}
            {user?.isAdmin && (
              <Link to="/admin/dashboard" className="nav-link">
                Admin
              </Link>
            )}
          </div>

          <button type="button" className="icon-button search-button" onClick={() => navigate('/vehicles')}>
            <Search size={18} />
          </button>

          <div className="profile-menu">
            <button type="button" className="profile-trigger" onClick={() => setProfileOpen((prev) => !prev)}>
              <span>{initials}</span>
              <ChevronDown size={16} />
            </button>
            {profileOpen && (
              <div className="profile-dropdown">
                <button type="button" className="dropdown-item" onClick={() => { setProfileOpen(false); navigate('/account'); }}>
                  <User size={16} /> My Account
                </button>
                <button type="button" className="dropdown-item" onClick={() => { setProfileOpen(false); navigate('/vehicles'); }}>
                  <Grid size={16} /> My Listings
                </button>
                {user?.isAdmin && (
                  <button type="button" className="dropdown-item" onClick={() => { setProfileOpen(false); navigate('/admin/dashboard'); }}>
                    <Grid size={16} /> Admin Dashboard
                  </button>
                )}
                <button type="button" className="dropdown-item" onClick={() => { setProfileOpen(false); navigate('/account'); }}>
                  <Settings size={16} /> Settings
                </button>
                <button type="button" className="dropdown-item danger" onClick={() => { signOut(); navigate('/'); }}>
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>

          <button type="button" className="icon-button mobile-menu-button" onClick={() => setMenuOpen((prev) => !prev)}>
            <Menu size={20} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-drawer">
          {links.map((item) => (
            <Link key={item.href} to={item.href} className="mobile-link" onClick={() => setMenuOpen(false)}>{item.label}</Link>
          ))}
          {user?.isAdmin && (
            <Link to="/admin/dashboard" className="mobile-link" onClick={() => setMenuOpen(false)}>Admin Dashboard</Link>
          )}
          {!user ? (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => { setMenuOpen(false); navigate('/login'); }}>Login</button>
              <button type="button" className="btn btn-primary" onClick={() => { setMenuOpen(false); navigate('/signup'); }}>Sign Up</button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => { setMenuOpen(false); navigate('/account'); }}>Account</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setMenuOpen(false); signOut(); navigate('/'); }}>Sign Out</button>
            </>
          )}
        </div>
      )}
    </header>
  );
}

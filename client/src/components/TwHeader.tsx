import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function TwHeader() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3">
          <img src="/assets/tnl-logo.png" alt="TNL Motors" className="w-10 h-10 rounded-lg" />
          <div className="leading-tight">
            <div className="font-bold uppercase text-sm">TNL Motors</div>
            <div className="text-xs text-gray-500">Premium Vehicles</div>
          </div>
        </Link>

        <nav className="flex items-center gap-4" aria-label="Primary navigation">
          <Link to="/vehicles" className="text-gray-700 hover:text-gray-900">Vehicles</Link>
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/account" className="text-gray-700">{user.name || user.email}</Link>
              <button onClick={signOut} aria-label="Sign out" className="btn btn-primary">Sign out</button>
            </div>
          ) : (
            <Link to="/login" aria-label="Sign in" className="btn btn-primary">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

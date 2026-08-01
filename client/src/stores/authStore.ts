import axios from 'axios';
import { create } from 'zustand';

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isAdmin?: boolean;
};

type AuthState = {
  user: User | null;
  token: string | null;
  setUser: (user: User | null, token: string | null) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setUser: (user, token) => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
    set({ user, token });
  },
  signOut: () => {
    try {
      // Attempt server-side signout if endpoint exists (no-op if absent)
      axios.post('/api/auth/signout').catch(() => {});
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('tnl_token');
    localStorage.removeItem('tnl_user');
    try { sessionStorage.removeItem('tnl_token'); sessionStorage.removeItem('tnl_user'); } catch (e) {}
    delete axios.defaults.headers.common.Authorization;
    set({ user: null, token: null });
    // navigate to login to ensure UI resets
    try { window.location.href = '/login'; } catch (e) {}
  }
}));

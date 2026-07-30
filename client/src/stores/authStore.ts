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
    localStorage.removeItem('tnl_token');
    localStorage.removeItem('tnl_user');
    delete axios.defaults.headers.common.Authorization;
    set({ user: null, token: null });
  }
}));

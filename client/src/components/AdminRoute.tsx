import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function AdminRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuthStore();
  if (!user || !user.isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  return children;
}

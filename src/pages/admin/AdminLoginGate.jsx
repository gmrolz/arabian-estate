import { Navigate } from 'react-router-dom';
import { getControlSession } from '../../lib/listingsApi';
import AdminLogin from './AdminLogin';

export default function AdminLoginGate() {
  if (getControlSession()) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <AdminLogin />;
}

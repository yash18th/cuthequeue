import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Checking authentication...</p>
      </div>
    );
  }

  if (!user) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/signin?redirect=${redirectUrl}`} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If role doesn't match, send to their own role's main page
    if (user.role === 'restaurant_admin') {
      return <Navigate to="/kitchen" replace />;
    }
    if (user.role === 'super_admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/browse" replace />;
  }

  return children;
}

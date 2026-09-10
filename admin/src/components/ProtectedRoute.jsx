import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #E8E0D2',
          borderTopColor: '#C49A52',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ color: '#5C6E6A', fontSize: '0.9rem', fontWeight: 600 }}>Loading Console...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user || (user.role !== 'restaurant_admin' && user.role !== 'super_admin')) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

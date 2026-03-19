import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { googleCallback } = useAuth();

  useEffect(() => {
    googleCallback()
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => navigate('/login', { replace: true }));
  }, [googleCallback, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h1 className="auth-title">TaskFlow</h1>
        <div className="loading-container">
          <div className="spinner" />
        </div>
        <p style={{ color: '#5e6c84', marginTop: 16 }}>Signing you in...</p>
      </div>
    </div>
  );
}

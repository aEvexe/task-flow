import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard' || location.pathname.startsWith('/boards')
      : location.pathname === path;

  return (
    <header className="header">
      <div className="header-bar">
        <div className="header-left">
          <Link to="/" className="header-title" title="TaskFlow" />
          <nav className="header-nav">
            <Link to="/" className={`header-nav-link ${isActive('/') ? 'header-nav-active' : ''}`}>
              Home
            </Link>
            <Link to="/dashboard" className={`header-nav-link ${isActive('/dashboard') ? 'header-nav-active' : ''}`}>
              Dashboard
            </Link>
          </nav>
        </div>
        <div className="header-separator" />
        <div className="header-right">
          <button className="btn btn-logout" onClick={handleLogout} title="Logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

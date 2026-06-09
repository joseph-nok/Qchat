import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { clearSessionToken } from '../lib/session';
import '../route_css/MessagesList.css';

const Sidebar = () => {
  const location = useLocation();
  const { sessionToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    clearSessionToken();
    window.location.href = '/login';
  };

  const links = [
    { to: '/messages', icon: 'chat_bubble', label: 'Messages' },
    { to: '/explore', icon: 'travel_explore', label: 'Explore' },
    { to: '/verify-profile', icon: 'verified_user', label: 'Verify Profile' },
    { to: '/edit-profile', icon: 'manage_accounts', label: 'Edit Profile' },
  ];

  return (
    <>
      <button
        type="button"
        className="sidebar-menu-toggle"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-controls="dashboard-sidebar"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="material-symbols-outlined">{isOpen ? 'close' : 'menu'}</span>
      </button>

      {isOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside id="dashboard-sidebar" className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Academic Luminary</h2>
          <p className="sidebar-subtitle">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            Verified Portal
          </p>
        </div>

        <nav className="sidebar-nav">
          {links.map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`sidebar-link ${location.pathname === to ? 'active' : ''}`}
            >
              <span
                className="material-symbols-outlined"
                style={location.pathname === to ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {icon}
              </span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sessionToken && (
            <button 
              className="sidebar-connect-btn" 
              onClick={handleLogout}
              style={{ 
                backgroundColor: 'var(--error)', 
                color: 'white', 
                border: 'none',
                cursor: 'pointer' 
              }}
            >
              Logout Portal
            </button>
          )}
          <a href="#" className="sidebar-help-link">
            <span className="material-symbols-outlined">help</span>
            <span>Help Center</span>
          </a>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

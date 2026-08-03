import { useState } from 'react';
import { useQuery } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext.jsx';
import '../route_css/MessagesList.css';

interface AppHeaderProps {
  userName?: string;
  userRole?: string;
  profileImage?: string;
}

const AppHeader = ({ userName = 'Kwame Kwame', userRole = 'Academic Member', profileImage }: AppHeaderProps) => {
  const avatarSrc = profileImage || '';
  const navigate = useNavigate();
  const { sessionToken } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const pendingBB84Notifications = useQuery(
    api.qchat.getPendingBB84Notifications,
    sessionToken ? { sessionToken } : 'skip',
  );

  return (
    <header className="app-header">
      <span className="app-header-brand">Ghana Education Connect</span>

      <div className="app-header-right">
        <div className="app-notification-wrap">
          <button
            type="button"
            className={`app-notification-button ${pendingBB84Notifications?.length ? 'has-notifications' : ''}`}
            aria-label="Quantum key exchange notifications"
            aria-expanded={showNotifications}
            onClick={() => setShowNotifications((isOpen) => !isOpen)}
          >
            <span className="material-symbols-outlined">notifications</span>
            {!!pendingBB84Notifications?.length && (
              <span className="app-notification-count">{pendingBB84Notifications.length}</span>
            )}
          </button>

          {showNotifications && (
            <div className="app-notification-panel" role="dialog" aria-label="Notifications">
              <div className="app-notification-panel-header">
                <span>Notifications</span>
                {!!pendingBB84Notifications?.length && <small>{pendingBB84Notifications.length} pending</small>}
              </div>

              {pendingBB84Notifications?.length ? pendingBB84Notifications.map((notification) => (
                <button
                  type="button"
                  className="app-notification-item"
                  key={notification._id}
                  onClick={() => {
                    setShowNotifications(false);
                    navigate(`/messages?roomId=${notification.roomId}`);
                  }}
                >
                  <span className="app-notification-icon">⚛</span>
                  <span className="app-notification-copy">
                    <strong>Quantum key exchange</strong>
                    <span>{notification.actorName} is waiting for you to accept the BB84 fingerprint.</span>
                    <em>Review and accept in Messages →</em>
                  </span>
                </button>
              )) : (
                <p className="app-notification-empty">You’re all caught up.</p>
              )}
            </div>
          )}
        </div>
        <div className="user-profile">
          <div className="user-profile-info">
            <p className="user-profile-name">{userName}</p>
            <p className="user-profile-role">{userRole}</p>
          </div>
          <div className="user-avatar">
            {avatarSrc ? (
              <img src={avatarSrc} alt={`${userName} profile`} />
            ) : (
              <span className="material-symbols-outlined" style={{ color: 'var(--on-primary-container)' }}>person</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;

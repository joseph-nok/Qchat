import '../route_css/MessagesList.css';

interface AppHeaderProps {
  userName?: string;
  userRole?: string;
  profileImage?: string;
}

const AppHeader = ({ userName = 'Kwame Kwame', userRole = 'Academic Member', profileImage }: AppHeaderProps) => {
  const avatarSrc = profileImage || '';

  return (
    <header className="app-header">
      <span className="app-header-brand">Ghana Education Connect</span>

      <div className="app-header-right">
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

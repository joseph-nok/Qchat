import { Link } from 'react-router-dom';
import '../component_css/Header.css';

const Header = () => {
  return (
    <header className="top-app-bar">
      <div className="top-app-bar-content">
        <div className="logo">
          <span className="logo-text">Ghana Education Connect</span>
        </div>
        <div className="actions">
          <Link to="/register" className="primary-btn" style={{textDecoration: 'none'}}>Get Started</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;

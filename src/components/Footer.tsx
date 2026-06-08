import '../component_css/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <span className="footer-logo">Ghana Education Connect</span>
          <p className="footer-desc">Building the future of secure academic communication for the Republic of Ghana.</p>
        </div>
        <nav className="footer-nav">
          <a href="#">About</a>
          <a href="#">Privacy Policy</a>
        </nav>
        <div className="footer-divider"></div>
        <div className="footer-bottom">
          <p className="copyright">© 2026 Ghana Education Connect. All academic credentials verified through trusted institutions.</p>
          {/* <div className="social-links">
              <span className="material-symbols-outlined">social_leaderboard</span>
              <span className="material-symbols-outlined">language</span>
              <span className="material-symbols-outlined">mail</span>
          </div> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;

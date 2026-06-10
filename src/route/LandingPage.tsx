import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../route_css/LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page" data-mode="connect">
      <Header />

      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-text-area">
              <div className="verified-badge">
                <span className="material-symbols-outlined icon">verified</span>
                <span className="badge-text">Verified Academic Network</span>
              </div>
              <h1 className="hero-title">
                Ghana Education <br />
                <span className="highlight">Connect.</span>
              </h1>
              <p className="hero-subtitle">
                Experience quantum-simulated file sharing. Built for Ghanaian
                academia's next frontier
              </p>
              <div className="hero-actions">
                <Link
                  to="/register"
                  className="primary-btn large text-decoration-none text-center"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="secondary-btn large text-decoration-none text-center"
                >
                  Login
                </Link>
              </div>
            </div>
            <div className="hero-image-area">
              <div className="image-wrapper">
                <img
                  src="https://src.uenr.edu.gh/wp-content/uploads/2021/05/IMG_1270-min-scaled-1.jpg"
                  alt="Modern University Architecture"
                  className="main-image"
                />
                <div className="glass-card">
                  <div className="glass-card-icon">
                    <span className="material-symbols-outlined">security</span>
                  </div>
                  <div className="glass-card-text">
                    <p className="glass-title">Web3 Integration.</p>
                    <p className="glass-subtitle">
                      Institutional Credentials Required.
                    </p>
                  </div>
                </div>
              </div>
              <div className="blob blob-1"></div>
              <div className="blob blob-2"></div>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="features-section">
          <div className="features-container">
            <div className="features-header">
              <h2 className="section-title">Academic Sovereignty</h2>
              <p className="section-subtitle">
                Experience a communication layer built specifically for the
                Ghanaian academic landscape, where security isn't an option—it's
                the foundation.
              </p>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon-wrapper primary">
                  <span className="material-symbols-outlined">
                    cloud_upload
                  </span>
                </div>
                <h3 className="feature-title">Academic Material Upload</h3>
                <p className="feature-desc">
                  Distribute research text, PDFs, DOCX files, presentations, and
                  assignments across the connected institutional network.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrapper secondary">
                  <span className="material-symbols-outlined">chat_bubble</span>
                </div>
                <h3 className="feature-title">Academic Chat</h3>
                <p className="feature-desc">
                  Communicate with peers and lecturers in real-time
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="trust-section">
          <div className="trust-container">
            <h2 className="trust-title">
              Trusted by students and lecturers across Ghana
            </h2>
            <div className="trust-logos">
              <div className="trust-logo">
                <div className="logo-circle secondary">UENR</div>
                <span className="logo-text-bold">Sunyani</span>
              </div>
              <div className="trust-logo">
                <div className="logo-circle primary">UG</div>
                <span className="logo-text-bold">Legon</span>
              </div>
              <div className="trust-logo">
                <div className="logo-circle tertiary">KNUST</div>
                <span className="logo-text-bold">Kumasi</span>
              </div>
              <div className="trust-logo">
                <div className="logo-circle secondary">UCC</div>
                <span className="logo-text-bold">Cape Coast</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;

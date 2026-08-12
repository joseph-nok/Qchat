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
              <h1 className="hero-title">
                Ghana Education <br />
                <span className="highlight">Connect.</span>
              </h1>
              {/* <p className="hero-subtitle">
                 Built for Ghanaian
                academia's next frontier
              </p> */}
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
              <h2 className="section-title">Academia Connect</h2>
              <p className="section-subtitle">
                Experience a communication layer built specifically for the
                Ghanaian academic landscape.
              </p>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon-wrapper primary">
                  {/* <span className="material-symbols-outlined">
                    cloud_upload
                  </span> */}
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
                  Communicate with peers and lecturers in the academic network.
                </p>
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

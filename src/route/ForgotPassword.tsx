import { Link } from 'react-router-dom';
import '../route_css/ForgotPassword.css';

const ForgotPassword = () => {
  return (
    <div className="auth-page">
      <div className="bg-shape one"></div>
      
      <main className="auth-main">
        <div className="auth-card" style={{ padding: '2rem 1rem' }}>
          <div className="auth-content">
            <div className="auth-title-container center">
              <div className="auth-title-icon" style={{ backgroundColor: 'rgba(252, 209, 22, 0.1)' }}>
                <span className="material-symbols-outlined text-primary" data-icon="lock_reset" style={{ fontSize: '2.5rem' }}>lock_reset</span>
              </div>
              <h1 className="auth-title">Forgot Password?</h1>
              <p className="auth-subtitle" style={{ margin: '0 auto', maxWidth: '280px' }}>
                Enter your institutional email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form className="auth-form" onSubmit={(e) => e.preventDefault()} style={{ marginTop: '2rem' }}>
              <div className="auth-field-group">
                <label className="auth-label" htmlFor="email">Email Address</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <input 
                    type="email" 
                    id="email" 
                    className="auth-input with-icon" 
                    placeholder="name@uenr.edu.gh" 
                    required 
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit large" style={{ marginTop: '1rem' }}>
                Send Reset Link
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </form>

            <div className="auth-divider" style={{ marginBottom: '1.5rem', marginTop: '2.5rem' }}>
              <div className="divider-line"></div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link to="/login" style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                color: 'var(--secondary)', 
                fontWeight: '600', 
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}>
                <span className="material-symbols-outlined text-[18px]">keyboard_backspace</span>
                <span>Back to Login</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <div style={{ textAlign: 'center', paddingBottom: '2rem', color: 'var(--outline)', fontSize: '0.75rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
        University of Energy and Natural Resources
      </div>
    </div>
  );
};

export default ForgotPassword;

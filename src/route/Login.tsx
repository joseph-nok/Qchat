import { useState } from 'react';
import { useMutation } from 'convex/react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { saveSessionToken } from '../lib/session';
import '../route_css/Login.css';

const convexApi = api as any;

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'student' | 'lecturer'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginUser = useMutation(convexApi.qchat.loginUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await loginUser({ email, password, role });
      saveSessionToken(user.sessionToken);
      navigate('/messages');
    } catch (err) {
      setError(err instanceof Error ? err.message : `Invalid credentials. Please verify your role (${role}), institutional email, or password.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <header className="auth-header">
        <Link to="/" className="auth-header-brand">
          <div className="auth-header-icon">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <span className="auth-header-text">Ghana Education Connect</span>
        </Link>
      </header>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-tabs">
            <button className="auth-tab active">Login</button>
            <Link to="/register" className="auth-tab">Register</Link>
          </div>

          <div className="auth-content">
            <div className="auth-title-container">
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">Access your verified academic profile and credentials securely.</p>
            </div>

            {error && (
              <div 
                style={{ 
                  backgroundColor: 'rgba(186, 26, 26, 0.1)', 
                  borderLeft: '4px solid var(--error)', 
                  padding: '0.875rem 1rem', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.8125rem', 
                  color: 'var(--error)', 
                  fontWeight: '600', 
                  marginBottom: '1.25rem',
                  lineHeight: '1.4'
                }}
              >
                {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field-group">
                <label className="auth-label">Select Account Type</label>
                <div className="auth-role-toggle">
                  <button 
                    type="button" 
                    className={`role-btn ${role === 'student' ? 'active' : ''}`}
                    onClick={() => {
                      setRole('student');
                      setError('');
                    }}
                  >
                    Student
                  </button>
                  <button 
                    type="button" 
                    className={`role-btn ${role === 'lecturer' ? 'active' : ''}`}
                    onClick={() => {
                      setRole('lecturer');
                      setError('');
                    }}
                  >
                    Lecturer
                  </button>
                </div>
              </div>

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
                    placeholder="kwame.mensah@uenr.edu.gh" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-label" htmlFor="password">Secure Password</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="password" 
                    className="auth-input with-icon" 
                    placeholder="••••••••••••" 
                    style={{ paddingRight: '2.5rem' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <span 
                    className="material-symbols-outlined" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ 
                      position: 'absolute', 
                      right: '0.875rem', 
                      color: 'var(--on-surface-variant)', 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      fontSize: '1.25rem'
                    }}
                  >
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </div>
              </div>

              <div className="auth-helpers">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Remember Me</span>
                </label>
                <Link to="/forgot-password" className="forgot-password">Forgot Password?</Link>
              </div>

              <button type="submit" className="auth-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Login to Portal'}
                <span className="material-symbols-outlined text-[18px]">{isSubmitting ? 'hourglass_top' : 'arrow_forward'}</span>
              </button>
            </form>

          </div>

          <div className="auth-security-footer">
            <p>
              Secured by <span>Ghana Education Connect</span> • Institutional account verification
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;

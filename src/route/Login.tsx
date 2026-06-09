import { useState } from 'react';
import { useMutation } from 'convex/react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { saveSessionToken } from '../lib/session';
import '../route_css/Login.css';

const convexApi = api as any;

type LoginFieldErrors = {
  role?: string;
  email?: string;
  password?: string;
  form?: string;
};

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'student' | 'lecturer'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginUser = useMutation(convexApi.qchat.loginUser);

  const clearFieldError = (field: keyof LoginFieldErrors) => {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      delete next.form;
      return next;
    });
  };

  const placeServerError = (message: string) => {
    if (message.includes('No account')) {
      setFieldErrors({ email: message });
      return;
    }
    if (message.includes('registered as')) {
      setFieldErrors({ role: message });
      return;
    }
    if (message.includes('Incorrect password')) {
      setFieldErrors({ password: message });
      return;
    }
    setFieldErrors({ form: message });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const nextErrors: LoginFieldErrors = {};
    if (!email.trim()) nextErrors.email = 'Enter your institutional email address.';
    if (!password) nextErrors.password = 'Enter your password.';
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await loginUser({ email, password, role });
      saveSessionToken(user.sessionToken);
      navigate('/messages');
    } catch (err) {
      placeServerError(err instanceof Error ? err.message : 'Unable to log in. Please try again.');
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

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field-group">
                <label className="auth-label">Select Account Type</label>
                <div className="auth-role-toggle">
                  <button 
                    type="button" 
                    className={`role-btn ${role === 'student' ? 'active' : ''}`}
                    onClick={() => {
                      setRole('student');
                      setFieldErrors({});
                    }}
                  >
                    Student
                  </button>
                  <button 
                    type="button" 
                    className={`role-btn ${role === 'lecturer' ? 'active' : ''}`}
                    onClick={() => {
                      setRole('lecturer');
                      setFieldErrors({});
                    }}
                  >
                    Lecturer
                  </button>
                </div>
                {fieldErrors.role && <p className="auth-field-error">{fieldErrors.role}</p>}
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
                    className={`auth-input with-icon ${fieldErrors.email ? 'error' : ''}`}
                    placeholder="kwame.mensah@uenr.edu.gh" 
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFieldError('email');
                    }}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
                  />
                </div>
                {fieldErrors.email && <p className="auth-field-error" id="login-email-error">{fieldErrors.email}</p>}
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
                    className={`auth-input with-icon ${fieldErrors.password ? 'error' : ''}`}
                    placeholder="••••••••••••" 
                    style={{ paddingRight: '2.5rem' }}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError('password');
                    }}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="material-symbols-outlined" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ 
                      position: 'absolute', 
                      right: '0.875rem', 
                      color: 'var(--on-surface-variant)', 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      fontSize: '1.25rem',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </button>
                </div>
                {fieldErrors.password && <p className="auth-field-error" id="login-password-error">{fieldErrors.password}</p>}
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
              {fieldErrors.form && <p className="auth-field-error center">{fieldErrors.form}</p>}
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

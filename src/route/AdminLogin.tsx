import { useState } from 'react';
import { useMutation } from 'convex/react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { saveAdminSessionToken } from '../lib/adminSession';
import '../route_css/Login.css';

const convexApi = api as any;

const AdminLogin = () => {
  const navigate = useNavigate();
  const loginAdmin = useMutation(convexApi.admin.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const admin = await loginAdmin({ email, password });
      saveAdminSessionToken(admin.sessionToken);
      navigate('/admin');
    } catch {
      setError('Those admin credentials could not be verified.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page admin-auth-page">
      <header className="auth-header"><Link to="/" className="auth-header-brand"><div className="auth-header-icon"><span className="material-symbols-outlined">admin_panel_settings</span></div><span className="auth-header-text">Ghana Education Connect</span></Link></header>
      <main className="auth-main"><div className="auth-card">
        <div className="auth-content">
          <div className="auth-title-container"><div className="auth-title-icon"><span className="material-symbols-outlined">shield_lock</span></div><h1 className="auth-title">Admin access</h1><p className="auth-subtitle">Sign in to review academic identity requests.</p></div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field-group"><label className="auth-label" htmlFor="admin-email">Admin email</label><input id="admin-email" className="auth-input" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@qchat.local" required /></div>
            <div className="auth-field-group"><label className="auth-label" htmlFor="admin-password">Admin password</label><div className="auth-input-wrapper"><input id="admin-password" className="auth-input" style={{ paddingRight: '2.75rem' }} type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /><button type="button" className="admin-password-toggle" aria-label={showPassword ? 'Hide admin password' : 'Show admin password'} onClick={() => setShowPassword((visible) => !visible)}><span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span></button></div></div>
            {error && <p className="auth-field-error center">{error}</p>}
            <button className="auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Authenticating...' : 'Enter admin console'}<span className="material-symbols-outlined">arrow_forward</span></button>
          </form>
        </div>
      </div></main>
    </div>
  );
};

export default AdminLogin;

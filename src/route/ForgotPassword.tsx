import { useState } from 'react';
import { useMutation } from 'convex/react';
import { Link } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import '../route_css/ForgotPassword.css';

const convexApi = api as any;

type ResetFieldErrors = {
  email?: string;
  idNumber?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
};

const ForgotPassword = () => {
  const resetPassword = useMutation(convexApi.qchat.resetPasswordWithIdentity);
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ResetFieldErrors>({});
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (field: keyof ResetFieldErrors) => {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      delete next.form;
      return next;
    });
  };

  const placeServerError = (errorMessage: string) => {
    if (errorMessage.includes('No account')) {
      setFieldErrors({ email: errorMessage });
      return;
    }
    if (errorMessage.includes('Index number')) {
      setFieldErrors({ idNumber: errorMessage });
      return;
    }
    if (errorMessage.includes('password')) {
      setFieldErrors({ password: errorMessage });
      return;
    }
    setFieldErrors({ form: errorMessage });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setFieldErrors({});

    const nextErrors: ResetFieldErrors = {};
    if (!email.trim()) nextErrors.email = 'Enter the email for your account.';
    if (!idNumber.trim()) nextErrors.idNumber = 'Enter your student or staff index number.';
    if (!password) nextErrors.password = 'Enter a new password.';
    if (!confirmPassword) nextErrors.confirmPassword = 'Confirm your new password.';
    if (password && password.length < 8) nextErrors.password = 'New password must be at least 8 characters long.';
    if (password && confirmPassword && password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({
        email,
        idNumber,
        password,
      });
      setEmail('');
      setIdNumber('');
      setPassword('');
      setConfirmPassword('');
      setMessage('Password updated successfully. You can now log in with your new password.');
    } catch (err) {
      placeServerError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                Enter your email and index number, then choose a new password.
              </p>
            </div>

            <form className="auth-form" onSubmit={(event) => void handleSubmit(event)} style={{ marginTop: '2rem' }} noValidate>
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
                    placeholder="name@uenr.edu.gh" 
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      clearFieldError('email');
                    }}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'reset-email-error' : undefined}
                  />
                </div>
                {fieldErrors.email && <p className="auth-field-error" id="reset-email-error">{fieldErrors.email}</p>}
              </div>

              <div className="auth-field-group">
                <label className="auth-label" htmlFor="id_number">Index Number</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <span className="material-symbols-outlined text-[20px]">badge</span>
                  </div>
                  <input
                    type="text"
                    id="id_number"
                    className={`auth-input with-icon ${fieldErrors.idNumber ? 'error' : ''}`}
                    placeholder="UEB1234567 or staff ID"
                    value={idNumber}
                    onChange={(event) => {
                      setIdNumber(event.target.value);
                      clearFieldError('idNumber');
                    }}
                    aria-invalid={Boolean(fieldErrors.idNumber)}
                    aria-describedby={fieldErrors.idNumber ? 'reset-id-number-error' : undefined}
                  />
                </div>
                {fieldErrors.idNumber && <p className="auth-field-error" id="reset-id-number-error">{fieldErrors.idNumber}</p>}
              </div>

              <div className="auth-field-group">
                <label className="auth-label" htmlFor="new_password">New Password</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="new_password"
                    className={`auth-input with-icon ${fieldErrors.password ? 'error' : ''}`}
                    placeholder="At least 8 characters"
                    style={{ paddingRight: '2.5rem' }}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearFieldError('password');
                    }}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'reset-password-error' : undefined}
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
                      alignItems: 'center',
                    }}
                  >
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </button>
                </div>
                {fieldErrors.password && <p className="auth-field-error" id="reset-password-error">{fieldErrors.password}</p>}
              </div>

              <div className="auth-field-group">
                <label className="auth-label" htmlFor="confirm_password">Confirm Password</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm_password"
                    className={`auth-input with-icon ${fieldErrors.confirmPassword ? 'error' : ''}`}
                    placeholder="Repeat new password"
                    style={{ paddingRight: '2.5rem' }}
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      clearFieldError('confirmPassword');
                    }}
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    aria-describedby={fieldErrors.confirmPassword ? 'reset-confirm-password-error' : undefined}
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="material-symbols-outlined"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                      alignItems: 'center',
                    }}
                  >
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="auth-field-error" id="reset-confirm-password-error">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {message && (
                <div className="auth-success-message">
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>{message}</span>
                </div>
              )}

              <button type="submit" className="auth-submit large" style={{ marginTop: '1rem' }} disabled={isSubmitting}>
                {isSubmitting ? 'Updating Password...' : 'Update Password'}
                <span className="material-symbols-outlined text-[20px]">{isSubmitting ? 'hourglass_top' : 'arrow_forward'}</span>
              </button>
              {fieldErrors.form && <p className="auth-field-error center">{fieldErrors.form}</p>}
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

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { Link } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { isNetworkError, toErrorText } from '../lib/convexErrors';
import '../route_css/ForgotPassword.css';

const convexApi = api as any;

type ResetErrorsRecord = {
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
  const [errorsRecord, setErrorsRecord] = useState<ResetErrorsRecord>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (field: keyof ResetErrorsRecord) => {
    setErrorsRecord((current) => {
      const next = { ...current };
      delete next[field];
      delete next.form;
      return next;
    });
  };

  /** Tier 1 — validate locally before calling Convex. */
  const runFrontendValidation = (): ResetErrorsRecord | null => {
    const errors: ResetErrorsRecord = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = 'Enter the email for your account.';
    } else if (!trimmedEmail.includes('@')) {
      errors.email = 'Enter a valid email address that includes @.';
    }

    if (!idNumber.trim()) {
      errors.idNumber = 'Enter your student or staff index number.';
    }

    if (!password) {
      errors.password = 'Enter a new password.';
    } else if (password.length < 8) {
      errors.password = 'New password must be at least 8 characters long.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm your new password.';
    } else if (password && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  /** Tier 2 — map database errors to the correct field using keyword checks. */
  const applyBackendError = (error: unknown) => {
    if (isNetworkError(error)) {
      setErrorsRecord({ form: 'Unable to connect. Please check your internet connection.' });
      return;
    }

    const errorText = toErrorText(error);

    if (errorText.includes('index') || errorText.includes('match')) {
      setErrorsRecord({
        idNumber: 'The provided email address or Index Number does not match our student records.',
      });
      return;
    }

    if (errorText.includes('no account') || errorText.includes('exist')) {
      setErrorsRecord({
        email: 'The provided email address or Index Number does not match our student records.',
      });
      return;
    }

    if (errorText.includes('credential') || errorText.includes('password')) {
      setErrorsRecord({ password: 'New password must be at least 8 characters long.' });
      return;
    }

    setErrorsRecord({ form: 'Something went wrong. Please try again.' });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorsRecord({});

    const frontendErrors = runFrontendValidation();
    if (frontendErrors) {
      setErrorsRecord(frontendErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({
        email,
        idNumber,
        password,
      });
      setErrorsRecord({});
      setEmail('');
      setIdNumber('');
      setPassword('');
      setConfirmPassword('');
      setSuccessMessage('Password updated successfully. You can now log in with your new password.');
    } catch (error) {
      setSuccessMessage('');
      applyBackendError(error);
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
                    className={`auth-input with-icon ${errorsRecord.email ? 'error' : ''}`}
                    placeholder="name@uenr.edu.gh"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      clearFieldError('email');
                    }}
                    aria-invalid={Boolean(errorsRecord.email)}
                    aria-describedby={errorsRecord.email ? 'reset-email-error' : undefined}
                  />
                </div>
                {errorsRecord.email && <p className="auth-field-error" id="reset-email-error">{errorsRecord.email}</p>}
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
                    className={`auth-input with-icon ${errorsRecord.idNumber ? 'error' : ''}`}
                    placeholder="UEB1234567 or staff ID"
                    value={idNumber}
                    onChange={(event) => {
                      setIdNumber(event.target.value);
                      clearFieldError('idNumber');
                    }}
                    aria-invalid={Boolean(errorsRecord.idNumber)}
                    aria-describedby={errorsRecord.idNumber ? 'reset-id-number-error' : undefined}
                  />
                </div>
                {errorsRecord.idNumber && <p className="auth-field-error" id="reset-id-number-error">{errorsRecord.idNumber}</p>}
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
                    className={`auth-input with-icon ${errorsRecord.password ? 'error' : ''}`}
                    placeholder="At least 8 characters"
                    style={{ paddingRight: '2.5rem' }}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearFieldError('password');
                    }}
                    aria-invalid={Boolean(errorsRecord.password)}
                    aria-describedby={errorsRecord.password ? 'reset-password-error' : undefined}
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
                {errorsRecord.password && <p className="auth-field-error" id="reset-password-error">{errorsRecord.password}</p>}
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
                    className={`auth-input with-icon ${errorsRecord.confirmPassword ? 'error' : ''}`}
                    placeholder="Repeat new password"
                    style={{ paddingRight: '2.5rem' }}
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      clearFieldError('confirmPassword');
                    }}
                    aria-invalid={Boolean(errorsRecord.confirmPassword)}
                    aria-describedby={errorsRecord.confirmPassword ? 'reset-confirm-password-error' : undefined}
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
                {errorsRecord.confirmPassword && (
                  <p className="auth-field-error" id="reset-confirm-password-error">{errorsRecord.confirmPassword}</p>
                )}
              </div>

              {successMessage && (
                <div className="auth-success-message">
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>{successMessage}</span>
                </div>
              )}

              <button type="submit" className="auth-submit large" style={{ marginTop: '1rem' }} disabled={isSubmitting}>
                {isSubmitting ? 'Updating Password...' : 'Update Password'}
                <span className="material-symbols-outlined text-[20px]">{isSubmitting ? 'hourglass_top' : 'arrow_forward'}</span>
              </button>
              {errorsRecord.form && <p className="auth-field-error center">{errorsRecord.form}</p>}
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
                transition: 'color 0.2s',
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

import { useState, useRef, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { saveSessionToken } from '../lib/session';
import '../route_css/Register.css';

const convexApi = api as any;

const GHANA_INSTITUTIONS = [
  'University of Energy and Natural Resources (UENR)',
  'University of Ghana (UG)',
  'Kwame Nkrumah University of Science and Technology (KNUST)',
  'University of Cape Coast (UCC)',
  'University for Development Studies (UDS)',
  'Ghana Institute of Management and Public Administration (GIMPA)',
  'Ashesi University',
  'Central University',
  'Wisconsin International University College',
  'Valley View University',
  'Ghana Communication Technology University (GCTU)',
  'Accra Technical University',
  'Kumasi Technical University',
  'Ho Technical University',
  'Sunyani Technical University',
  'Takoradi Technical University',
  'Cape Coast Technical University',
  'Bolgatanga Technical University',
  'Wa Technical University',
  'University of Professional Studies, Accra (UPSA)',
  'Ghana Institute of Journalism (GIJ)',
  'SD Dombo University of Business and Integrated Development Studies',
];

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'student' | 'lecturer'>('student');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstitutionDropdown, setShowInstitutionDropdown] = useState(false);
  const institutionRef = useRef<HTMLDivElement>(null);
  const registerUser = useMutation(convexApi.qchat.registerUser);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (institutionRef.current && !institutionRef.current.contains(e.target as Node)) {
        setShowInstitutionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredInstitutions = GHANA_INSTITUTIONS.filter(inst =>
    inst.toLowerCase().includes(institution.toLowerCase())
  );

  // Dynamic Label and Placeholder settings
  const idLabel = role === 'student' ? 'Student ID Number' : 'Staff ID Number';
  const idPlaceholder = role === 'student' ? 'UEB1234567' : 'STF1234567';

  // Real-time password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: 'No Password Entered', color: 'rgba(77, 70, 50, 0.4)' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    let text = 'Very Weak Security';
    let color = 'var(--error)'; // Ghana Red (#ba1a1a)
    if (score === 2) {
      text = 'Weak/Fair Security';
      color = '#e07a5f'; // Soft Orange
    } else if (score === 3) {
      text = 'Good Security';
      color = 'var(--primary)'; // Ghana Gold/Yellow (#FCD116)
    } else if (score === 4) {
      text = 'Strong Security';
      color = 'var(--secondary)'; // UENR Deep Blue (#3a5f94)
    } else if (score === 5) {
      text = 'Quantum-Grade Security';
      color = 'var(--tertiary)'; // Ghana Green (#046d3f)
    }
    return { score, text, color };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName || !lastName || !email || !institution || !idNumber || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    // Institutional email validation
    const allowedDomains = ['@uenr.edu.gh', '@ug.edu.gh', '@knust.edu.gh', '@ucom.edu.gh', '@ucc.edu.gh'];
    const hasAllowedDomain = allowedDomains.some(domain => email.toLowerCase().endsWith(domain));
    if (!hasAllowedDomain) {
      setError('Please use a valid institutional email address (e.g. @uenr.edu.gh, @ug.edu.gh, or @knust.edu.gh).');
      return;
    }

    // ID validation
    if (role === 'student') {
      const studentIdPattern = /^UEB\d{7}$/i;
      if (!studentIdPattern.test(idNumber)) {
        setError('Student ID Number must start with "UEB" followed by exactly 7 digits (e.g. UEB1234567).');
        return;
      }
    } else {
      if (idNumber.trim().length < 5) {
        setError('Staff ID Number must be at least 5 characters long.');
        return;
      }
    }

    // Password matching
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Minimum strength check
    if (strength.score < 2) {
      setError('Password is too weak. Please choose a stronger password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await registerUser({
        firstName,
        lastName,
        email,
        role,
        school: institution,
        idNumber,
        password,
      });
      saveSessionToken(user.sessionToken);
      navigate('/messages');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="bg-shape one"></div>
      <div className="bg-shape two"></div>

      <main className="auth-main">
        <div className="auth-card register">
          <div className="auth-content">
            <div className="auth-title-container center">
              <div className="auth-title-icon">
                <span className="material-symbols-outlined" data-icon="school">school</span>
              </div>
              <h1 className="auth-title">Ghana Education Connect</h1>
              <p className="auth-subtitle uppercase">Create Your Academic Identity</p>
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

              <div className="auth-row">
                <div className="auth-field-group">
                  <label className="auth-label" htmlFor="first_name">First Name</label>
                  <input 
                    type="text" 
                    id="first_name" 
                    className="auth-input" 
                    placeholder="e.g. Kwame" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="auth-field-group">
                  <label className="auth-label" htmlFor="last_name">Last Name</label>
                  <input 
                    type="text" 
                    id="last_name" 
                    className="auth-input" 
                    placeholder="e.g. Mensah" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-label" htmlFor="email">Institutional Email</label>
                <input 
                  type="email" 
                  id="email" 
                  className="auth-input" 
                  placeholder="username@uenr.edu.gh" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="auth-input-hint">Please use your official @uenr.edu.gh, @ug.edu.gh, or @knust.edu.gh email address.</p>
              </div>

              <div className="auth-field-group" ref={institutionRef}>
                <label className="auth-label" htmlFor="institution">Institution</label>
                <div className="institution-combobox-wrapper">
                  <div className="auth-input-wrapper">
                    <span className="material-symbols-outlined auth-input-icon" style={{ left: '0.875rem' }}>school</span>
                    <input
                      type="text"
                      id="institution"
                      className="auth-input"
                      style={{ paddingLeft: '2.75rem', paddingRight: '2.5rem', borderRadius: '0.75rem', border: 'none' }}
                      placeholder="Search or enter your institution..."
                      value={institution}
                      onChange={(e) => {
                        setInstitution(e.target.value);
                        setShowInstitutionDropdown(true);
                      }}
                      onFocus={() => setShowInstitutionDropdown(true)}
                      autoComplete="off"
                    />
                    <span
                      className="material-symbols-outlined auth-select-icon"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setShowInstitutionDropdown(v => !v)}
                    >
                      {showInstitutionDropdown ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>

                  {showInstitutionDropdown && (
                    <div className="institution-dropdown">
                      {filteredInstitutions.length > 0 ? (
                        filteredInstitutions.map((inst) => (
                          <button
                            key={inst}
                            type="button"
                            className={`institution-option ${institution === inst ? 'selected' : ''}`}
                            onClick={() => {
                              setInstitution(inst);
                              setShowInstitutionDropdown(false);
                            }}
                          >
                            <span className="material-symbols-outlined">account_balance</span>
                            {inst}
                          </button>
                        ))
                      ) : (
                        <div className="institution-no-match">
                          <span className="material-symbols-outlined">add_circle</span>
                          <span>Using <strong>&ldquo;{institution}&rdquo;</strong> as your institution</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="auth-input-hint">Type to search — if your school isn&apos;t listed, just continue with what you entered.</p>
              </div>

              <div className="auth-field-group">
                <label className="auth-label" htmlFor="id_number">{idLabel}</label>
                <input 
                  type="text" 
                  id="id_number" 
                  className="auth-input" 
                  placeholder={idPlaceholder} 
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  required
                />
              </div>

              <div className="auth-row">
                <div className="auth-field-group">
                  <label className="auth-label" htmlFor="password">Password</label>
                  <div className="auth-input-wrapper">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      id="password" 
                      className="auth-input" 
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
                  <div className="password-strength">
                    {[1, 2, 3, 4].map((barIndex) => {
                      let isFilled = false;
                      if (strength.score >= 1 && barIndex === 1) isFilled = true;
                      else if (strength.score >= 2 && barIndex <= 2) isFilled = true;
                      else if (strength.score >= 3 && barIndex <= 3) isFilled = true;
                      else if (strength.score >= 4 && barIndex <= 4) isFilled = true;

                      return (
                        <div 
                          key={barIndex} 
                          className="strength-bar"
                          style={{
                            backgroundColor: isFilled ? strength.color : 'var(--surface-container-highest)',
                            transition: 'background-color 0.3s ease'
                          }}
                        />
                      );
                    })}
                  </div>
                  <p className="strength-text" style={{ color: strength.color, transition: 'color 0.3s ease' }}>
                    {strength.text}
                  </p>
                </div>
                <div className="auth-field-group">
                  <label className="auth-label" htmlFor="confirm_password">Confirm</label>
                  <div className="auth-input-wrapper">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      id="confirm_password" 
                      className="auth-input" 
                      style={{ paddingRight: '2.5rem' }}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <span 
                      className="material-symbols-outlined" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ 
                        position: 'absolute', 
                        right: '0.875rem', 
                        color: 'var(--on-surface-variant)', 
                        cursor: 'pointer', 
                        userSelect: 'none',
                        fontSize: '1.25rem'
                      }}
                    >
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </div>
                </div>
              </div>

              <button type="submit" className="auth-submit large mt-4" disabled={isSubmitting}>
                <span className="material-symbols-outlined">{isSubmitting ? 'hourglass_top' : 'how_to_reg'}</span>
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>

            </form>

            <div className="auth-footer-text">
              <p>
                Already have an account? 
                <Link to="/login">Login here</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;

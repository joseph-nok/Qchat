import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import AppHeader from '../components/AppHeader';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext.jsx';
import '../route_css/MessagesList.css';
import '../route_css/VerifyProfile.css';

const convexApi = api as any;

const GHANA_INSTITUTIONS = [
  'University of Energy and Natural Resources (UENR)',
  'University of Ghana',
  'KNUST',
  'University of Cape Coast (UCC)',
  'Ghana Institute of Management and Public Administration (GIMPA)',
  'University for Development Studies (UDS)',
];

const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Electrical and Electronic Engineering',
  'Natural Resources Management',
  'Business Administration',
  'Mathematics and Statistics',
  'Agriculture and Food Science',
];

const statusCopy = {
  unverified: {
    label: 'Unverified',
    heading: 'Verification required',
    body: 'Complete the form below to establish your verified academic identity with your institution.',
    icon: 'shield_lock',
  },
  pending: {
    label: 'Pending Review',
    heading: 'Verification in progress',
    body: 'Your academic identity is under institutional review.',
    icon: 'manage_search',
  },
  verified: {
    label: 'Verified Profile',
    heading: 'Profile verified',
    body: 'Your academic identity is active and trusted across Qchat.',
    icon: 'verified_user',
  },
};

type UiStatus = keyof typeof statusCopy;

const VerifyProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser, sessionToken, isLoading: authLoading } = useAuth();
  const generateUploadUrl = useMutation(convexApi.qchat.generateUploadUrl);
  const submitAcademicVerification = useMutation(convexApi.qchat.submitAcademicVerification);

  const [idNumber, setIdNumber] = useState('');
  const [institution, setInstitution] = useState(GHANA_INSTITUTIONS[0]);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setIdNumber(currentUser.idNumber || '');
    setInstitution(currentUser.school || GHANA_INSTITUTIONS[0]);
    setSubmitted(currentUser.verificationStatus === 'pending');
  }, [currentUser]);

  const status: UiStatus = useMemo(() => {
    if (currentUser?.verificationStatus === 'approved') return 'verified';
    if (submitted || currentUser?.verificationStatus === 'pending') return 'pending';
    return 'unverified';
  }, [currentUser?.verificationStatus, submitted]);

  const formLocked = status === 'pending' || status === 'verified' || isSubmitting;

  const handleFileChange = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PNG, JPG, or PDF document.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('The selected file is larger than 5MB.');
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!sessionToken) {
      navigate('/login');
      return;
    }

    if (!idNumber.trim() || !institution.trim() || !department.trim()) {
      setError('Please complete all verification fields.');
      return;
    }

    if (!selectedFile) {
      setError('Please upload your official ID card before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error('The document upload failed. Please try again.');
      }

      const { storageId } = await uploadResponse.json();
      await submitAcademicVerification({
        sessionToken,
        storageId,
        school: institution,
        idNumber: idNumber.toUpperCase(),
      });
      setSubmitted(true);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sessionToken && !authLoading) {
    navigate('/login');
    return null;
  }

  if (authLoading || !currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--surface)', color: 'var(--secondary)', fontWeight: 700 }}>
        Loading verification profile...
      </div>
    );
  }

  const userRole = currentUser.role === 'lecturer' ? 'Lecturer' : 'Student';
  const copy = statusCopy[status];

  return (
    <div className="dashboard-layout" style={{ background: 'var(--surface)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader userName={currentUser.fullName} userRole={userRole} profileImage={currentUser.avatarUrl} />
      <Sidebar />

      <main className="app-main">
        <div className="verify-profile-inner">
          <div className="page-header verify-page-header">
            <div>
              <h1 className="page-title">Verify Profile</h1>
              <p className="page-subtitle">Submit your academic identity for institutional review and secure profile verification.</p>
            </div>
            <div className={`verify-status-pill ${status}`}>
              <span className="material-symbols-outlined">
                {status === 'verified' ? 'verified' : status === 'pending' ? 'hourglass_top' : 'warning'}
              </span>
              <span>{copy.label}</span>
            </div>
          </div>

          <div className="verify-grid">
            <section className="verify-main-column">
              <div className={`verify-alert ${status}`}>
                <div className="verify-alert-icon">
                  <span className="material-symbols-outlined">{copy.icon}</span>
                </div>
                <div>
                  <h2>{copy.heading}</h2>
                  <p>{copy.body}</p>
                </div>
              </div>

              {error && (
                <div className="verify-error">
                  <span className="material-symbols-outlined">error</span>
                  <span>{error}</span>
                </div>
              )}

              <form className="verify-form-card" onSubmit={(event) => void handleSubmit(event)}>
                <div className="verify-form-grid">
                  <label className="verify-field">
                    <span>Institutional Email</span>
                    <input type="email" value={currentUser.email} disabled />
                    <small>Your login email is tied to this verification request.</small>
                  </label>

                  <label className="verify-field">
                    <span>{currentUser.role === 'lecturer' ? 'Staff ID Number' : 'Student ID Number'}</span>
                    <input
                      type="text"
                      value={idNumber}
                      disabled={formLocked}
                      onChange={(event) => setIdNumber(event.target.value)}
                      placeholder={currentUser.role === 'lecturer' ? 'STF1234567' : 'UEB1234567'}
                    />
                  </label>

                  <label className="verify-field">
                    <span>Institution</span>
                    <select value={institution} disabled={formLocked} onChange={(event) => setInstitution(event.target.value)}>
                      {GHANA_INSTITUTIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>

                  <label className="verify-field">
                    <span>Department</span>
                    <select value={department} disabled={formLocked} onChange={(event) => setDepartment(event.target.value)}>
                      {DEPARTMENTS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {status === 'pending' && (
                  <div className="verify-alert pending" style={{ marginTop: '1rem' }}>
                    Your academic identity is under institutional review.
                  </div>
                )}

                <div className="verify-upload-block">
                  <div>
                    <h3>Academic ID Card</h3>
                    <p>Upload a clear scan or photo of your student or staff ID.</p>
                  </div>

                  <button
                    type="button"
                    className={`verify-upload-dropzone ${selectedFile ? 'has-file' : ''}`}
                    disabled={formLocked}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="material-symbols-outlined">upload_file</span>
                    <strong>{selectedFile ? selectedFile.name : 'Select ID document'}</strong>
                    <small>PNG, JPG, or PDF up to 5MB</small>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={(event) => handleFileChange(event.target.files)}
                    hidden
                  />
                </div>

                <div className="verify-form-actions">
                  <button type="submit" className="verify-submit-btn" disabled={formLocked}>
                    <span className="material-symbols-outlined">{isSubmitting ? 'hourglass_top' : 'send'}</span>
                    {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
                  </button>
                </div>
              </form>
            </section>

            <aside className="verify-side-column">
              <div className="verify-benefits-card">
                <div className="verify-card-heading">
                  <span className="material-symbols-outlined">verified</span>
                  <h2>Verification Benefits</h2>
                </div>

                {[
                  ['Full access', 'Unlock secure messaging, discovery, and credential workflows.'],
                  ['Verified badge', 'Show students and lecturers that your identity is trusted.'],
                  ['Credential sharing', 'Prepare your profile for cross-institution academic requests.'],
                ].map(([title, body]) => (
                  <div className="verify-benefit" key={title}>
                    <span className="material-symbols-outlined">check</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="verify-security-card">
                <span className="material-symbols-outlined">lock_person</span>
                <h2>Privacy and Security</h2>
                <p>Your uploaded document is stored in Convex File Storage and linked only to your verification review.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VerifyProfile;

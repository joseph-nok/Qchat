import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import AppHeader from '../components/AppHeader';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext.jsx';
import { clearSessionToken } from '../lib/session';
import { relayHashToBesu } from '../utils/cryptoBridge';
import '../route_css/MessagesList.css';
import '../route_css/EditProfile.css';

const convexApi = api as any;

const GHANA_INSTITUTIONS = [
  'University of Energy and Natural Resources (UENR)',
  'University of Ghana',
  'KNUST',
  'University of Cape Coast (UCC)',
  'Ghana Institute of Management and Public Administration (GIMPA)',
  'University for Development Studies (UDS)',
];

type ProfileForm = {
  fullName: string;
  bio: string;
  school: string;
  avatarUrl: string;
};

const getInitials = (name: string) => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase();

const EditProfile = () => {
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { currentUser, sessionToken, isLoading: authLoading } = useAuth();
  const me = useQuery(convexApi.users.getMe, sessionToken ? { sessionToken } : 'skip');
  const generateUploadUrl = useMutation(convexApi.qchat.generateUploadUrl);
  const updateProfile = useMutation(convexApi.qchat.updateProfile);
  const deleteAccount = useMutation(convexApi.qchat.deleteAccount);
  const profile = me ?? currentUser;

  const [form, setForm] = useState<ProfileForm>({
    fullName: '',
    bio: '',
    school: GHANA_INSTITUTIONS[0],
    avatarUrl: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      fullName: profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
      bio: profile.bio || '',
      school: profile.school || profile.institution || GHANA_INSTITUTIONS[0],
      avatarUrl: profile.avatarUrl || profile.profileImage || '',
    });
  }, [profile]);

  useEffect(() => {
    if (!message) return;
    const timeoutId = window.setTimeout(() => setMessage(''), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [message]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  const userRole = useMemo(() => {
    if (!profile) return 'Academic Member';
    return profile.role === 'lecturer' ? 'Lecturer' : 'Student';
  }, [profile]);

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleAvatarChange = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please choose a PNG, JPG, or WEBP image for your avatar.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError('Profile images must be 4MB or smaller.');
      return;
    }

    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setSelectedAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!sessionToken) {
      navigate('/login');
      return;
    }

    if (!form.fullName.trim()) {
      setError('Full name cannot be empty.');
      return;
    }

    if (!form.school.trim()) {
      setError('School name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      let avatarStorageId: Id<'_storage'> | undefined;
      if (selectedAvatarFile) {
        const uploadUrl = await generateUploadUrl();
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': selectedAvatarFile.type },
          body: selectedAvatarFile,
        });

        if (!uploadResponse.ok) {
          throw new Error('Profile image upload failed. Please try again.');
        }

        const uploadResult = await uploadResponse.json();
        avatarStorageId = uploadResult.storageId;
      }

      await updateProfile({
        sessionToken,
        fullName: form.fullName,
        bio: form.bio,
        school: form.school,
        avatarStorageId,
      });
      setSelectedAvatarFile(null);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!sessionToken || !profile) return;
    setIsDeletingAccount(true);
    setError('');
    setMessage('');
    try {
      const userId = profile._id;

      // 1. Submit account deletion to Convex backend
      await deleteAccount({ sessionToken });

      // 2. Relay the deletion transaction to the Besu network
      // (Binds the user address to "deleted" role on-ledger)
      try {
        await relayHashToBesu("APPROVE_USER", userId, "ACCOUNT_DELETED", { role: "deleted" });
        console.log("[Blockchain Sync] Account deletion recorded on Besu.");
      } catch (blockchainErr) {
        console.error("[Blockchain Sync] Failed to record deletion on Besu:", blockchainErr);
      }

      // 3. Clear local session cookies and redirect
      clearSessionToken();
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account.');
      setIsDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!sessionToken && !authLoading) {
    navigate('/login');
    return null;
  }

  if (authLoading || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--surface)', color: 'var(--secondary)', fontWeight: 700 }}>
        Loading profile...
      </div>
    );
  }

  const avatarSrc = avatarPreviewUrl || form.avatarUrl;

  return (
    <div className="dashboard-layout" style={{ background: 'var(--surface)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader userName={form.fullName || profile.fullName} userRole={userRole} profileImage={avatarSrc} />
      <Sidebar />

      <main className="app-main">
        <div className="edit-profile-inner">
          <div className="page-header edit-profile-header">
            <div>
              <h1 className="page-title">Edit Profile</h1>
              {/* <p className="page-subtitle">Update your live Qchat profile details from Convex.</p> */}
            </div>
          </div>

          <form className="edit-profile-grid" onSubmit={(event) => void handleSubmit(event)}>
            <section className="edit-profile-main">
              {message && (
                <div className="edit-profile-notice success">
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="edit-profile-notice error">
                  <span className="material-symbols-outlined">error</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="edit-profile-card">
                <div className="edit-card-heading">
                  <span className="material-symbols-outlined">badge</span>
                  <div>
                    <h2>Public Profile</h2>
                    <p>These fields are synced to Convex and update everywhere they are queried.</p>
                  </div>
                </div>

                <div className="edit-photo-row">
                  <div className="edit-photo-preview">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={`${form.fullName} profile preview`} />
                    ) : (
                      <span>{getInitials(form.fullName || profile.fullName) || 'QC'}</span>
                    )}
                  </div>
                  <div className="edit-photo-copy">
                    <h3>Profile Image</h3>
                    <p>Upload a JPG, PNG, or WEBP image to store your avatar in Convex.</p>
                    <div className="edit-photo-actions">
                      <button
                        type="button"
                        className="edit-secondary-btn"
                        disabled={isSaving}
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <span className="material-symbols-outlined">upload</span>
                        Choose Image
                      </button>
                      {selectedAvatarFile && <span className="edit-selected-file">{selectedAvatarFile.name}</span>}
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      onChange={(event) => handleAvatarChange(event.target.files)}
                      hidden
                    />
                  </div>
                </div>

                <div className="edit-form-grid">
                  <label className="edit-field">
                    <span>Full Name</span>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(event) => updateField('fullName', event.target.value)}
                      placeholder="Kwame Mensah"
                    />
                  </label>

                  <label className="edit-field">
                    <span>School Name</span>
                    <select value={form.school} onChange={(event) => updateField('school', event.target.value)}>
                      {GHANA_INSTITUTIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="edit-field">
                  <span>Bio</span>
                  <textarea
                    value={form.bio}
                    onChange={(event) => updateField('bio', event.target.value)}
                    maxLength={240}
                    placeholder="Share a short academic bio, research interest, or role summary."
                  />
                  <small>{form.bio.length}/240 characters</small>
                </label>
              </div>

              {/* Danger Zone card */}
              <div className="edit-profile-card danger-zone" style={{ border: '1px solid var(--error)', background: 'rgba(186, 26, 26, 0.02)', marginTop: '1.5rem' }}>
                <div className="edit-card-heading">
                  <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>warning</span>
                  <div>
                    <h2 style={{ color: 'var(--error)' }}>Danger Zone</h2>
                    <p>Permanently remove your account from Convex and register its deletion on the blockchain.</p>
                  </div>
                </div>

                {showDeleteConfirm ? (
                  <div style={{ background: 'var(--surface-container-low)', padding: '1rem', borderRadius: '0.75rem', border: '1px dashed var(--error)' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--on-surface)', fontWeight: 700, marginBottom: '0.75rem' }}>
                      Are you absolutely sure you want to delete your account? This will revoke your verified role on the blockchain and delete your profile.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        type="button"
                        className="edit-secondary-btn"
                        onClick={() => void handleDeleteAccount()}
                        disabled={isDeletingAccount}
                        style={{ background: 'var(--error)', color: 'white' }}
                      >
                        {isDeletingAccount ? 'Deleting...' : 'Yes, Delete Account'}
                      </button>
                      <button
                        type="button"
                        className="edit-secondary-btn"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeletingAccount}
                        style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--outline)', marginBottom: '1rem' }}>
                      This action is irreversible. Your Web2 credentials and active session will be permanently erased. A role-revocation transaction will be permanently registered on the Hyperledger Besu blockchain.
                    </p>
                    <button
                      type="button"
                      className="edit-ghost-btn"
                      onClick={() => setShowDeleteConfirm(true)}
                      style={{ borderColor: 'var(--error)', color: 'var(--error)', width: 'auto' }}
                    >
                      <span className="material-symbols-outlined">delete_forever</span>
                      Delete Account
                    </button>
                  </>
                )}
              </div>

              <div className="edit-profile-actions">
                <button type="submit" className="edit-submit-btn" disabled={isSaving}>
                  <span className="material-symbols-outlined">{isSaving ? 'hourglass_top' : 'save'}</span>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </section>

            <aside className="edit-profile-side">
              <div className="edit-summary-card">
                <div className="edit-avatar">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={`${form.fullName} profile`} />
                  ) : (
                    getInitials(form.fullName || profile.fullName) || 'QC'
                  )}
                </div>
                <h2>{form.fullName}</h2>
                <p>{userRole}</p>
                <div className="edit-summary-line">
                  <span className="material-symbols-outlined">mail</span>
                  <span>{profile.email}</span>
                </div>
                <div className="edit-summary-line">
                  <span className="material-symbols-outlined">business</span>
                  <span>{form.school}</span>
                </div>
              </div>

              
            </aside>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EditProfile;

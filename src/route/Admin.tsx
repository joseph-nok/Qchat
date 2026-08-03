import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import { clearAdminSessionToken, getAdminSessionToken, onAdminSessionTokenChange } from '../lib/adminSession';
import '../route_css/MessagesList.css';
import '../route_css/Admin.css';

const convexApi = api as any;

type ReviewStatus = 'pending' | 'approved' | 'rejected';

type AdminUser = {
  requestId: Id<'verificationRequests'>;
  userId: Id<'users'>;
  fullName: string;
  email: string;
  role: 'student' | 'lecturer';
  school: string;
  avatarUrl?: string;
  verificationStatus: 'unverified' | 'pending' | 'approved';
  verificationSubmittedAt: number;
  idNumber?: string;
  evidenceUrl?: string;
};

const getInitials = (name: string) => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase();

const formatSubmittedDate = (timestamp?: number) => timestamp
  ? new Intl.DateTimeFormat('en-GH', { day: 'numeric', month: 'short', year: 'numeric' }).format(timestamp)
  : 'Awaiting submission';

const Admin = () => {
  const navigate = useNavigate();
  const [adminSessionToken, setAdminSessionToken] = useState(() => getAdminSessionToken());
  const adminProfile = useQuery(convexApi.admin.getMe, adminSessionToken ? { sessionToken: adminSessionToken } : 'skip');
  const requests = useQuery(
    convexApi.admin.getVerificationRequests,
    adminSessionToken && adminProfile ? { sessionToken: adminSessionToken } : 'skip',
  ) as AdminUser[] | undefined;
  const reviewVerificationRequest = useMutation(convexApi.admin.reviewVerificationRequest);
  const [activeStatus, setActiveStatus] = useState<'pending' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<Id<'verificationRequests'> | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => onAdminSessionTokenChange(() => setAdminSessionToken(getAdminSessionToken())), []);

  useEffect(() => {
    if (!adminSessionToken) navigate('/admin/login');
  }, [adminSessionToken, navigate]);

  useEffect(() => {
    if (adminProfile === null) {
      clearAdminSessionToken();
      navigate('/admin/login');
    }
  }, [adminProfile, navigate]);

  const members = requests ?? [];
  const statusFor = (user: AdminUser): ReviewStatus => user.verificationStatus;
  const pendingCount = members.filter((user) => statusFor(user) === 'pending').length;
  const approvedCount = members.filter((user) => statusFor(user) === 'approved').length;
  const reviewQueue = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return members.filter((user) => {
      const status = statusFor(user);
      const matchesStatus = activeStatus === 'all' || status === 'pending';
      const matchesSearch = !term || [user.fullName, user.email, user.school].some((value) => value.toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [activeStatus, members, searchQuery]);

  const selectedUser = members.find((user) => user.requestId === selectedId) ?? reviewQueue[0];

  const handleReview = async (requestId: Id<'verificationRequests'>, status: 'approved' | 'rejected') => {
    if (!adminSessionToken) return;
    setIsReviewing(true);
    try {
      await reviewVerificationRequest({ sessionToken: adminSessionToken, requestId, status });
      setSelectedId(null);
    } finally {
      setIsReviewing(false);
    }
  };

  if (!adminSessionToken || adminProfile === null) {
    return null;
  }

  if (adminProfile === undefined || requests === undefined) {
    return <div className="admin-loading">Preparing verification desk...</div>;
  }

  return (
    <div className="dashboard-layout admin-layout">
      <AppHeader userName={adminProfile.displayName} userRole="Administrator" />

      <main className="app-main admin-main">
        <div className="admin-main-inner">
          <div className="admin-eyebrow"><span className="material-symbols-outlined">admin_panel_settings</span> Administration / Identity review</div>
          <div className="admin-page-header">
            <div>
              <h1 className="admin-title">Verification desk</h1>
              <p className="admin-subtitle">Review academic identity requests before they join the network.</p>
            </div>
            <div className="admin-header-actions"><div className="admin-date-chip"><span className="material-symbols-outlined">calendar_today</span>{new Intl.DateTimeFormat('en-GH', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}</div><button className="admin-logout" type="button" onClick={() => { clearAdminSessionToken(); navigate('/admin/login'); }}>Sign out</button></div>
          </div>

          <section className="admin-stats" aria-label="Verification overview">
            <div className="admin-stat admin-stat-primary"><span className="admin-stat-label">Needs review</span><strong>{pendingCount}</strong><span className="admin-stat-foot"><span className="material-symbols-outlined">priority_high</span> Pending applications</span></div>
            <div className="admin-stat"><span className="admin-stat-label">Verified members</span><strong>{approvedCount}</strong><span className="admin-stat-foot"><span className="material-symbols-outlined">verified</span> Approved identities</span></div>
            <div className="admin-stat"><span className="admin-stat-label">Directory size</span><strong>{members.length}</strong><span className="admin-stat-foot"><span className="material-symbols-outlined">groups</span> Registered members</span></div>
          </section>

          <div className="admin-workspace">
            <section className="admin-queue-panel">
              <div className="admin-panel-heading">
                <div><span className="admin-section-kicker">Review queue</span><h2>Identity requests</h2></div>
                <span className="admin-count-badge">{reviewQueue.length} visible</span>
              </div>
              <div className="admin-toolbar">
                <div className="admin-search"><span className="material-symbols-outlined">search</span><input aria-label="Search verification requests" placeholder="Search by name, email, or institution" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></div>
                <div className="admin-tabs" role="tablist" aria-label="Request status"><button className={activeStatus === 'pending' ? 'active' : ''} onClick={() => setActiveStatus('pending')}>Pending <span>{pendingCount}</span></button><button className={activeStatus === 'all' ? 'active' : ''} onClick={() => setActiveStatus('all')}>All members</button></div>
              </div>

              {reviewQueue.length === 0 ? <div className="admin-empty"><span className="material-symbols-outlined">task_alt</span><p>No requests match this view.</p><small>New identity submissions will appear here for review.</small></div> : (
                <div className="admin-request-list">
                  {reviewQueue.map((user) => {
                    const status = statusFor(user);
                    return <button type="button" className={`admin-request ${selectedUser?.requestId === user.requestId ? 'selected' : ''}`} key={user.requestId} onClick={() => setSelectedId(user.requestId)}>
                      <span className="admin-avatar">{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : getInitials(user.fullName)}</span>
                      <span className="admin-request-copy"><strong>{user.fullName}</strong><span>{user.school}</span><small>{user.role === 'lecturer' ? 'Lecturer' : 'Student'} · Submitted {formatSubmittedDate(user.verificationSubmittedAt)}</small></span>
                      <span className={`admin-status-dot ${status}`} aria-label={status} />
                      <span className="material-symbols-outlined admin-chevron">chevron_right</span>
                    </button>;
                  })}
                </div>
              )}
            </section>

            <aside className="admin-detail-panel">
              {selectedUser ? <>
                <div className="admin-detail-top"><span className="admin-section-kicker">Application details</span><span className={`admin-status-pill ${statusFor(selectedUser)}`}>{statusFor(selectedUser)}</span></div>
                <div className="admin-detail-profile"><span className="admin-detail-avatar">{selectedUser.avatarUrl ? <img src={selectedUser.avatarUrl} alt="" /> : getInitials(selectedUser.fullName)}</span><h2>{selectedUser.fullName}</h2><p>{selectedUser.email}</p></div>
                <div className="admin-detail-facts"><div><span>Institution</span><strong>{selectedUser.school}</strong></div><div><span>Role</span><strong>{selectedUser.role === 'lecturer' ? 'Lecturer' : 'Student'}</strong></div><div><span>Submitted</span><strong>{formatSubmittedDate(selectedUser.verificationSubmittedAt)}</strong></div></div>
                <div className="admin-evidence-card"><div className="admin-evidence-icon"><span className="material-symbols-outlined">badge</span></div><div><strong>Academic credentials</strong><p>{selectedUser.evidenceUrl ? 'Evidence submitted for this application.' : 'No evidence link is attached to this application.'}</p></div>{selectedUser.evidenceUrl && <a href={selectedUser.evidenceUrl} target="_blank" rel="noreferrer" aria-label="Open academic credentials"><span className="material-symbols-outlined">open_in_new</span></a>}</div>
                {statusFor(selectedUser) === 'pending' && <div className="admin-actions"><button type="button" className="admin-reject" disabled={isReviewing} onClick={() => void handleReview(selectedUser.requestId, 'rejected')}><span className="material-symbols-outlined">close</span>Reject</button><button type="button" className="admin-approve" disabled={isReviewing} onClick={() => void handleReview(selectedUser.requestId, 'approved')}><span className="material-symbols-outlined">verified</span>{isReviewing ? 'Saving...' : 'Approve identity'}</button></div>}
              </> : <div className="admin-empty admin-detail-empty"><span className="material-symbols-outlined">fact_check</span><p>Select a request to inspect its details.</p></div>}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;

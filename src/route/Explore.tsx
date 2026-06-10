import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import AppHeader from '../components/AppHeader';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext.jsx';
import '../route_css/MessagesList.css';
import '../route_css/Explore.css';

const convexApi = api as any;

type ExploreUser = {
  _id: Id<'users'>;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: 'student' | 'lecturer';
  school: string;
  institution: string;
  avatarUrl?: string;
  verificationStatus: 'unverified' | 'pending' | 'approved';
  isVerified: boolean;
};

const avatarColor = (name: string) => {
  const palette = [
    ['#3a5f94', '#e8f0fb'],
    ['#046d3f', '#e6f4ed'],
    ['#715c00', '#fdf6d8'],
    ['#7b3f9e', '#f5eafb'],
    ['#c0392b', '#fdecea'],
    ['#1a6b8a', '#e3f4fa'],
  ];
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) & 0xffffff;
  return palette[h % palette.length];
};

const getInitials = (name: string) => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase();

const Explore = () => {
  const navigate = useNavigate();
  const { currentUser, sessionToken, isLoading: authLoading } = useAuth();
  const exploreUsers = useQuery(convexApi.qchat.getExploreUsers, sessionToken ? { sessionToken } : 'skip') as ExploreUser[] | undefined;
  const getOrCreateRoom = useMutation(convexApi.qchat.getOrCreateRoom);
  const users = exploreUsers ?? [];

  const [query, setQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [chatFeedback, setChatFeedback] = useState<string | null>(null);
  const [error, setError] = useState('');

  const schools = useMemo(() => {
    const uniqueSchools = new Set(users.map((user) => user.school).filter(Boolean));
    return ['all', ...Array.from(uniqueSchools).sort((a, b) => a.localeCompare(b))];
  }, [users]);

  const visibleUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery =
        !term ||
        user.fullName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);
      const matchesSchool = schoolFilter === 'all' || user.school === schoolFilter;
      return matchesQuery && matchesSchool;
    });
  }, [users, query, schoolFilter]);

  const handleStartChat = async (person: ExploreUser) => {
    if (!sessionToken) {
      navigate('/login');
      return;
    }

    setError('');
    setChatFeedback(person.fullName);

    try {
      const result = await getOrCreateRoom({ sessionToken, targetUserId: person._id });
      navigate(`/messages?roomId=${result.roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open this chat room.');
      setChatFeedback(null);
    }
  };

  useEffect(() => {
    if (!sessionToken && !authLoading) navigate('/login');
  }, [authLoading, navigate, sessionToken]);

  if (!sessionToken && !authLoading) return null;

  if (authLoading || !currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--surface)', color: 'var(--secondary)', fontWeight: 700 }}>
        Loading academic network...
      </div>
    );
  }

  const userRole = currentUser.role === 'student' ? 'Student' : 'Lecturer';

  return (
    <div className="dashboard-layout" style={{ background: 'var(--surface)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader userName={currentUser.fullName} userRole={userRole} profileImage={currentUser.avatarUrl} />
      <Sidebar />

      <main className="app-main">
        <div className="app-main-inner">
          <div className="page-header" style={{ marginBottom: '2rem' }}>
            <div>
              <h1 className="page-title">Explore</h1>
              <p className="page-subtitle">Discover students and lecturers across Ghana's academic network.</p>
            </div>
            <div className="explore-stats">
              <div className="explore-stat">
                <span className="explore-stat-number">{users.length}</span>
                <span className="explore-stat-label">Members</span>
              </div>
              <div className="explore-stat-divider" />
              <div className="explore-stat">
                <span className="explore-stat-number">{users.filter((user) => user.role === 'lecturer').length}</span>
                <span className="explore-stat-label">Lecturers</span>
              </div>
              <div className="explore-stat-divider" />
              <div className="explore-stat">
                <span className="explore-stat-number">{users.filter((user) => user.role === 'student').length}</span>
                <span className="explore-stat-label">Students</span>
              </div>
            </div>
          </div>

          <div className="explore-search-row">
            <div className="search-wrapper" style={{ flex: 1, marginBottom: 0 }}>
              <span className="material-symbols-outlined search-icon">search</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search by name or institutional email..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoComplete="off"
              />
              {query && (
                <button className="explore-clear-btn" onClick={() => setQuery('')} title="Clear search">
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>

            <select
              className="filter-tag active"
              value={schoolFilter}
              onChange={(event) => setSchoolFilter(event.target.value)}
              aria-label="Filter by school"
            >
              {schools.map((school) => (
                <option key={school} value={school}>
                  {school === 'all' ? 'All Schools' : school}
                </option>
              ))}
            </select>
          </div>

          <p className="explore-result-count">
            {visibleUsers.length === 0
              ? 'No members found'
              : `${visibleUsers.length} member${visibleUsers.length !== 1 ? 's' : ''} found`}
          </p>

          {error && <div className="explore-toast" style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>{error}</div>}

          {chatFeedback && (
            <div className="explore-toast">
              <span className="material-symbols-outlined">chat_bubble</span>
              Opening chat with <strong>{chatFeedback}</strong>...
            </div>
          )}

          {visibleUsers.length > 0 ? (
            <div className="explore-grid">
              {visibleUsers.map((user) => {
                const [fg, bg] = avatarColor(user.fullName);
                const isLecturer = user.role === 'lecturer';

                return (
                  <div key={user._id} className="explore-card">
                    <div className="explore-avatar" style={{ background: bg, color: fg }}>
                      {user.avatarUrl ? <img src={user.avatarUrl} alt={`${user.fullName} avatar`} /> : getInitials(user.fullName)}
                    </div>

                    <div className="explore-card-info">
                      <div className="explore-name-row">
                        <h3 className="explore-name">{user.fullName}</h3>
                        <span className={`explore-role-badge ${isLecturer ? 'lecturer' : 'student'}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: '0.75rem', fontVariationSettings: "'FILL' 1" }}>
                            {isLecturer ? 'school' : 'person'}
                          </span>
                          {isLecturer ? 'Lecturer' : 'Student'}
                        </span>
                      </div>

                      <p className="explore-email">
                        <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>mail</span>
                        <span className="explore-detail-text">{user.email}</span>
                      </p>

                      <p className="explore-institution">
                        <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>account_balance</span>
                        <span className="explore-detail-text">{user.school}</span>
                      </p>
                    </div>

                    <button className="explore-chat-btn" onClick={() => void handleStartChat(user)} title={`Start chat with ${user.fullName}`}>
                      <span className="material-symbols-outlined">chat_bubble</span>
                      <span>Message</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-conversations">
              <span className="material-symbols-outlined no-conv-icon">manage_search</span>
              <p>No members match your search.</p>
            </div>
          )}

          <div className="end-of-conversations" style={{ marginTop: '3rem' }}>
            <p className="end-label">End of results</p>
            <div className="end-bar" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Explore;

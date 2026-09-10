import { useState } from 'react';
import { useMutation } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext.jsx';
import type { Id } from '../../convex/_generated/dataModel';

const convexApi = api as any;

type PublicAuthor = {
  _id: Id<'users'>;
  fullName: string;
  role: 'student' | 'lecturer';
  school: string;
  rank?: string;
  avatarUrl?: string;
  departmentId?: Id<'departments'> | null;
  departmentName?: string | null;
  specializations?: string[];
  walletAddress?: string;
};

interface LecturerProfileBadgeProps {
  author: PublicAuthor;
  compact?: boolean;
}

const formatAcademicName = (author: PublicAuthor) => {
  const rank = author.role === 'lecturer' ? author.rank?.trim() : '';
  return rank && !author.fullName.startsWith(`${rank} `)
    ? `${rank} ${author.fullName}`
    : author.fullName;
};

export const LecturerProfileBadge = ({ author, compact = false }: LecturerProfileBadgeProps) => {
  const navigate = useNavigate();
  const { sessionToken, currentUser } = useAuth();
  const getOrCreateRoom = useMutation(convexApi.qchat.getOrCreateRoom);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const isLecturer = author.role === 'lecturer';
  const isSelf = currentUser?._id === author._id;

  const handleStartMessage = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!sessionToken || isSelf || isOpeningChat) return;
    setIsOpeningChat(true);
    try {
      const { roomId } = await getOrCreateRoom({
        sessionToken,
        targetUserId: author._id,
      });
      navigate(`/messages?roomId=${roomId}`);
    } catch (err: any) {
      alert(err.message || 'Could not start direct messaging room.');
    } finally {
      setIsOpeningChat(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();

  return (
    <>
      <div className={`lecturer-profile-badge ${compact ? 'compact' : ''}`}>
        <div className="lpb-avatar-wrap" onClick={() => setShowModal(true)} title="View profile details">
          {author.avatarUrl ? (
            <img src={author.avatarUrl} alt={author.fullName} />
          ) : (
            <span className="lpb-avatar-initials">{getInitials(author.fullName)}</span>
          )}
        </div>

        <div className="lpb-info" onClick={() => setShowModal(true)}>
          <div className="lpb-name-row">
            <strong className="lpb-name">{formatAcademicName(author)}</strong>
            {isLecturer && <span className="lpb-role-tag">🏛️ Lecturer</span>}
          </div>

          <div className="lpb-dept">
            {author.departmentName ? author.departmentName : author.school}
          </div>

          {author.specializations && author.specializations.length > 0 && (
            <div className="lpb-specs">
              {author.specializations.slice(0, 3).map((spec, idx) => (
                <span key={idx} className="lpb-spec-tag">
                  #{spec}
                </span>
              ))}
            </div>
          )}
        </div>

        {isLecturer && !isSelf && (
          <button
            type="button"
            className="lpb-msg-btn"
            disabled={isOpeningChat}
            onClick={handleStartMessage}
            title={`Start encrypted direct chat with ${author.fullName}`}
          >
            <span className="material-symbols-outlined">chat</span>
            <span>{isOpeningChat ? 'Opening...' : 'Message'}</span>
          </button>
        )}
      </div>

      {/* Profile Modal preview */}
      {showModal && (
        <div className="audit-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="audit-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '28rem' }}>
            <div className="audit-modal-header">
              <h3><span className="material-symbols-outlined">account_circle</span> Academic Profile</h3>
              <button className="audit-close-btn" type="button" onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div className="vuser-avatar" style={{ margin: '0 auto 1rem', width: '4.5rem', height: '4.5rem', fontSize: '1.5rem' }}>
                {author.avatarUrl ? <img src={author.avatarUrl} alt={author.fullName} /> : getInitials(author.fullName)}
              </div>
              <h3 style={{ margin: '0 0 .3rem', color: '#1e2625' }}>{formatAcademicName(author)}</h3>
              <p style={{ margin: '0 0 1rem', color: '#6a6254', fontSize: '.85rem' }}>
                {isLecturer ? '🏛️ Lecturer' : '🎓 Student'} • {author.school}
              </p>

              {author.departmentName && (
                <div style={{ margin: '0 0 1rem', fontSize: '.85rem', color: '#16584d', fontWeight: 800 }}>
                  Department: {author.departmentName}
                </div>
              )}

              {author.specializations && author.specializations.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', justifyContent: 'center', margin: '1rem 0' }}>
                  {author.specializations.map((spec, i) => (
                    <span key={i} className="stat-tag verified">#{spec}</span>
                  ))}
                </div>
              )}

              {author.walletAddress && (
                <div style={{ margin: '1rem 0', fontSize: '.75rem', color: '#6a6254' }}>
                  <span>Wallet: </span>
                  <span className="mono-val">{author.walletAddress}</span>
                </div>
              )}

              {isLecturer && !isSelf && (
                <button
                  type="button"
                  className="btn-print-report"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                  disabled={isOpeningChat}
                  onClick={() => {
                    setShowModal(false);
                    void handleStartMessage();
                  }}
                >
                  <span className="material-symbols-outlined">lock</span> Start Encrypted 1-on-1 Direct Chat
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LecturerProfileBadge;

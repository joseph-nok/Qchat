import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import AppHeader from '../components/AppHeader';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { AttachmentLink, AttachmentPicker, uploadAttachment } from '../components/AttachmentTools';
import { useAuth } from '../context/AuthContext.jsx';
import { relayHashToBesu, getPrivateKeyFromIndexedDB } from '../utils/cryptoBridge';
import { logHashToBlockchain } from '../services/web3Service';
import LecturerProfileBadge from '../components/LecturerProfileBadge';
import '../route_css/MessagesList.css';
import '../route_css/QA.css';

const convexApi = api as any;

type PublicUser = {
  _id: Id<'users'>;
  fullName: string;
  role: 'student' | 'lecturer';
  school: string;
  avatarUrl?: string;
  departmentId?: Id<'departments'> | null;
  departmentName?: string | null;
  specializations?: string[];
  walletAddress?: string;
};

type QuestionFeedItem = {
  _id: Id<'questions'>;
  title: string;
  preview: string;
  hashtags: string[];
  author: PublicUser;
  date: number;
  answerCount: number;
  answered: boolean;
  departmentId?: Id<'departments'>;
  departmentName?: string;
  topic?: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: number;
};

type QuestionThread = {
  question: QuestionFeedItem & {
    body: string;
    createdAt: number;
    isMine: boolean;
    attachmentUrl?: string;
  };
  answers: Array<{
    _id: Id<'answers'>;
    body: string;
    author: PublicUser;
    createdAt: number;
    isMine: boolean;
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: string;
    attachmentSize?: number;
  }>;
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const parseTags = (value: string) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const QAPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, sessionToken, isLoading: authLoading } = useAuth();
  const questionId = searchParams.get('questionId') as Id<'questions'> | null;

  const questions = useQuery(convexApi.qchat.getQuestions, sessionToken ? { sessionToken } : 'skip') as QuestionFeedItem[] | undefined;
  const thread = useQuery(
    convexApi.qchat.getQuestionThread,
    sessionToken && questionId ? { sessionToken, questionId } : 'skip',
  ) as QuestionThread | null | undefined;
  const notifications = useQuery(convexApi.qchat.getNotifications, sessionToken ? { sessionToken } : 'skip') as Array<{
    _id: string;
    body: string;
    questionId: Id<'questions'>;
    read: boolean;
    createdAt: number;
  }> | undefined;

  const generateUploadUrl = useMutation(convexApi.qchat.generateUploadUrl);
  const askQuestion = useMutation(convexApi.qchat.askQuestion);
  const addAnswer = useMutation(convexApi.qchat.addAnswer);
  const markQuestionAnswered = useMutation(convexApi.qchat.markQuestionAnswered);

  const [showAskForm, setShowAskForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [topic, setTopic] = useState('');
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  const activeDepartments = useQuery(convexApi.qchat.getDepartments) as Array<{ _id: Id<'departments'>; name: string; code: string }> | undefined;

  useEffect(() => {
    if (!sessionToken && !authLoading) navigate('/login');
  }, [authLoading, navigate, sessionToken]);

  const userName = currentUser?.fullName ?? 'Academic Member';
  const userRole = currentUser?.role === 'lecturer' ? 'Lecturer' : 'Student';

  const filteredQuestions = useMemo(() => {
    const filter = tagFilter.trim().toLowerCase();
    if (!filter) return questions ?? [];
    return (questions ?? []).filter((question) =>
      question.hashtags.some((tag) => tag.toLowerCase().includes(filter)),
    );
  }, [questions, tagFilter]);

  const handleFile = (file: File | null, setter: (file: File | null) => void) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Attachments must be 10MB or smaller.');
      return;
    }
    setter(file);
    setError('');
  };

  const handleAsk = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sessionToken || isSubmitting) return;

    const postTitle = title;
    const postBody = body;
    const postTextToAnchor = `${postTitle}\n${postBody}`;

    setIsSubmitting(true);
    setError('');
    try {
      // 1. Retrieve user-isolated private key from IndexedDB
      const activeUserId = currentUser?._id || localStorage.getItem('qchat_active_user_id');
      const privateKey = activeUserId ? await getPrivateKeyFromIndexedDB(activeUserId) : null;
      if (!privateKey) {
        console.warn('Private identity key missing from IndexedDB vault.');
      }

      // 2. Calculate client-side SHA-256 fingerprint hash of post text payload
      const msgUint8 = new TextEncoder().encode(postTextToAnchor);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const calculatedHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      // 3. Register fingerprint on local Besu node
      try {
        await logHashToBlockchain(calculatedHash);
      } catch (err) {
        console.error('Besu node registration error:', err);
      }

      const selectedDept = (activeDepartments || []).find((d) => d._id === selectedDeptId);
      const attachment = questionFile ? await uploadAttachment(questionFile, generateUploadUrl) : {};
      const result = await askQuestion({
        sessionToken,
        title,
        body,
        hashtags: parseTags(hashtags),
        departmentId: selectedDeptId ? (selectedDeptId as Id<'departments'>) : undefined,
        departmentName: selectedDept ? selectedDept.name : undefined,
        topic: topic.trim() || undefined,
        ...attachment,
      });

      // Asynchronously relay the forum post (title + body) content hash to Besu using the Convex question ID as anchor
      relayHashToBesu("RECORD_MESSAGE", result.questionId, postTextToAnchor, {
        senderId: currentUser?._id,
        receiverId: "public",
      })
        .then((txHash) => console.log(`[Blockchain Sync] Forum post anchored to Besu. Tx: ${txHash}`))
        .catch((err) => console.error("[Blockchain Sync] Failed to anchor forum post hash to Besu:", err));

      setTitle('');
      setBody('');
      setHashtags('');
      setSelectedDeptId('');
      setTopic('');
      setQuestionFile(null);
      setShowAskForm(false);
      setSearchParams({ questionId: result.questionId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post your question.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sessionToken || !questionId || isSubmitting) return;
    if (!replyBody.trim() && !replyFile) return;

    const answerText = replyBody;
    setIsSubmitting(true);
    setError('');
    try {
      // 1. Retrieve user-isolated private key from IndexedDB
      const activeUserId = currentUser?._id || localStorage.getItem('qchat_active_user_id');
      const privateKey = activeUserId ? await getPrivateKeyFromIndexedDB(activeUserId) : null;
      if (!privateKey) {
        console.warn('Private identity key missing from IndexedDB vault.');
      }

      // 2. Calculate client-side SHA-256 fingerprint hash of reply text payload
      const msgUint8 = new TextEncoder().encode(answerText);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const calculatedHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      // 3. Register fingerprint on local Besu node
      try {
        await logHashToBlockchain(calculatedHash);
      } catch (err) {
        console.error('Besu node registration error:', err);
      }

      const attachment = replyFile ? await uploadAttachment(replyFile, generateUploadUrl) : {};
      const result = await addAnswer({
        sessionToken,
        questionId,
        body: replyBody,
        ...attachment,
      });

      // Asynchronously relay the reply content hash to Besu using the Convex answer ID as anchor
      relayHashToBesu("RECORD_MESSAGE", result.answerId, answerText, {
        senderId: currentUser?._id,
        receiverId: thread?.question?.author?._id,
      })
        .then((txHash) => console.log(`[Blockchain Sync] Forum reply anchored to Besu. Tx: ${txHash}`))
        .catch((err) => console.error("[Blockchain Sync] Failed to anchor forum reply hash to Besu:", err));

      setReplyBody('');
      setReplyFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add your reply.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAnswered = async () => {
    if (!sessionToken || !thread?.question || thread.question.answered) return;
    setError('');
    try {
      await markQuestionAnswered({ sessionToken, questionId: thread.question._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not mark this answered.');
    }
  };

  if (authLoading || (sessionToken && !currentUser)) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: 'var(--surface)', color: 'var(--secondary)', fontWeight: 700 }}>
        Verifying secure academic credentials...
      </div>
    );
  }

  if (!sessionToken || !currentUser) return null;

  return (
    <div className="dashboard-layout" style={{ background: 'var(--surface)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader userName={userName} userRole={userRole} profileImage={currentUser.avatarUrl} />
      <Sidebar />

      <main className="app-main">
        <div className="app-main-inner qa-shell">
          <div className="page-header">
            <div>
              <h1 className="page-title">Q&A</h1>
              <p className="page-subtitle">Ask, answer, and follow academic threads in realtime.</p>
            </div>
            <button type="button" className="new-chat-btn" onClick={() => setShowAskForm((value) => !value)}>
              <span className="material-symbols-outlined">{showAskForm ? 'close' : 'add'}</span>
              {showAskForm ? 'Close' : 'Ask Question'}
            </button>
          </div>

          {notifications && notifications.length > 0 && (
            <div className="qa-notifications">
              {notifications.slice(0, 3).map((notification) => (
                <button
                  type="button"
                  key={notification._id}
                  className={`qa-notification ${notification.read ? '' : 'unread'}`}
                  onClick={() => setSearchParams({ questionId: notification.questionId })}
                >
                  <span className="material-symbols-outlined">notifications</span>
                  <span>{notification.body}</span>
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="explore-toast qa-error">
              {error}
            </div>
          )}

          {showAskForm && (
            <form className="qa-form" onSubmit={(event) => void handleAsk(event)}>
              <div className="form-group">
                <label htmlFor="qa-title">Title</label>
                <input id="qa-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What are you trying to understand?" />
              </div>
              <div className="form-group">
                <label htmlFor="qa-body">Details</label>
                <textarea id="qa-body" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Share the full context, what you tried, and where you got stuck." />
              </div>
              <div className="form-group">
                <label htmlFor="qa-tags">Hashtags</label>
                <input id="qa-tags" value={hashtags} onChange={(event) => setHashtags(event.target.value)} placeholder="#ComputerScience, #Calculus" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="qa-dept">Department (Optional)</label>
                  <select
                    id="qa-dept"
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    style={{ padding: '.65rem .85rem', border: '1px solid var(--outline-variant)', borderRadius: '.6rem', background: 'var(--surface-container-low)', color: 'var(--on-surface)', font: 'inherit', fontSize: '.82rem' }}
                  >
                    <option value="">-- Select Department --</option>
                    {activeDepartments?.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="qa-topic">Topic / Subject</label>
                  <input
                    id="qa-topic"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="e.g. Cryptography, Algorithms, Linear Algebra"
                  />
                </div>
              </div>
              <div className="qa-form-actions">
                <AttachmentPicker selectedFile={questionFile} onFileChange={(file) => handleFile(file, setQuestionFile)} onClear={() => setQuestionFile(null)} />
                <button type="submit" className="modal-submit-btn" disabled={isSubmitting}>
                  <span className="material-symbols-outlined">{isSubmitting ? 'hourglass_top' : 'send'}</span>
                  Post Question
                </button>
              </div>
            </form>
          )}

          <div className="search-wrapper qa-search">
            <span className="material-symbols-outlined search-icon">tag</span>
            <input
              type="text"
              className="search-input"
              placeholder="Filter by hashtag..."
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
            />
          </div>

          {questionId ? (
            <section className="qa-thread">
              <button type="button" className="qa-back-btn" onClick={() => setSearchParams({})}>
                <span className="material-symbols-outlined">arrow_back</span>
                Back to feed
              </button>

              {thread === undefined ? (
                <div className="no-conversations"><span className="material-symbols-outlined no-conv-icon">hourglass_top</span><p>Loading thread...</p></div>
              ) : thread === null ? (
                <div className="no-conversations"><span className="material-symbols-outlined no-conv-icon">help</span><p>This question could not be found.</p></div>
              ) : (
                <>
                  <article className="qa-question-panel">
                    <div className="qa-question-topline">
                      <LecturerProfileBadge author={thread.question.author} />
                      <span className={`qa-status ${thread.question.answered ? 'answered' : ''}`}>
                        {thread.question.answered ? '✓ Answered' : 'Open'}
                      </span>
                    </div>
                    <h2>{thread.question.title}</h2>
                    <p>{thread.question.body}</p>
                    <AttachmentLink attachment={thread.question} />
                    <div className="qa-tags">
                      {thread.question.departmentName && (
                        <span style={{ background: '#dff1e9', color: '#126b50' }}>🏛️ {thread.question.departmentName}</span>
                      )}
                      {thread.question.topic && (
                        <span style={{ background: '#eef2ff', color: '#3730a3' }}>📚 {thread.question.topic}</span>
                      )}
                      {thread.question.hashtags.map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                    {thread.question.isMine && !thread.question.answered && (
                      <button type="button" className="qa-answer-btn" onClick={() => void handleMarkAnswered()}>
                        <span className="material-symbols-outlined">check_circle</span>
                        Mark as Answered
                      </button>
                    )}
                  </article>

                  <div className="qa-answer-list">
                    {thread.answers.length > 0 ? thread.answers.map((answer) => (
                      <article key={answer._id} className={`qa-answer ${answer.isMine ? 'mine' : ''}`}>
                        <LecturerProfileBadge author={answer.author} compact />
                        {answer.body && <p style={{ marginTop: '.75rem' }}>{answer.body}</p>}
                        <AttachmentLink attachment={answer} />
                      </article>
                    )) : (
                      <div className="no-conversations"><span className="material-symbols-outlined no-conv-icon">forum</span><p>No answers yet. Be the first to help.</p></div>
                    )}
                  </div>

                  <form className="qa-reply-box" onSubmit={(event) => void handleReply(event)}>
                    <textarea value={replyBody} onChange={(event) => setReplyBody(event.target.value)} placeholder="Write an answer..." />
                    <div className="qa-form-actions">
                      <AttachmentPicker selectedFile={replyFile} onFileChange={(file) => handleFile(file, setReplyFile)} onClear={() => setReplyFile(null)} />
                      <button type="submit" className="chat-drawer-send-btn" disabled={isSubmitting || (!replyBody.trim() && !replyFile)}>
                        <span className="material-symbols-outlined">{isSubmitting ? 'hourglass_top' : 'send'}</span>
                      </button>
                    </div>
                  </form>
                </>
              )}
            </section>
          ) : (
            <section className="qa-feed">
              {questions === undefined ? (
                <div className="no-conversations"><span className="material-symbols-outlined no-conv-icon">hourglass_top</span><p>Loading questions...</p></div>
              ) : filteredQuestions.length > 0 ? filteredQuestions.map((question) => (
                <button type="button" key={question._id} className="qa-card" onClick={() => setSearchParams({ questionId: question._id })}>
                  <div className="qa-card-main">
                    <div className="qa-card-meta">
                      <span>{question.author.fullName}</span>
                      <span>{formatDate(question.date)}</span>
                    </div>
                    <h2>{question.title}</h2>
                    <p>{question.preview}</p>
                    <div className="qa-tags">
                      {question.departmentName && (
                        <span style={{ background: '#dff1e9', color: '#126b50' }}>🏛️ {question.departmentName}</span>
                      )}
                      {question.topic && (
                        <span style={{ background: '#eef2ff', color: '#3730a3' }}>📚 {question.topic}</span>
                      )}
                      {question.hashtags.map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                  </div>
                  <div className="qa-card-stats">
                    <span className={`qa-status ${question.answered ? 'answered' : ''}`}>{question.answered ? '✓ Answered' : 'Open'}</span>
                    <strong>{question.answerCount}</strong>
                    <span>{question.answerCount === 1 ? 'answer' : 'answers'}</span>
                  </div>
                </button>
              )) : (
                <div className="no-conversations"><span className="material-symbols-outlined no-conv-icon">quiz</span><p>No questions match this topic yet.</p></div>
              )}
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QAPage;

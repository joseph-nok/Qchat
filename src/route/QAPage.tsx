import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import AppHeader from '../components/AppHeader';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { AttachmentLink, AttachmentPicker, isImageAttachment, uploadAttachment } from '../components/AttachmentTools';
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
  rank?: string;
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
  attachmentUrl?: string;
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

const formatAcademicName = (user: Pick<PublicUser, 'fullName' | 'role' | 'rank'>) => {
  const rank = user.role === 'lecturer' ? user.rank?.trim() : '';
  return rank && !user.fullName.startsWith(`${rank} `)
    ? `${rank} ${user.fullName}`
    : user.fullName;
};

const QAPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, sessionToken, isLoading: authLoading } = useAuth();
  const questionIdParam = searchParams.get('questionId');
  const [newQuestionId, setNewQuestionId] = useState<Id<'questions'> | null>(null);

  const questions = useQuery(convexApi.qchat.getQuestions, sessionToken ? { sessionToken } : 'skip') as QuestionFeedItem[] | undefined;
  const notifications = useQuery(convexApi.qchat.getNotifications, sessionToken ? { sessionToken } : 'skip') as Array<{
    _id: string;
    body: string;
    questionId: Id<'questions'>;
    read: boolean;
    createdAt: number;
  }> | undefined;
  // Search parameters are untyped runtime input. Only pass an ID to Convex
  // after it has come from a question or notification returned by the app.
  // This prevents values like "undefined" from reaching v.id("questions").
  const questionId = useMemo(() => {
    if (!questionIdParam) return null;
    const knownQuestion = questionIdParam === newQuestionId
      || questions?.some((question) => question._id === questionIdParam)
      || notifications?.some((notification) => notification.questionId === questionIdParam);
    return knownQuestion ? questionIdParam as Id<'questions'> : null;
  }, [newQuestionId, notifications, questionIdParam, questions]);
  const thread = useQuery(
    convexApi.qchat.getQuestionThread,
    sessionToken && questionId ? { sessionToken, questionId } : 'skip',
  ) as QuestionThread | null | undefined;

  const generateUploadUrl = useMutation(convexApi.qchat.generateUploadUrl);
  const askQuestion = useMutation(convexApi.qchat.askQuestion);
  const addAnswer = useMutation(convexApi.qchat.addAnswer);
  const markQuestionAnswered = useMutation(convexApi.qchat.markQuestionAnswered);

  const [showAskForm, setShowAskForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [topic, setTopic] = useState('');
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    if (!sessionToken && !authLoading) navigate('/login');
  }, [authLoading, navigate, sessionToken]);

  useEffect(() => {
    if (questionIdParam && questions !== undefined && notifications !== undefined && !questionId) {
      setError('That question link is no longer valid.');
      setSearchParams({}, { replace: true });
    }
  }, [notifications, questionId, questionIdParam, questions, setSearchParams]);

  useEffect(() => {
    if (!lightboxImage) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxImage(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [lightboxImage]);

  const userName = currentUser ? formatAcademicName(currentUser) : 'Academic Member';
  const userRole = currentUser?.role === 'lecturer' ? 'Lecturer' : 'Student';

  const filteredQuestions = useMemo(() => {
    const filter = searchTerm.trim().replace(/^#/, '').toLowerCase();
    if (!filter) return questions ?? [];
    return (questions ?? []).filter((question) => [
      question.title,
      question.preview,
      question.topic ?? '',
      question.departmentName ?? '',
      ...question.hashtags,
    ].some((value) => value.toLowerCase().includes(filter)));
  }, [questions, searchTerm]);

  const searchSuggestions = useMemo(() => {
    const filter = searchTerm.trim().replace(/^#/, '').toLowerCase();
    if (!filter) return [];

    const suggestions = new Map<string, { label: string; type: 'Topic' | 'Hashtag' | 'Department' }>();
    const addSuggestion = (label: string | undefined, type: 'Topic' | 'Hashtag' | 'Department') => {
      if (!label || !label.toLowerCase().includes(filter)) return;
      const key = `${type}:${label.toLowerCase()}`;
      if (!suggestions.has(key)) suggestions.set(key, { label, type });
    };

    addSuggestion(currentUser?.departmentName, 'Department');
    for (const question of questions ?? []) {
      addSuggestion(question.departmentName, 'Department');
      addSuggestion(question.topic, 'Topic');
      question.hashtags.forEach((tag) => addSuggestion(tag.replace(/^#/, ''), 'Hashtag'));
    }

    return [...suggestions.values()].slice(0, 7);
  }, [currentUser?.departmentName, questions, searchTerm]);

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

      const attachment = questionFile ? await uploadAttachment(questionFile, generateUploadUrl) : {};
      const result = await askQuestion({
        sessionToken,
        title,
        body,
        hashtags: parseTags(hashtags),
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
      setTopic('');
      setQuestionFile(null);
      setShowAskForm(false);
      setNewQuestionId(result.questionId);
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
                  <label>Department</label>
                  <div className="qa-department-lock">
                    <span className="material-symbols-outlined">domain</span>
                    {currentUser.departmentName || 'Department verification required'}
                  </div>
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

          <div className="qa-search-combobox">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search topics, hashtags, or your department..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 120)}
              role="combobox"
              aria-expanded={isSearchFocused && searchSuggestions.length > 0}
              aria-controls="qa-search-suggestions"
              aria-autocomplete="list"
            />
            {searchTerm && (
              <button className="explore-clear-btn" type="button" onClick={() => setSearchTerm('')} aria-label="Clear Q&A search">
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
            {isSearchFocused && searchSuggestions.length > 0 && (
              <div className="qa-search-suggestions" id="qa-search-suggestions" role="listbox">
                {searchSuggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.type}-${suggestion.label}`}
                    type="button"
                    role="option"
                    className="qa-search-suggestion"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setSearchTerm(suggestion.type === 'Hashtag' ? `#${suggestion.label.replace(/^#/, '')}` : suggestion.label);
                      setIsSearchFocused(false);
                    }}
                  >
                    <span className="material-symbols-outlined">{suggestion.type === 'Department' ? 'domain' : suggestion.type === 'Hashtag' ? 'tag' : 'menu_book'}</span>
                    <span>{suggestion.label}</span>
                    <small>{suggestion.type}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="qa-department-scope"><span className="material-symbols-outlined">visibility</span> Showing questions from {currentUser.departmentName || 'your verified department'}.</p>

          {questionIdParam ? (
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
                    <AttachmentLink attachment={thread.question} onImageClick={setLightboxImage} />
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
                        <AttachmentLink attachment={answer} onImageClick={setLightboxImage} />
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
                  <div className={`qa-feed-media ${isImageAttachment(question) && question.attachmentUrl ? 'has-image' : ''}`} aria-hidden="true">
                    {isImageAttachment(question) && question.attachmentUrl ? (
                      <img src={question.attachmentUrl} alt="" className="reddit-medium-thumbnail" />
                    ) : (
                      <span className="material-symbols-outlined">{question.attachmentName ? 'attach_file' : 'article'}</span>
                    )}
                  </div>
                  <div className="qa-card-main">
                    <div className="qa-card-meta">
                      <span>{formatAcademicName(question.author)}</span>
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
                <div className="no-conversations"><span className="material-symbols-outlined no-conv-icon">quiz</span><p>{searchTerm ? 'No questions match that search yet.' : 'No questions have been posted for your department yet.'}</p></div>
              )}
            </section>
          )}
        </div>
      </main>

      <Footer />
      {lightboxImage && (
        <div className="qa-image-lightbox" role="dialog" aria-modal="true" aria-label={`Image preview: ${lightboxImage.name}`} onMouseDown={(event) => {
          if (event.target === event.currentTarget) setLightboxImage(null);
        }}>
          <div className="qa-image-lightbox-content">
            <button type="button" className="qa-image-lightbox-close" onClick={() => setLightboxImage(null)} aria-label="Close image preview">
              <span className="material-symbols-outlined">close</span>
            </button>
            <img src={lightboxImage.url} alt={lightboxImage.name} />
            <p>{lightboxImage.name}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QAPage;

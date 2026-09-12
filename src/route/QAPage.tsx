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
import { verifyAcademicQuestion, type AcademicVerificationResult } from '../services/academicVerifier';
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

  // Department queries and feed filtering state
  const departments = useQuery(convexApi.qchat.getDepartments) as Array<{
    _id: Id<'departments'>;
    name: string;
    code: string;
    description?: string;
  }> | undefined;

  const [feedFilterMode, setFeedFilterMode] = useState<'all' | 'my_questions' | 'department'>('all');
  const [feedDepartmentId, setFeedDepartmentId] = useState<Id<'departments'> | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'most_answers' | 'unanswered'>('recent');

  const queryArgs = useMemo(() => {
    if (!sessionToken) return 'skip' as const;
    const base: { sessionToken: string; sortBy?: string; filter?: string; departmentId?: Id<'departments'> } = {
      sessionToken,
      sortBy,
    };
    if (currentUser?.role === 'lecturer') {
      return base;
    }
    if (feedFilterMode === 'my_questions') {
      return { ...base, filter: 'my_questions' };
    }
    if (feedFilterMode === 'department' && feedDepartmentId) {
      return { ...base, departmentId: feedDepartmentId };
    }
    return base;
  }, [sessionToken, currentUser?.role, feedFilterMode, feedDepartmentId, sortBy]);

  const questions = useQuery(convexApi.qchat.getQuestions, queryArgs) as QuestionFeedItem[] | undefined;

  const isValidQuestionId = useMemo(() => {
    if (!questionIdParam) return false;
    if (questionIdParam === 'undefined' || questionIdParam === 'null') return false;
    return typeof questionIdParam === 'string' && questionIdParam.length >= 10 && !/\s/.test(questionIdParam);
  }, [questionIdParam]);

  const questionId = isValidQuestionId ? (questionIdParam as Id<'questions'>) : null;
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

  // Target Department selection for asking question
  const [targetDepartmentId, setTargetDepartmentId] = useState<Id<'departments'> | null>(null);
  const [targetDeptSearch, setTargetDeptSearch] = useState('');
  const [isTargetDeptOpen, setIsTargetDeptOpen] = useState(false);

  const [replyBody, setReplyBody] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [moderationErrors, setModerationErrors] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    if (!sessionToken && !authLoading) navigate('/login');
  }, [authLoading, navigate, sessionToken]);

  useEffect(() => {
    if (questionIdParam && !isValidQuestionId) {
      setError('That question link is no longer valid.');
      setSearchParams({}, { replace: true });
    }
  }, [isValidQuestionId, questionIdParam, setSearchParams]);

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
    let list = questions ?? [];
    if (filter) {
      list = list.filter((question) => [
        question.title,
        question.preview,
        question.topic ?? '',
        question.departmentName ?? '',
        ...question.hashtags,
      ].some((value) => value.toLowerCase().includes(filter)));
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'recent') {
        return b.date - a.date;
      }
      if (sortBy === 'oldest') {
        return a.date - b.date;
      }
      if (sortBy === 'most_answers') {
        return b.answerCount - a.answerCount || b.date - a.date;
      }
      if (sortBy === 'unanswered') {
        if (a.answered !== b.answered) {
          return a.answered ? 1 : -1;
        }
        return a.answerCount - b.answerCount || b.date - a.date;
      }
      return b.date - a.date;
    });
  }, [questions, searchTerm, sortBy]);

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
    for (const dept of departments ?? []) {
      addSuggestion(dept.name, 'Department');
    }
    for (const question of questions ?? []) {
      addSuggestion(question.departmentName, 'Department');
      addSuggestion(question.topic, 'Topic');
      question.hashtags.forEach((tag) => addSuggestion(tag.replace(/^#/, ''), 'Hashtag'));
    }

    return [...suggestions.values()].slice(0, 7);
  }, [currentUser?.departmentName, departments, questions, searchTerm]);

  const selectedTargetDept = useMemo(() => {
    if (targetDepartmentId && departments) {
      const found = departments.find((d) => d._id === targetDepartmentId);
      if (found) return found;
    }
    if (currentUser?.departmentId && departments) {
      const found = departments.find((d) => d._id === currentUser.departmentId);
      if (found) return found;
    }
    return departments?.[0] ?? null;
  }, [departments, targetDepartmentId, currentUser?.departmentId]);

  const filteredDepartments = useMemo(() => {
    if (!departments) return [];
    const q = targetDeptSearch.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter(
      (dept) =>
        dept.name.toLowerCase().includes(q) ||
        dept.code.toLowerCase().includes(q) ||
        (dept.description && dept.description.toLowerCase().includes(q))
    );
  }, [departments, targetDeptSearch]);

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
    if (!sessionToken || isSubmitting || isVerifying) return;

    const postTitle = title;
    const postBody = body;
    const postTextToAnchor = `${postTitle}\n${postBody}`;

    setError('');
    setModerationErrors([]);

    const selectedDeptName =
      selectedTargetDept?.name ?? currentUser?.departmentName ?? '';
    const selectedTopic = topic.trim();

    // AI Academic Verification before proceeding with mutation
    setIsVerifying(true);
    let verification: AcademicVerificationResult;
    try {
      verification = await verifyAcademicQuestion(
        postTitle,
        postBody,
        selectedDeptName,
        selectedTopic,
      );
    } catch {
      // Network / unexpected error — allow submission (never block a student).
      verification = {
        isAcademic: true,
        titleOk: true,
        detailsOk: true,
        departmentMatch: true,
        topicMatch: true,
        reason: 'Verification unavailable — allowing by default',
      };
    } finally {
      setIsVerifying(false);
    }

    if (verification.isAcademic === false) {
      // Show ONE message for the FIRST failing check, in priority order.
      let singleMessage: string;
      if (verification.titleOk === false) {
        singleMessage =
          "Your title doesn't look like a real academic topic. Please use a clear subject name like 'RSA encryption' or 'Operating Systems scheduling'.";
      } else if (verification.detailsOk === false) {
        singleMessage =
          "Your details don't contain a real academic question. Please describe what you're trying to understand so a lecturer can help.";
      } else if (verification.departmentMatch === false) {
        singleMessage = `Your question doesn't match the selected Department (${selectedDeptName}). Please choose the correct department or rewrite your question.`;
      } else if (verification.topicMatch === false) {
        singleMessage = `Your question doesn't match the selected Topic (${selectedTopic || 'none'}). Please pick a different topic or edit your question.`;
      } else {
        singleMessage =
          "Your question doesn't meet the academic standards for this platform. Please revise and try again.";
      }
      setModerationErrors([singleMessage]);
      return;
    }

    setIsSubmitting(true);
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
      const finalDeptId = selectedTargetDept?._id || targetDepartmentId || currentUser?.departmentId;
      const finalDeptName = selectedTargetDept?.name || currentUser?.departmentName;

      let result: { questionId: Id<'questions'> };
      try {
        result = await askQuestion({
          sessionToken,
          title,
          body,
          hashtags: parseTags(hashtags),
          topic: topic.trim() || undefined,
          departmentId: finalDeptId || undefined,
          departmentName: finalDeptName || undefined,
          ...attachment,
        });
      } catch (askErr) {
        // Log raw Convex error to console; never show it to the user.
        console.error('[QAPage] askQuestion error:', askErr);
        const raw = askErr instanceof Error ? askErr.message : String(askErr);
        let friendly: string;
        if (raw.includes('at least 12 characters')) {
          friendly = 'Your question details are too short. Please write at least 12 characters explaining your academic question.';
        } else if (raw.includes('title') && raw.includes('required')) {
          friendly = 'Please enter a title for your question.';
        } else if (raw.includes('title') && raw.includes('at least')) {
          friendly = 'Your title is too short. Please write a clear academic title.';
        } else if (raw.includes('details') && raw.includes('required')) {
          friendly = 'Please describe your question in the details field.';
        } else if (raw.includes('department') && raw.includes('required')) {
          friendly = 'Please select a department for your question.';
        } else if (raw.includes('topic') && raw.includes('required')) {
          friendly = 'Please select a topic for your question.';
        } else if (raw.includes('not authenticated')) {
          friendly = 'Your session has expired. Please log in again.';
        } else if (raw.includes('rate limit') || raw.includes('too many')) {
          friendly = 'You are posting too quickly. Please wait a moment and try again.';
        } else {
          friendly = 'Something went wrong while posting your question. Please try again.';
        }
        setModerationErrors([friendly]);
        return;
      }

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
      setModerationErrors([]);
      setShowAskForm(false);
      setNewQuestionId(result.questionId);
      setSearchParams({ questionId: result.questionId });
    } catch (err) {
      console.error('[QAPage] Unexpected submission error:', err);
      setModerationErrors(['Something went wrong while posting your question. Please try again.']);
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
            <button
              type="button"
              className="new-chat-btn"
              onClick={() => {
                setShowAskForm((value) => !value);
                setModerationErrors([]);
              }}
            >
              <span className="material-symbols-outlined">{showAskForm ? 'close' : 'add'}</span>
              {showAskForm ? 'Close' : 'Ask Question'}
            </button>
          </div>

          {error && (
            <div className="explore-toast qa-error">
              {error}
            </div>
          )}

          {showAskForm && (
            <form className="qa-form" onSubmit={(event) => void handleAsk(event)}>
              {moderationErrors.length > 0 && (
                <div
                  className="qa-moderation-reason"
                  style={{
                    color: 'var(--error, #ba1a1a)',
                    backgroundColor: 'rgba(186, 26, 26, 0.08)',
                    border: '1px solid var(--error, #ba1a1a)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.625rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                  role="alert"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: 'var(--error, #ba1a1a)', fontSize: '1.25rem', flexShrink: 0, marginTop: '0.1rem' }}
                  >
                    error
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {moderationErrors.map((errMsg, idx) => (
                      <span key={idx}>{errMsg}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="qa-title">Title</label>
                <input
                  id="qa-title"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (moderationErrors.length > 0) setModerationErrors([]);
                  }}
                  placeholder="What are you trying to understand?"
                />
              </div>
              <div className="form-group">
                <label htmlFor="qa-body">Details</label>
                <textarea
                  id="qa-body"
                  value={body}
                  onChange={(event) => {
                    setBody(event.target.value);
                    if (moderationErrors.length > 0) setModerationErrors([]);
                  }}
                  placeholder="Share the full context, what you tried, and where you got stuck."
                />
              </div>
              <div className="form-group">
                <label htmlFor="qa-tags">Hashtags</label>
                <input id="qa-tags" value={hashtags} onChange={(event) => setHashtags(event.target.value)} placeholder="#ComputerScience, #Calculus" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '1rem' }}>
                <div className="form-group qa-target-dept-box">
                  <label htmlFor="qa-target-dept">Target Department</label>
                  <div className="qa-target-dept-display">
                    <div className="qa-target-dept-info">
                      <span className="material-symbols-outlined">domain</span>
                      <div className="qa-target-dept-text">
                        <strong>{selectedTargetDept?.name ?? currentUser.departmentName ?? 'Select Department'}</strong>
                        {selectedTargetDept?.code && <span className="qa-dept-code-pill">{selectedTargetDept.code}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="qa-change-dept-btn"
                      onClick={() => setIsTargetDeptOpen((prev) => !prev)}
                    >
                      {isTargetDeptOpen ? 'Close' : 'Select / Search'}
                    </button>
                  </div>

                  {isTargetDeptOpen && (
                    <div className="qa-dept-dropdown-panel">
                      <div className="qa-dept-search-wrap">
                        <span className="material-symbols-outlined">search</span>
                        <input
                          type="text"
                          className="qa-dept-search-input"
                          placeholder="Search department name or code..."
                          value={targetDeptSearch}
                          onChange={(e) => setTargetDeptSearch(e.target.value)}
                          autoFocus
                        />
                        {targetDeptSearch && (
                          <button
                            type="button"
                            className="qa-dept-search-clear"
                            onClick={() => setTargetDeptSearch('')}
                          >
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        )}
                      </div>
                      <div className="qa-dept-options-list">
                        {filteredDepartments.map((dept) => {
                          const isSelected = (selectedTargetDept?._id ?? currentUser.departmentId) === dept._id;
                          const isUserHomeDept = currentUser.departmentId === dept._id;
                          return (
                            <button
                              key={dept._id}
                              type="button"
                              className={`qa-dept-option-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                setTargetDepartmentId(dept._id);
                                setIsTargetDeptOpen(false);
                                setTargetDeptSearch('');
                                if (moderationErrors.length > 0) setModerationErrors([]);
                              }}
                            >
                              <span className="material-symbols-outlined">
                                {isSelected ? 'check_circle' : 'apartment'}
                              </span>
                              <div className="qa-dept-option-details">
                                <span className="qa-dept-option-name">{dept.name}</span>
                                {dept.description && <small className="qa-dept-option-desc">{dept.description}</small>}
                              </div>
                              <div className="qa-dept-option-tags">
                                {isUserHomeDept && <span className="qa-dept-home-tag">Your Dept</span>}
                                <span className="qa-dept-code-pill">{dept.code}</span>
                              </div>
                            </button>
                          );
                        })}
                        {filteredDepartments.length === 0 && (
                          <div className="qa-dept-no-results">No departments match &quot;{targetDeptSearch}&quot;</div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedTargetDept && currentUser.departmentId && selectedTargetDept._id !== currentUser.departmentId && (
                    <div className="qa-cross-dept-callout">
                      <span className="material-symbols-outlined">info</span>
                      <div>
                        <strong>Cross-Department Question</strong>
                        <p>
                          You are asking in <strong>{selectedTargetDept.name}</strong>. Only verified lecturers in <strong>{selectedTargetDept.name}</strong> will receive this question and be eligible to answer.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="qa-topic">Topic / Subject</label>
                  <input
                    id="qa-topic"
                    value={topic}
                    onChange={(event) => {
                      setTopic(event.target.value);
                      if (moderationErrors.length > 0) setModerationErrors([]);
                    }}
                    placeholder="e.g. Cryptography, Algorithms, Linear Algebra"
                  />
                </div>
              </div>
              <div className="qa-form-actions">
                <AttachmentPicker selectedFile={questionFile} onFileChange={(file) => handleFile(file, setQuestionFile)} onClear={() => setQuestionFile(null)} />
                <button type="submit" className="modal-submit-btn" disabled={isSubmitting || isVerifying}>
                  <span className="material-symbols-outlined">{isVerifying || isSubmitting ? 'hourglass_top' : 'send'}</span>
                  {isVerifying ? 'Checking academic content...' : 'Post Question'}
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

          {!questionIdParam && (
            <div className="qa-feed-filter-bar">
              {currentUser.role === 'student' && (
                <div className="qa-filter-pills">
                  <button
                    type="button"
                    className={`qa-filter-pill ${feedFilterMode === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      setFeedFilterMode('all');
                      setFeedDepartmentId(null);
                    }}
                  >
                    <span className="material-symbols-outlined">dynamic_feed</span>
                    My Feed
                  </button>
                  <button
                    type="button"
                    className={`qa-filter-pill ${feedFilterMode === 'my_questions' ? 'active' : ''}`}
                    onClick={() => {
                      setFeedFilterMode('my_questions');
                      setFeedDepartmentId(null);
                    }}
                  >
                    <span className="material-symbols-outlined">contact_support</span>
                    My Questions
                  </button>
                </div>
              )}

              <div className="qa-filter-controls-right">
                {currentUser.role === 'student' && (
                  <div className="qa-dept-filter-select-wrap">
                    <span className="material-symbols-outlined">filter_list</span>
                    <select
                      className="qa-dept-filter-select"
                      value={feedFilterMode === 'department' && feedDepartmentId ? feedDepartmentId : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setFeedFilterMode('department');
                          setFeedDepartmentId(val as Id<'departments'>);
                        } else {
                          setFeedFilterMode('all');
                          setFeedDepartmentId(null);
                        }
                      }}
                    >
                      <option value="">Browse Department (All)</option>
                      {departments?.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="qa-sort-select-wrap">
                  <span className="material-symbols-outlined">sort</span>
                  <select
                    className="qa-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'recent' | 'oldest' | 'most_answers' | 'unanswered')}
                    aria-label="Sort questions"
                  >
                    <option value="recent">Recently Posted</option>
                    <option value="oldest">Oldest First</option>
                    <option value="most_answers">Most Answers</option>
                    <option value="unanswered">Unanswered</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {!questionIdParam && (
            <>
              {currentUser.role === 'lecturer' ? (
                <p className="qa-department-scope">
                  <span className="material-symbols-outlined">visibility</span>
                  {`Showing questions directed to ${currentUser.departmentName || 'your verified department'} (Lecturer View).`}
                </p>
              ) : feedFilterMode === 'department' && feedDepartmentId ? (
                <p className="qa-department-scope">
                  <span className="material-symbols-outlined">visibility</span>
                  {`Showing questions in ${departments?.find((d) => d._id === feedDepartmentId)?.name || 'selected department'}.`}
                </p>
              ) : null}
            </>
          )}

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
                      <div className="no-conversations">
                        <span className="material-symbols-outlined no-conv-icon">
                          {currentUser.role === 'lecturer' && currentUser.departmentId === thread.question.departmentId ? 'forum' : 'pending'}
                        </span>
                        <p>
                          {currentUser.role === 'lecturer' && currentUser.departmentId === thread.question.departmentId
                            ? 'No answers yet. Share your guidance as a lecturer.'
                            : `Waiting for a lecturer from ${thread.question.departmentName || 'this department'} to answer.`}
                        </p>
                      </div>
                    )}
                  </div>

                  {currentUser.role === 'lecturer' && currentUser.departmentId === thread.question.departmentId ? (
                    <form className="qa-reply-box" onSubmit={(event) => void handleReply(event)}>
                      {/* <div className="qa-reply-box-header">
                        <span className="material-symbols-outlined">verified</span>
                        <span>Answering as verified lecturer for <strong>{thread.question.departmentName}</strong></span>
                      </div> */}
                      <textarea value={replyBody} onChange={(event) => setReplyBody(event.target.value)} placeholder="Write an academic answer..." />
                      <div className="qa-form-actions">
                        <AttachmentPicker selectedFile={replyFile} onFileChange={(file) => handleFile(file, setReplyFile)} onClear={() => setReplyFile(null)} />
                        <button type="submit" className="chat-drawer-send-btn" disabled={isSubmitting || (!replyBody.trim() && !replyFile)}>
                          <span className="material-symbols-outlined">{isSubmitting ? 'hourglass_top' : 'send'}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="qa-lecturer-only-notice">
                      <span className="material-symbols-outlined">school</span>
                      <div>
                        <h4>Department Lecturers Only</h4>
                        <p>
                          Only verified lecturers in <strong>{thread.question.departmentName || 'this department'}</strong> can answer this question.
                          {thread.question.isMine && !thread.question.answered ? ' You will be notified once a lecturer answers.' : ''}
                        </p>
                      </div>
                    </div>
                  )}
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
                <div className="no-conversations"><span className="material-symbols-outlined no-conv-icon">quiz</span><p>{searchTerm ? 'No questions match that search yet.' : feedFilterMode === 'my_questions' ? 'You have not asked any questions yet.' : 'No questions have been posted for your department yet.'}</p></div>
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

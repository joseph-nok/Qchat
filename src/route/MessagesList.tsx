import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import AppHeader from '../components/AppHeader';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext.jsx';
import '../route_css/MessagesList.css';

const convexApi = api as any;
const DEFAULT_CHAT_DRAWER_WIDTH = 448;
const MIN_CHAT_DRAWER_WIDTH = 360;
const MAX_CHAT_DRAWER_WIDTH = 900;

type ChatUser = {
  _id: Id<'users'>;
  fullName: string;
  email: string;
  role: 'student' | 'lecturer';
  school: string;
  avatarUrl?: string;
  isVerified: boolean;
};

type Room = {
  _id: Id<'chatRooms'>;
  otherUser: ChatUser | null;
  preview: string;
  lastMessageAt: number;
  unread: number;
};

type ChatMessage = {
  _id: Id<'messages'>;
  text: string;
  createdAt: number;
  isMine: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: number;
  editedAt?: number;
};

const clampChatDrawerWidth = (width: number) => {
  const viewportMax = Math.max(MIN_CHAT_DRAWER_WIDTH, window.innerWidth - 96);
  return Math.min(Math.max(width, MIN_CHAT_DRAWER_WIDTH), Math.min(MAX_CHAT_DRAWER_WIDTH, viewportMax));
};

const formatTime = (timestamp?: number) => {
  if (!timestamp) return 'Now';
  const date = new Date(timestamp);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatFileSize = (size?: number) => {
  if (!size) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getInitials = (name: string) => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map(part => part[0])
  .join('')
  .toUpperCase();

const MessagesList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, sessionToken, isLoading: authLoading } = useAuth();
  const rooms = useQuery(convexApi.qchat.getRooms, sessionToken ? { sessionToken } : 'skip') as Room[] | undefined;
  const generateUploadUrl = useMutation(convexApi.qchat.generateUploadUrl);
  const sendMessage = useMutation(convexApi.qchat.sendMessage);
  const markAsRead = useMutation(convexApi.qchat.markAsRead);
  const deleteMessage = useMutation(convexApi.qchat.deleteMessage);
  const editMessage = useMutation(convexApi.qchat.editMessage);

  const requestedRoomId = searchParams.get('roomId') as Id<'chatRooms'> | null;
  const [activeRoomId, setActiveRoomId] = useState<Id<'chatRooms'> | null>(requestedRoomId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread'>('all');
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [chatDrawerWidth, setChatDrawerWidth] = useState(() => clampChatDrawerWidth(DEFAULT_CHAT_DRAWER_WIDTH));
  const [isResizingChat, setIsResizingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Long-press / context-menu state
  const [menuMessage, setMenuMessage] = useState<ChatMessage | null>(null);
  const [editingId, setEditingId] = useState<Id<'messages'> | null>(null);
  const [editText, setEditText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const messages = useQuery(
    convexApi.qchat.getMessages,
    sessionToken && activeRoomId ? { sessionToken, roomId: activeRoomId } : 'skip',
  ) as ChatMessage[] | undefined;

  useEffect(() => {
    if (!sessionToken && !authLoading) navigate('/login');
  }, [authLoading, navigate, sessionToken]);

  useEffect(() => {
    if (requestedRoomId) setActiveRoomId(requestedRoomId);
  }, [requestedRoomId]);

  useEffect(() => {
    if (!sessionToken || !activeRoomId) return;
    void markAsRead({ sessionToken, roomId: activeRoomId }).catch(() => undefined);
  }, [activeRoomId, markAsRead, sessionToken, messages?.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeRoomId, messages?.length]);

  useEffect(() => {
    if (!isResizingChat) return;

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    const handlePointerMove = (event: PointerEvent) => {
      setChatDrawerWidth(clampChatDrawerWidth(window.innerWidth - event.clientX));
    };
    const stopResizing = () => setIsResizingChat(false);

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResizing, { once: true });

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResizing);
    };
  }, [isResizingChat]);

  const filteredRooms = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return (rooms ?? []).filter((room) => {
      const otherUser = room.otherUser;
      const matchesSearch =
        !term ||
        otherUser?.fullName.toLowerCase().includes(term) ||
        otherUser?.school.toLowerCase().includes(term) ||
        room.preview.toLowerCase().includes(term);

      if (!matchesSearch) return false;
      if (selectedFilter === 'unread') return room.unread > 0;
      return true;
    });
  }, [rooms, searchQuery, selectedFilter]);

  const activeRoom = (rooms ?? []).find(room => room._id === activeRoomId) ?? null;
  const userName = currentUser?.fullName ?? 'Academic Member';
  const userRole = currentUser?.role === 'lecturer' ? 'Lecturer' : 'Student';

  const handleSelectRoom = (roomId: Id<'chatRooms'>) => {
    setActiveRoomId(roomId);
    setSearchParams({ roomId });
  };

  const handleCloseDrawer = () => {
    setActiveRoomId(null);
    setSearchParams({});
    setMenuMessage(null);
    setEditingId(null);
  };

  // Long-press handlers for hold-to-act on own messages
  const handlePointerDown = (message: ChatMessage) => {
    if (!message.isMine) return;
    longPressTimerRef.current = setTimeout(() => {
      setMenuMessage(message);
    }, 600);
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleDeleteMessage = async () => {
    if (!menuMessage || !sessionToken) return;
    setIsDeleting(true);
    try {
      await deleteMessage({ sessionToken, messageId: menuMessage._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete message.');
    } finally {
      setIsDeleting(false);
      setMenuMessage(null);
    }
  };

  const handleStartEdit = () => {
    if (!menuMessage) return;
    setEditingId(menuMessage._id);
    setEditText(menuMessage.text);
    setMenuMessage(null);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !sessionToken) return;
    setIsEditing(true);
    try {
      await editMessage({ sessionToken, messageId: editingId, text: editText });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not edit message.');
    } finally {
      setIsEditing(false);
      setEditingId(null);
      setEditText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleFileChange = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Attachments must be 10MB or smaller.');
      return;
    }
    setSelectedFile(file);
    setError('');
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sessionToken || !activeRoomId || isSending) return;
    if (!newMessage.trim() && !selectedFile) return;

    setIsSending(true);
    setError('');
    try {
      let attachmentStorageId: Id<'_storage'> | undefined;
      if (selectedFile) {
        const uploadUrl = await generateUploadUrl();
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': selectedFile.type || 'application/octet-stream' },
          body: selectedFile,
        });

        if (!uploadResponse.ok) {
          throw new Error('Attachment upload failed. Please try again.');
        }

        const uploadResult = await uploadResponse.json();
        attachmentStorageId = uploadResult.storageId;
      }

      await sendMessage({
        sessionToken,
        roomId: activeRoomId,
        text: newMessage,
        attachmentStorageId,
        attachmentName: selectedFile?.name,
        attachmentType: selectedFile?.type,
        attachmentSize: selectedFile?.size,
      });
      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send this message.');
    } finally {
      setIsSending(false);
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
        <div className="app-main-inner">
          <div className="page-header">
            <div>
              <h1 className="page-title">Messages</h1>
              {/* <p className="page-subtitle">Live conversations stored and synced through Convex.</p> */}
            </div>
          </div>

          <div className="filters-bar">
            <button className={`filter-tag ${selectedFilter === 'all' ? 'active' : ''}`} onClick={() => setSelectedFilter('all')}>
              All Messages
            </button>
            <button className={`filter-tag ${selectedFilter === 'unread' ? 'active' : ''}`} onClick={() => setSelectedFilter('unread')}>
              Unread
            </button>
          </div>

          <div className="search-wrapper">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search conversations by name, school, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {error && (
            <div className="explore-toast" style={{ borderColor: 'var(--error)', color: 'var(--error)', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div className="conversations-list">
            {rooms === undefined ? (
              <div className="no-conversations">
                <span className="material-symbols-outlined no-conv-icon">hourglass_top</span>
                <p>Loading conversations...</p>
              </div>
            ) : filteredRooms.length > 0 ? (
              filteredRooms.map((room) => {
                const otherUser = room.otherUser;
                const read = room.unread === 0;
                const name = otherUser?.fullName ?? 'Unknown member';
                const avatar = otherUser?.avatarUrl ?? '';

                return (
                  <div
                    key={room._id}
                    onClick={() => handleSelectRoom(room._id)}
                    className={`conv-card ${room._id === activeRoomId ? 'active-card' : ''} ${read ? 'read' : 'unread'}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="conv-avatar-wrapper">
                      <div className="conv-avatar">
                        {avatar ? <img src={avatar} alt={`${name} Avatar`} /> : <span className="conv-avatar-initials">{getInitials(name)}</span>}
                      </div>
                      {otherUser?.isVerified && (
                        <div className="conv-verified-badge">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '0.625rem' }}>
                            verified
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="conv-body">
                      <div className="conv-top-row">
                        <div className="conv-name-row">
                          <h3 className="conv-name">{name}</h3>
                          <span className={`conv-institution-tag ${otherUser?.role === 'lecturer' ? 'primary-tag' : 'secondary-tag'}`}>
                            {otherUser?.school ?? 'Academic Network'}
                          </span>
                        </div>
                        <span className={`conv-time ${read ? 'read-time' : 'unread-time'}`}>{formatTime(room.lastMessageAt)}</span>
                      </div>

                      <div className="conv-bottom-row">
                        <p className={`conv-preview ${read ? 'read-preview' : 'unread-preview'}`}>{room.preview}</p>
                        {room.unread > 0 && (
                          <div className="unread-badge">
                            <span>{room.unread}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-conversations">
                <span className="material-symbols-outlined no-conv-icon">chat_bubble_outline</span>
                <p>No conversations yet. Open Explore to find members and start a chat.</p>
              </div>
            )}
          </div>

          <div className="end-of-conversations">
            <p className="end-label">End of conversations</p>
            <div className="end-bar"></div>
          </div>
        </div>
      </main>

      <Footer />

      {activeRoom && activeRoom.otherUser && (
        <div className={`chat-drawer-overlay ${isResizingChat ? 'resizing-chat' : ''}`} onClick={handleCloseDrawer}>
          <div
            className="chat-drawer"
            style={{ '--chat-drawer-width': `${chatDrawerWidth}px` } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="chat-drawer-resize-handle"
              aria-label="Resize chat panel"
              title="Drag to resize chat"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsResizingChat(true);
              }}
            />
            <div className="chat-drawer-header">
              <button className="close-drawer-btn" onClick={handleCloseDrawer}>
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div className="chat-drawer-user-info">
                <div className="chat-drawer-avatar-wrapper">
                  <div className="chat-drawer-avatar">
                    {activeRoom.otherUser.avatarUrl ? (
                      <img src={activeRoom.otherUser.avatarUrl} alt={activeRoom.otherUser.fullName} />
                    ) : (
                      <span className="conv-avatar-initials">{getInitials(activeRoom.otherUser.fullName)}</span>
                    )}
                  </div>
                  {activeRoom.otherUser.isVerified && (
                    <span className="chat-drawer-verified-badge material-symbols-outlined">verified</span>
                  )}
                </div>
                <div>
                  <h3 className="chat-drawer-name">{activeRoom.otherUser.fullName}</h3>
                  <p className="chat-drawer-school">{activeRoom.otherUser.school}</p>
                </div>
              </div>
              
            </div>

            <div className="chat-drawer-messages">
              {messages === undefined ? (
                <div className="no-conversations">
                  <span className="material-symbols-outlined no-conv-icon">hourglass_top</span>
                  <p>Loading messages...</p>
                </div>
              ) : messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`message-bubble-wrapper ${message.isMine ? 'outgoing' : 'incoming'}`}
                    onPointerDown={() => handlePointerDown(message)}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    onContextMenu={(e) => { if (message.isMine) { e.preventDefault(); setMenuMessage(message); } }}
                    style={{ userSelect: 'none' }}
                  >
                    <div className={`message-bubble ${editingId === message._id ? 'editing' : ''}`}>
                      {editingId === message._id ? (
                        <div className="message-edit-area">
                          <input
                            ref={editInputRef}
                            className="message-edit-input"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                          <div className="message-edit-actions">
                            <button type="button" className="msg-action-cancel" onClick={handleCancelEdit}>
                              <span className="material-symbols-outlined">close</span>
                            </button>
                            <button type="button" className="msg-action-save" onClick={() => void handleSaveEdit()} disabled={isEditing || !editText.trim()}>
                              <span className="material-symbols-outlined">{isEditing ? 'hourglass_top' : 'check'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {message.text && <p className="message-text">{message.text}</p>}
                          {message.attachmentUrl && (
                            <a
                              href={message.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="message-text"
                              style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', fontWeight: 700 }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>attach_file</span>
                              {message.attachmentName || 'Attachment'} {formatFileSize(message.attachmentSize)}
                            </a>
                          )}
                          <span className="message-time">
                            {message.editedAt ? 'edited · ' : ''}{formatTime(message.createdAt)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-conversations">
                  <span className="material-symbols-outlined no-conv-icon">forum</span>
                  <p>No messages yet. Send the first one.</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {selectedFile && (
              <div className="chat-drawer-input-area" style={{ borderBottom: '1px solid var(--outline-variant)', paddingBlock: '0.5rem' }}>
                <span className="material-symbols-outlined">attach_file</span>
                <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 700 }}>{selectedFile.name}</span>
                <button type="button" className="close-drawer-btn" onClick={() => setSelectedFile(null)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            )}

            <form onSubmit={(event) => void handleSendMessage(event)} className="chat-drawer-input-area">
              <input ref={fileInputRef} type="file" hidden onChange={(event) => handleFileChange(event.target.files)} />
              <button type="button" className="chat-drawer-send-btn" onClick={() => fileInputRef.current?.click()} title="Attach file">
                <span className="material-symbols-outlined">attach_file</span>
              </button>
              <input
                type="text"
                placeholder="Type your secure message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="chat-drawer-input"
              />
              <button type="submit" className="chat-drawer-send-btn" disabled={isSending || (!newMessage.trim() && !selectedFile)}>
                <span className="material-symbols-outlined">{isSending ? 'hourglass_top' : 'send'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== MESSAGE CONTEXT MENU ===== */}
      {menuMessage && (
        <>
          <button
            type="button"
            className="msg-menu-backdrop"
            aria-label="Close menu"
            onClick={() => setMenuMessage(null)}
          />
          <div className="msg-context-menu" role="menu">
            <div className="msg-context-preview">
              <span className="material-symbols-outlined" style={{ fontSize: '1rem', opacity: 0.5 }}>
                {menuMessage.attachmentUrl ? 'attach_file' : 'chat_bubble'}
              </span>
              <span className="msg-context-preview-text">
                {menuMessage.attachmentName || menuMessage.text || 'Message'}
              </span>
            </div>
            {!menuMessage.attachmentUrl && (
              <button
                type="button"
                className="msg-context-btn edit"
                role="menuitem"
                onClick={handleStartEdit}
              >
                <span className="material-symbols-outlined">edit</span>
                Edit message
              </button>
            )}
            <button
              type="button"
              className="msg-context-btn delete"
              role="menuitem"
              onClick={() => void handleDeleteMessage()}
              disabled={isDeleting}
            >
              <span className="material-symbols-outlined">delete</span>
              {isDeleting ? 'Deleting…' : 'Delete message'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MessagesList;

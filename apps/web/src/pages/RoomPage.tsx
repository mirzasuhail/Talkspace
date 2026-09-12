import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RoomHeader } from '../components/chat/RoomHeader';
import { MessageItem } from '../components/chat/MessageItem';
import { MessageComposer } from '../components/chat/MessageComposer';
import { MemberPanel } from '../components/chat/MemberPanel';
import { RoomMenuDrawer } from '../components/chat/RoomMenuDrawer';
import { Lightbox, LightboxImage } from '../components/chat/Lightbox';
import { ConnectionBanner } from '../components/chat/ConnectionBanner';
import { Toast } from '../components/ui/Toast';
import { useSession } from '../hooks/useSession';
import { useSocket } from '../hooks/useSocket';
import { useVisualViewport } from '../hooks/useVisualViewport';
import { apiGetRoomInfo, apiGetMessages, apiReportMessage } from '../lib/api';
import { Message } from '@talksy/shared';
import { Share2, Check, ArrowDown } from 'lucide-react';

export const RoomPage: React.FC = () => {
  const { roomSlug } = useParams<{ roomSlug: string }>();
  const navigate = useNavigate();
  const { session, initSession } = useSession();
  const { viewportHeight } = useVisualViewport();

  const [isRoomOwner, setIsRoomOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);

  // UI state
  const [isMemberPanelOpen, setIsMemberPanelOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lightboxState, setLightboxState] = useState<{ isOpen: boolean; currentUrl: string | null }>({
    isOpen: false,
    currentUrl: null,
  });
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [hasNewUnreadMessages, setHasNewUnreadMessages] = useState(false);

  const messageListEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);
  const initialLoadedRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);

  const savedPassword = sessionStorage.getItem(`pass_${roomSlug}`) || undefined;

  // Lock body & html overflow on mobile chat shell to prevent outer page scroll
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyHeight = document.body.style.height;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlHeight = document.documentElement.style.height;

    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.height = originalHtmlHeight;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.height = originalBodyHeight;
    };
  }, []);

  // Socket Connection
  const {
    status,
    messages,
    setMessages,
    onlineMembers,
    onlineCount,
    typingUsers,
    isMuted,
    sendMessage,
    startTyping,
    stopTyping,
    toggleReaction,
    editMessage,
    deleteMessage,
    performModeration,
  } = useSocket({
    roomSlug: roomSlug || '',
    sessionId: session?.id || null,
    nickname: session?.nickname || null,
    password: savedPassword,
    onKicked: (data) => {
      alert(`You have been ${data.action}ed from this room.`);
      navigate('/');
    },
    onError: (err) => {
      if (err.code === 'INVALID_PASSWORD' || err.code === 'NOT_FOUND') {
        navigate(`/join/${roomSlug}`);
      } else {
        setToast({ message: err.message, type: 'error' });
      }
    },
  });

  // Initial Room Verification
  useEffect(() => {
    if (!roomSlug) return;

    const verifyAndFetch = async () => {
      setLoading(true);
      try {
        let currentSession = session;
        if (!currentSession) {
          currentSession = await initSession();
        }

        const roomInfo = await apiGetRoomInfo(roomSlug, currentSession?.id);

        if (roomInfo.requiresPassword && !savedPassword && !roomInfo.isOwner) {
          navigate(`/join/${roomSlug}`);
          return;
        }

        setIsRoomOwner(roomInfo.isOwner);

        // Fetch message history
        const history = await apiGetMessages(roomSlug, currentSession?.id);
        setMessages(history.messages);
      } catch (err: any) {
        if (err.message?.includes('expired')) {
          setRoomError('Looks like this room has expired.');
        } else {
          setRoomError("That room doesn't exist yet.");
        }
      } finally {
        setLoading(false);
      }
    };

    verifyAndFetch();
  }, [roomSlug]);

  // Container-scoped scroll to bottom (prevents document/window scroll jumps)
  const scrollToBottom = useCallback((smooth = true) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const targetScrollTop = container.scrollHeight - container.clientHeight;
    if (targetScrollTop < 0) return;

    if (smooth) {
      container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
    } else {
      container.scrollTop = targetScrollTop;
    }
    setHasNewUnreadMessages(false);
  }, []);

  // Track scroll position in message viewport
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceFromBottom < 100;
    isNearBottomRef.current = isAtBottom;

    if (isAtBottom) {
      setHasNewUnreadMessages(false);
    }
  }, []);

  // Handle message updates without random scroll jumps
  useEffect(() => {
    if (messages.length === 0) return;

    if (!initialLoadedRef.current) {
      // First load of messages for this room: scroll to bottom ONCE
      initialLoadedRef.current = true;
      prevMessagesLengthRef.current = messages.length;
      requestAnimationFrame(() => {
        scrollToBottom(false);
      });
      return;
    }

    const isNewMessageAdded = messages.length > prevMessagesLengthRef.current;
    const lastMessage = messages[messages.length - 1];
    const isMyMessage = lastMessage?.sessionId === session?.id;

    prevMessagesLengthRef.current = messages.length;

    if (isNewMessageAdded) {
      if (isMyMessage || isNearBottomRef.current) {
        requestAnimationFrame(() => {
          scrollToBottom(true);
        });
      } else {
        setHasNewUnreadMessages(true);
      }
    }
  }, [messages, session?.id, scrollToBottom]);

  // CANONICAL IMAGE DERIVATION (Fixes stale deleted image viewer bug)
  const allImagesInRoom: LightboxImage[] = messages
    .filter((m) => !m.deletedAt)
    .flatMap((m) =>
      (m.uploads || []).map((u) => ({
        url: u.url,
        senderNickname: m.senderNickname,
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }))
    );

  const currentLightboxIndex = allImagesInRoom.findIndex((img) => img.url === lightboxState.currentUrl);

  useEffect(() => {
    if (lightboxState.isOpen) {
      if (allImagesInRoom.length === 0) {
        setLightboxState({ isOpen: false, currentUrl: null });
      } else if (currentLightboxIndex === -1) {
        setLightboxState({ isOpen: true, currentUrl: allImagesInRoom[0].url });
      }
    }
  }, [allImagesInRoom, lightboxState.isOpen, currentLightboxIndex]);

  const openLightboxForUrl = (url: string) => {
    setLightboxState({
      isOpen: true,
      currentUrl: url,
    });
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/room/${roomSlug}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleReportMessage = async (messageId: string) => {
    if (!session) return;
    try {
      await apiReportMessage(messageId, roomSlug!, session.id, 'Inappropriate content');
      setToast({ message: 'Report submitted. Thank you for keeping Talksy safe.', type: 'success' });
    } catch {
      setToast({ message: 'Failed to submit report.', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="w-6 h-6 rounded-full border-2 border-border border-t-primary animate-spin" />
          <span className="text-xs text-muted mt-3">Entering #{roomSlug}...</span>
        </div>
      </div>
    );
  }

  if (roomError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center">
        <h2 className="text-lg font-medium text-foreground">{roomError}</h2>
        <p className="text-sm text-muted mt-1 max-w-sm">
          This room may have expired, been deleted, or never created.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-5 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium"
        >
          Create a room
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ height: viewportHeight ? `${viewportHeight}px` : '100dvh' }}
      className="w-full flex flex-col bg-background overflow-hidden relative h-[100dvh] antialiased selection:bg-primary/20"
    >
      <div className="shrink-0 z-30">
        <ConnectionBanner status={status} />
      </div>

      <RoomHeader
        roomSlug={roomSlug!}
        onlineCount={onlineCount}
        isOwner={isRoomOwner}
        onOpenMembers={() => setIsMemberPanelOpen(true)}
        onOpenMenu={() => setIsMenuOpen(true)}
      />

      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain relative z-10 w-full"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center mb-4 shadow-sm">
              <span className="w-3 h-3 rounded-full bg-violet-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              It's quiet in #{roomSlug}
            </h3>
            <p className="text-sm text-muted mt-1 max-w-xs leading-relaxed">
              Share the room link with friends and start talking in real time.
            </p>
            <button
              onClick={handleCopyLink}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Room Link'}</span>
            </button>
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4">
            {messages.map((msg, index) => {
              const prevMsg = messages[index - 1];
              const isConsecutive =
                prevMsg &&
                !prevMsg.deletedAt &&
                prevMsg.sessionId === msg.sessionId &&
                new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 120000;

              return (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  currentSessionId={session?.id || ''}
                  isOwner={isRoomOwner}
                  isConsecutive={isConsecutive}
                  onReply={(m) => setReplyToMessage(m)}
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                  onReactionToggle={toggleReaction}
                  onImageClick={openLightboxForUrl}
                  onReport={handleReportMessage}
                />
              );
            })}
            
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 py-3 px-2 text-xs text-muted">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
                <span className="font-medium">
                  {typingUsers.map((u) => u.nickname).join(', ')}{' '}
                  {typingUsers.length === 1 ? 'is typing...' : 'are typing...'}
                </span>
              </div>
            )}
            <div ref={messageListEndRef} />
          </div>
        )}
      </main>

      {hasNewUnreadMessages && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated/95 backdrop-blur-xl border border-border shadow-2xl text-xs font-bold text-foreground hover:bg-surface-hover transition-all animate-slide-up"
        >
          <ArrowDown className="w-3.5 h-3.5 text-violet-400" />
          <span>New messages</span>
        </button>
      )}

      <div className="shrink-0">
        <MessageComposer
          roomSlug={roomSlug!}
          isMuted={isMuted}
          replyToMessage={replyToMessage}
          onCancelReply={() => setReplyToMessage(null)}
          onSendMessage={(content, type, uploadIds, replyToId) => {
            sendMessage(content, type, uploadIds, replyToId);
            scrollToBottom(true);
          }}
          onTypingStart={startTyping}
          onTypingStop={stopTyping}
        />
      </div>

      <MemberPanel
        isOpen={isMemberPanelOpen}
        onClose={() => setIsMemberPanelOpen(false)}
        members={onlineMembers}
        currentSessionId={session?.id || ''}
        isOwner={isRoomOwner}
        onModerationAction={performModeration}
      />

      <RoomMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        roomSlug={roomSlug!}
        currentNickname={session?.nickname || ''}
        onlineCount={onlineCount}
        onOpenMembers={() => setIsMemberPanelOpen(true)}
      />

      <Lightbox
        isOpen={lightboxState.isOpen && currentLightboxIndex !== -1}
        images={allImagesInRoom}
        currentIndex={Math.max(currentLightboxIndex, 0)}
        onClose={() => setLightboxState({ isOpen: false, currentUrl: null })}
        onNavigate={(idx) => {
          if (allImagesInRoom[idx]) {
            setLightboxState({ isOpen: true, currentUrl: allImagesInRoom[idx].url });
          }
        }}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};


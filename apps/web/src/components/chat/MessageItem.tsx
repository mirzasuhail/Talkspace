import React, { useState } from 'react';
import { Message } from '@talksy/shared';
import { generateAvatarSvg } from '../../lib/avatar';
import { format } from 'date-fns';
import { Smile, Trash2, Edit3, Flag, Check, CornerUpLeft, X } from 'lucide-react';

export interface MessageItemProps {
  message: Message;
  currentSessionId: string;
  isOwner: boolean;
  isConsecutive?: boolean;
  onReply?: (msg: Message) => void;
  onEdit?: (messageId: string, currentContent: string) => void;
  onDelete?: (messageId: string) => void;
  onReactionToggle?: (messageId: string, emoji: string) => void;
  onImageClick?: (imageUrl: string) => void;
  onReport?: (messageId: string) => void;
}

const EMOJI_LIST = ['❤️', '😂', '👍', '🔥', '😮', '👀'];

// Deterministic pastel color generator for sender names based on seed
const SENDER_COLORS = [
  'text-violet-400 dark:text-violet-300',
  'text-indigo-400 dark:text-indigo-300',
  'text-sky-400 dark:text-sky-300',
  'text-purple-400 dark:text-purple-300',
  'text-pink-400 dark:text-pink-300',
  'text-emerald-400 dark:text-emerald-300',
];

const getSenderColor = (seed?: string) => {
  if (!seed) return SENDER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
};

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentSessionId,
  isOwner,
  isConsecutive = false,
  onReply,
  onEdit,
  onDelete,
  onReactionToggle,
  onImageClick,
  onReport,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isSelf = message.sessionId === currentSessionId;
  const isDeleted = !!message.deletedAt;
  const formattedTime = format(new Date(message.createdAt), 'h:mm a');
  const senderColor = getSenderColor(message.senderAvatarSeed || message.senderNickname);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editContent.trim() && onEdit) {
      onEdit(message.id, editContent.trim());
      setIsEditing(false);
    }
  };

  if (isDeleted) {
    return (
      <div className="py-1 px-3 sm:px-4 animate-message-in flex items-center gap-2 text-xs text-muted/60 italic font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-muted/40" />
        <span>Message deleted</span>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex w-full justify-start items-start animate-message-in ${
        isConsecutive ? 'mt-1' : 'mt-4 sm:mt-5'
      }`}
    >
      {/* Avatar column (Every message group gets an avatar on the LEFT) */}
      {!isConsecutive ? (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-white/10 dark:border-white/10 shrink-0 mr-3 mt-0.5 shadow-sm bg-surface">
          <img
            src={generateAvatarSvg(message.senderAvatarSeed, message.senderNickname)}
            alt={message.senderNickname}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-8 sm:w-9 mr-3 shrink-0" />
      )}

      {/* Message content stream column (LEFT ALIGNED FOR ALL MESSAGES) */}
      <div className="relative flex flex-col flex-1 min-w-0 items-start max-w-[88%] sm:max-w-[80%] lg:max-w-[72%]">
        {/* Sender Header (Name + Timestamp + Badges) */}
        {!isConsecutive && (
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`text-[13px] sm:text-sm font-bold tracking-tight ${senderColor}`}>
              {message.senderNickname}
              {isSelf && <span className="ml-1 text-[10px] opacity-75 font-normal text-muted">(you)</span>}
            </span>
            <span className="text-[11px] text-muted/70 font-sans">{formattedTime}</span>
            {message.isEdited && <span className="text-[10px] text-muted/60">(edited)</span>}
          </div>
        )}

        {/* Reply Quote Reference */}
        {message.replyTo && (
          <div className="mb-1.5 px-3 py-1.5 rounded-xl bg-surface/70 border-l-2 border-primary text-xs text-muted max-w-full">
            <span className="font-semibold text-foreground mr-1.5">
              {message.replyTo.senderNickname}
            </span>
            <span className="line-clamp-1 opacity-85">{message.replyTo.content}</span>
          </div>
        )}

        {/* Message Container with Action Toolbar on Hover */}
        <div className="relative group/content flex flex-col items-start w-full">
          {/* Floating Action Toolbar on Hover */}
          <div className="absolute -top-3.5 left-0 opacity-0 group-hover/content:opacity-100 transition-opacity z-20 hidden group-hover:flex items-center gap-0.5 p-1 rounded-xl bg-surface-elevated/95 backdrop-blur-xl border border-border shadow-xl">
            {/* Emoji reaction button */}
            <div className="relative">
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                title="React"
                aria-label="React with emoji"
              >
                <Smile className="w-3.5 h-3.5" />
              </button>
              {showPicker && (
                <div className="absolute bottom-full left-0 mb-1.5 flex items-center gap-1 p-1.5 rounded-2xl bg-surface-elevated/95 backdrop-blur-2xl border border-border shadow-2xl z-30 animate-fade-in">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        if (onReactionToggle) onReactionToggle(message.id, emoji);
                        setShowPicker(false);
                      }}
                      className="p-1.5 rounded-xl hover:bg-surface-hover text-base hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {onReply && (
              <button
                onClick={() => onReply(message)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                title="Reply"
                aria-label="Reply to message"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {isSelf && onEdit && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                title="Edit"
                aria-label="Edit message"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {(isSelf || isOwner) && onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-surface-hover transition-colors"
                title="Delete"
                aria-label="Delete message"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {!isSelf && onReport && (
              <button
                onClick={() => onReport(message.id)}
                className="p-1.5 rounded-lg text-muted hover:text-amber-500 hover:bg-surface-hover transition-colors"
                title="Report"
                aria-label="Report message"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Inline Edit Form */}
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="flex items-center gap-2 w-full my-1">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 bg-surface border border-border rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                autoFocus
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <>
              {/* Snapchat-Style Message Text (Lightweight, Highly Readable) */}
              {message.content && (
                <div
                  className="text-[15px] sm:text-base leading-relaxed text-foreground font-sans break-words py-0.5 px-0.5"
                  dangerouslySetInnerHTML={{ __html: message.content }}
                />
              )}

              {/* Snapchat-Style Left-Aligned Image Attachments */}
              {message.uploads && message.uploads.length > 0 && (
                <div className={`flex flex-col gap-2 ${message.content ? 'mt-2' : 'mt-0.5'}`}>
                  {message.uploads.map((img) => (
                    <div
                      key={img.id}
                      className="relative overflow-hidden rounded-2xl border border-white/10 dark:border-white/10 shadow-md bg-surface group/img"
                    >
                      <img
                        src={img.thumbnailUrl || img.url}
                        alt="Attachment"
                        loading="lazy"
                        className="w-auto h-auto max-h-[360px] sm:max-h-[440px] max-w-[82vw] sm:max-w-[460px] object-cover cursor-pointer hover:scale-[1.01] transition-transform duration-200"
                        onClick={() => onImageClick && onImageClick(img.url)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Reaction Badges */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5 justify-start">
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReactionToggle && onReactionToggle(message.id, r.emoji)}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${
                  r.userReacted
                    ? 'bg-violet-500/15 text-violet-400 border-violet-500/30'
                    : 'bg-surface/60 text-muted border-border hover:border-border-hover'
                }`}
              >
                <span>{r.emoji}</span>
                <span className="text-[11px] tabular-nums">{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


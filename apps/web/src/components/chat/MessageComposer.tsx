import React, { useState, useRef, useEffect } from 'react';
import { Plus, ArrowUp, X, Image as ImageIcon, CornerUpLeft, Camera, AlertCircle } from 'lucide-react';
import { Message, UploadResponse } from '@talksy/shared';
import { apiUploadImage } from '../../lib/api';
import { CameraModal } from './CameraModal';

export interface MessageComposerProps {
  roomSlug: string;
  isMuted: boolean;
  replyToMessage?: Message | null;
  onCancelReply?: () => void;
  onSendMessage: (content: string, type: 'TEXT' | 'IMAGE', uploadIds?: string[], replyToId?: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export interface ComposerAttachment {
  tempId: string;
  file: File;
  previewUrl: string;
  uploadState: 'uploading' | 'ready' | 'error';
  uploadedId?: string;
  errorMessage?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  roomSlug,
  isMuted,
  replyToMessage,
  onCancelReply,
  onSendMessage,
  onTypingStart,
  onTypingStop,
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep a ref of attachments to revoke object URLs on unmount
  const attachmentsRef = useRef<ComposerAttachment[]>([]);
  attachmentsRef.current = attachments;

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((att) => {
        URL.revokeObjectURL(att.previewUrl);
      });
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
  }, [content]);

  // Upload attachment asynchronously in background
  const uploadAttachment = async (tempId: string, file: File) => {
    try {
      setAttachments((prev) =>
        prev.map((att) => (att.tempId === tempId ? { ...att, uploadState: 'uploading', errorMessage: undefined } : att))
      );

      const uploadRes: UploadResponse = await apiUploadImage(file);

      setAttachments((prev) =>
        prev.map((att) =>
          att.tempId === tempId
            ? { ...att, uploadState: 'ready', uploadedId: uploadRes.id }
            : att
        )
      );
    } catch (err: any) {
      console.warn('[Upload Error]', err);
      setAttachments((prev) =>
        prev.map((att) =>
          att.tempId === tempId
            ? { ...att, uploadState: 'error', errorMessage: err.message || 'Upload failed' }
            : att
        )
      );
    }
  };

  // Unified File Selection Handler (File Picker, Drag & Drop, Paste, Camera Capture)
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size exceeds 10MB limit.');
      return;
    }

    const tempId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const previewUrl = URL.createObjectURL(file);

    const newAttachment: ComposerAttachment = {
      tempId,
      file,
      previewUrl,
      uploadState: 'uploading',
    };

    setAttachments((prev) => [...prev, newAttachment]);
    uploadAttachment(tempId, file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    for (const f of files) {
      handleFileSelect(f);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (tempId: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.tempId === tempId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((a) => a.tempId !== tempId);
    });
  };

  // Clipboard paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      const imageItems = items.filter((item) => item.type.startsWith('image/'));

      if (imageItems.length > 0) {
        e.preventDefault();
        for (const item of imageItems) {
          const file = item.getAsFile();
          if (file) handleFileSelect(file);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTypingStart();

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onTypingStop();
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMuted) return;

    const isAnyUploading = attachments.some((a) => a.uploadState === 'uploading');
    if (isAnyUploading) return;

    const readyAttachments = attachments.filter((a) => a.uploadState === 'ready');
    const uploadIds = readyAttachments.map((a) => a.uploadedId!).filter(Boolean);
    const trimmed = content.trim();

    if (!trimmed && uploadIds.length === 0) return;

    const messageType = uploadIds.length > 0 ? 'IMAGE' : 'TEXT';

    onSendMessage(trimmed, messageType, uploadIds, replyToMessage?.id);

    // Revoke object URLs for sent attachments
    attachments.forEach((att) => URL.revokeObjectURL(att.previewUrl));

    setContent('');
    setAttachments([]);
    if (onCancelReply) onCancelReply();
    onTypingStop();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (!e.dataTransfer.files) return;
    const files = Array.from(e.dataTransfer.files);
    for (const f of files) {
      handleFileSelect(f);
    }
  };

  if (isMuted) {
    return (
      <div className="shrink-0 z-20 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-surface-elevated/90 backdrop-blur-xl border-t border-border">
        <div className="w-full max-w-4xl mx-auto px-4 py-3 text-center text-xs text-amber-500 font-semibold">
          You are muted in this room.
        </div>
      </div>
    );
  }

  const isAnyUploading = attachments.some((a) => a.uploadState === 'uploading');
  const hasReadyUploads = attachments.some((a) => a.uploadState === 'ready');
  const hasContent = Boolean(content.trim());

  const isDisabled = isAnyUploading || (!hasContent && !hasReadyUploads);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="shrink-0 z-20 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 bg-surface-elevated/90 backdrop-blur-2xl border-t border-border/80 relative"
    >
      {/* Drag Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-30 bg-violet-500/15 border-2 border-dashed border-violet-500/50 flex items-center justify-center pointer-events-none backdrop-blur-md">
          <div className="flex items-center gap-2 text-violet-400 font-bold text-sm">
            <ImageIcon className="w-5 h-5" />
            <span>Drop image to send</span>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleFileSelect}
      />

      <div className="w-full max-w-4xl mx-auto px-3 sm:px-6">
        {/* Reply Quote Banner */}
        {replyToMessage && (
          <div className="flex items-center justify-between px-3.5 py-1.5 mb-2 bg-surface/80 rounded-xl border-l-2 border-violet-500 text-xs text-muted animate-slide-up">
            <div className="flex items-center gap-2 truncate min-w-0">
              <CornerUpLeft className="w-3.5 h-3.5 shrink-0 text-violet-400" />
              <span className="truncate">
                Replying to <strong className="text-foreground">{replyToMessage.senderNickname}</strong>: &quot;{replyToMessage.content}&quot;
              </span>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 text-muted hover:text-foreground shrink-0 rounded-full hover:bg-surface-hover"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Image Preview Tray (Instant Local Blob Previews) */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 mb-2 overflow-x-auto no-scrollbar py-0.5">
            {attachments.map((att) => (
              <div
                key={att.tempId}
                className="relative shrink-0 w-[58px] h-[58px] rounded-xl overflow-hidden border border-border bg-surface shadow-sm group/att"
              >
                {/* Instant Local Image Preview */}
                <img src={att.previewUrl} alt="Preview" className="w-full h-full object-cover" />

                {/* Uploading Overlay Spinner */}
                {att.uploadState === 'uploading' && (
                  <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  </div>
                )}

                {/* Upload Failure Overlay */}
                {att.uploadState === 'error' && (
                  <div className="absolute inset-0 bg-rose-950/85 backdrop-blur-[1px] flex flex-col items-center justify-center p-1 text-center">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 mb-0.5" />
                    <button
                      type="button"
                      onClick={() => uploadAttachment(att.tempId, att.file)}
                      className="text-[9px] font-bold text-white underline hover:text-rose-200"
                      title="Retry upload"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Remove Attachment Button */}
                <button
                  type="button"
                  onClick={() => removeAttachment(att.tempId)}
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-black/75 text-white hover:bg-rose-600 transition-colors shadow-sm z-10"
                  title="Remove image"
                  aria-label="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Snapchat-Style Composer Row [ + ] [ 📷 ] [ Input ] [ ↑ ] */}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          {/* File Picker Button [ + ] */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 shrink-0 rounded-2xl bg-surface/80 hover:bg-surface-hover border border-border/80 text-muted hover:text-foreground transition-all active:scale-95 flex items-center justify-center min-w-[44px] min-h-[44px]"
            title="Attach image file"
            aria-label="Attach image file"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Camera Button [ 📷 ] */}
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="p-2.5 shrink-0 rounded-2xl bg-surface/80 hover:bg-surface-hover border border-border/80 text-muted hover:text-foreground transition-all active:scale-95 flex items-center justify-center min-w-[44px] min-h-[44px]"
            title="Take photo with camera"
            aria-label="Take photo with camera"
          >
            <Camera className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Text Area Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${roomSlug}...`}
            className="flex-1 bg-surface/80 rounded-2xl px-4 py-3 border border-border/80 focus:border-violet-500/80 focus:ring-4 focus:ring-violet-500/10 text-[15px] sm:text-base text-foreground placeholder:text-muted/60 resize-none focus:outline-none leading-relaxed max-h-[120px] overflow-y-auto font-sans transition-all"
          />

          {/* Send Button [ ↑ ] */}
          <button
            type="submit"
            disabled={isDisabled}
            className={`p-2.5 shrink-0 rounded-2xl flex items-center justify-center min-w-[44px] min-h-[44px] transition-all active:scale-95 ${
              isDisabled
                ? 'bg-surface/50 text-muted/30 border border-border/40 cursor-default'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/20 border border-white/20'
            }`}
            aria-label="Send message"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  );
};

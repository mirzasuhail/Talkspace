import React, { useState } from 'react';
import { Share2, Check, MoreHorizontal, Users, Sparkles } from 'lucide-react';
import { Logo } from '../ui/Logo';

export interface RoomHeaderProps {
  roomSlug: string;
  onlineCount: number;
  isOwner: boolean;
  onOpenMembers: () => void;
  onOpenMenu: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  roomSlug,
  onlineCount,
  isOwner,
  onOpenMembers,
  onOpenMenu,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const roomUrl = `${window.location.origin}/room/${roomSlug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Talkspace — #${roomSlug}`,
          text: `Join the conversation in #${roomSlug} on Talkspace!`,
          url: roomUrl,
        });
        return;
      } catch {}
    }

    await navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="shrink-0 z-30 w-full bg-surface-elevated/95 backdrop-blur-2xl border-b border-border/80 shadow-sm select-none transition-colors">
      {/* Mobile Safe Area Spacer */}
      <div className="pt-[env(safe-area-inset-top,0px)]">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 h-[56px] flex items-center justify-between gap-3">
          {/* Brand & Room Info (Left Side) */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Logo size="sm" />
            <div className="h-4 w-px bg-border shrink-0" />
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="text-base sm:text-lg font-bold text-foreground truncate tracking-tight">
                #{roomSlug}
              </span>
              {isOwner && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px] font-semibold shrink-0">
                  <Sparkles className="w-2.5 h-2.5" /> host
                </span>
              )}
            </div>
          </div>

          {/* Actions & Presence (Right Side) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Presence Indicator / Count */}
            <button
              onClick={onOpenMembers}
              className="h-9 px-2.5 rounded-xl bg-surface/80 hover:bg-surface-hover border border-border/80 text-foreground transition-all flex items-center gap-1.5 active:scale-95 text-xs font-semibold"
              aria-label={`${onlineCount} members online`}
              title="View members"
            >
              <span className="w-2 h-2 bg-emerald-400 rounded-full shrink-0 animate-pulse" />
              <Users className="w-3.5 h-3.5 text-muted" />
              <span className="tabular-nums">{onlineCount}</span>
            </button>

            {/* Share Action */}
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-xl bg-surface/80 hover:bg-surface-hover border border-border/80 text-muted hover:text-foreground transition-all flex items-center justify-center active:scale-95"
              aria-label="Share room"
              title="Share room"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            {/* More Options */}
            <button
              onClick={onOpenMenu}
              className="w-9 h-9 rounded-xl bg-surface/80 hover:bg-surface-hover border border-border/80 text-muted hover:text-foreground transition-all flex items-center justify-center active:scale-95"
              aria-label="More options"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};



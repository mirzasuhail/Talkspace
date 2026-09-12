import React from 'react';
import { RoomMember } from '@talksy/shared';
import { generateAvatarSvg } from '../../lib/avatar';
import { Crown, VolumeX, Volume2, UserMinus, ShieldAlert, X } from 'lucide-react';

export interface MemberPanelProps {
  isOpen: boolean;
  onClose: () => void;
  members: RoomMember[];
  currentSessionId: string;
  isOwner: boolean;
  onModerationAction: (targetSessionId: string, action: 'kick' | 'ban' | 'mute' | 'unmute') => void;
}

export const MemberPanel: React.FC<MemberPanelProps> = ({
  isOpen,
  onClose,
  members,
  currentSessionId,
  isOwner,
  onModerationAction,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 animate-fade-in" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-sm h-full bg-background border-l border-border p-6 flex flex-col z-10 animate-slide-up overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h3 className="text-base font-semibold text-foreground">Members</h3>
            <p className="text-xs text-muted mt-0.5">{members.length} online</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            aria-label="Close members panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 flex-1 space-y-1">
          {members.map((m) => {
            const isSelf = m.sessionId === currentSessionId;
            return (
              <div
                key={m.sessionId}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border border-border">
                    <img
                      src={generateAvatarSvg(m.avatarSeed, m.nickname)}
                      alt={m.nickname}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground">{m.nickname}</span>
                      {m.isOwner && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <Crown className="w-2.5 h-2.5" /> Host
                        </span>
                      )}
                      {isSelf && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Moderation Controls */}
                {isOwner && !isSelf && (
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => onModerationAction(m.sessionId, m.isMuted ? 'unmute' : 'mute')}
                      className="p-2 rounded-lg text-muted hover:text-amber-500 hover:bg-surface-hover transition-colors"
                      title={m.isMuted ? 'Unmute' : 'Mute'}
                    >
                      {m.isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => onModerationAction(m.sessionId, 'kick')}
                      className="p-2 rounded-lg text-muted hover:text-rose-500 hover:bg-surface-hover transition-colors"
                      title="Kick"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onModerationAction(m.sessionId, 'ban')}
                      className="p-2 rounded-lg text-muted hover:text-rose-500 hover:bg-surface-hover transition-colors"
                      title="Ban"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

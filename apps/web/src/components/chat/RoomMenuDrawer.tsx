import React from 'react';
import { X, Users, Sun, Moon, Monitor, LogOut, UserCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeProvider';
import { useNavigate } from 'react-router-dom';

export interface RoomMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roomSlug: string;
  currentNickname: string;
  onlineCount: number;
  onOpenMembers: () => void;
}

export const RoomMenuDrawer: React.FC<RoomMenuDrawerProps> = ({
  isOpen,
  onClose,
  roomSlug,
  currentNickname,
  onlineCount,
  onOpenMembers,
}) => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLeave = () => {
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Solid Card */}
      <div className="relative w-full max-w-sm bg-background border border-border p-5 rounded-t-2xl sm:rounded-2xl z-10 space-y-4 animate-slide-up shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted block">
              Room
            </span>
            <h3 className="text-base font-semibold text-foreground mt-0.5">
              #{roomSlug}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Identity */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border">
          <UserCheck className="w-4 h-4 text-muted shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted uppercase tracking-wider">Your handle</span>
            <span className="text-sm font-medium text-foreground truncate">{currentNickname || 'Anonymous'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-1.5">
          {/* Members */}
          <button
            onClick={() => {
              onClose();
              onOpenMembers();
            }}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-surface-hover text-foreground transition-colors text-sm"
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-muted" />
              <span>Members</span>
            </div>
            <span className="text-xs text-muted">
              {onlineCount} online
            </span>
          </button>

          {/* Theme */}
          <div className="p-3 rounded-lg bg-surface border border-border space-y-2">
            <span className="text-[10px] text-muted uppercase tracking-wider block">Theme</span>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { key: 'system' as const, icon: Monitor, label: 'System' },
                { key: 'dark' as const, icon: Moon, label: 'Dark' },
                { key: 'light' as const, icon: Sun, label: 'Light' },
              ]).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all border ${
                    theme === key
                      ? 'bg-primary text-white border-primary'
                      : 'bg-transparent text-muted border-border hover:text-foreground hover:border-border-hover'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Leave */}
          <button
            onClick={handleLeave}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors text-sm font-medium mt-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave room</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { AmbientBackground } from '../components/ui/AmbientBackground';
import { apiCreateRoom, apiCheckRoomExists } from '../lib/api';
import { useSession } from '../hooks/useSession';
import { RoomExpiration } from '@talksy/shared';
import { Lock, Clock, LogIn, Plus, AlertCircle, CheckCircle2, Menu, X, Sparkles, Shield, Zap } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { session, initSession } = useSession();

  const [roomName, setRoomName] = useState('');
  const [expiration, setExpiration] = useState<RoomExpiration>('never');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');

  const [isChecking, setIsChecking] = useState(false);
  const [roomExists, setRoomExists] = useState<boolean | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Debounced check room existence
  const checkExistence = useCallback(async (val: string) => {
    if (!val.trim()) {
      setRoomExists(null);
      return;
    }
    setIsChecking(true);
    try {
      const res = await apiCheckRoomExists(val.trim());
      setRoomExists(res.exists);
    } catch {
      setRoomExists(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkExistence(roomName);
    }, 300);
    return () => clearTimeout(timer);
  }, [roomName, checkExistence]);

  // Action 1: Create Room
  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      setActionNotice('Please enter a room name');
      return;
    }

    if (roomExists === true) {
      setActionNotice('This room already exists. Click "Enter Room" to join.');
      return;
    }

    setIsSubmitting(true);
    setActionNotice(null);

    try {
      let currentSession = session;
      if (!currentSession) {
        currentSession = await initSession();
      }

      if (!currentSession) {
        throw new Error('Could not establish session.');
      }

      const res = await apiCreateRoom(
        {
          name: roomName,
          visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
          password: isPrivate ? password : undefined,
          expiration,
        },
        currentSession.id
      );

      navigate(`/join/${res.room.slug}`);
    } catch (err: any) {
      setActionNotice(err.message || 'Failed to create room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action 2: Enter Room
  const handleEnterRoom = async () => {
    if (!roomName.trim()) {
      setActionNotice('Please enter a room name');
      return;
    }

    if (roomExists === false) {
      setActionNotice("That room doesn't exist. Click \"Create Room\" to make it.");
      return;
    }

    navigate(`/join/${roomName.trim().toLowerCase().replace(/[\s_-]+/g, '-')}`);
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-between overflow-x-hidden bg-background text-foreground transition-colors duration-300 antialiased selection:bg-primary/20">
      {/* 01 — Atmospheric Pinterest & Ambient Background */}
      <AmbientBackground />

      {/* 02 — Mobile-First Lovable Header Structure (Left: Menu, Center: Talkspace Logo, Right: Theme Control) */}
      <header className="relative w-full max-w-5xl mx-auto px-4 sm:px-8 pt-4 pb-3 sm:py-6 flex items-center justify-between z-30">
        {/* LEFT: Hamburger Menu Button */}
        <div className="flex items-center">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2.5 rounded-full bg-surface-elevated/70 hover:bg-surface-hover border border-border text-foreground transition-all active:scale-95 shadow-sm"
            aria-label="Toggle Navigation Menu"
            title="Menu"
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Quick Menu Popover */}
          {menuOpen && (
            <div className="absolute top-16 left-4 sm:left-8 w-64 bg-surface-elevated/95 backdrop-blur-2xl border border-border p-4 rounded-2xl shadow-2xl z-50 animate-slide-up space-y-3 text-xs">
              <div className="flex items-center justify-between text-muted font-medium pb-2 border-b border-border">
                <span>Talkspace Navigation</span>
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface/50 text-foreground font-medium">
                  <Zap className="w-4 h-4 text-violet-400" />
                  <span>Instant Connection</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface/50 text-foreground font-medium">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>End-to-End Privacy</span>
                </div>
              </div>
              <div className="pt-1 text-[11px] text-muted text-center border-t border-border/50">
                Talkspace v2.0 • Real-Time Voice & Chat
              </div>
            </div>
          )}
        </div>

        {/* CENTER: Talkspace Logo & Wordmark */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Logo size="md" />
        </div>

        {/* RIGHT: Theme Control */}
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </header>

      {/* 03 — Hero & Room Creation Surface */}
      <main className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-8 flex-1 flex flex-col items-center text-center justify-center z-10">
        {/* Subtle Live Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-elevated/80 backdrop-blur-md border border-border text-xs text-muted font-medium mb-6 sm:mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="tracking-wide">No account required • Instant access</span>
        </div>

        {/* HERO DISPLAY HEADLINE — Tall Condensed Editorial Display Typography (Barlow Condensed) */}
        <h1 className="font-condensed font-extrabold uppercase text-[clamp(3.1rem,11.8vw,6.4rem)] text-foreground leading-[0.88] tracking-tight mb-5 select-none max-w-2xl">
          TALK, WITHOUT<br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-400 to-sky-400">
            THE SETUP.
          </span>
        </h1>

        {/* TAGLINE */}
        <p className="text-base sm:text-lg text-muted max-w-md mb-8 sm:mb-10 leading-relaxed font-normal">
          Create a room. Share the link.<br className="hidden sm:inline" />
          Start talking in real time.
        </p>

        {/* 04 — ROOM CONTROL SURFACE (Lovable Rounded Surface) */}
        <div className="w-full max-w-md bg-surface-elevated/85 backdrop-blur-2xl p-5 sm:p-7 rounded-[26px] border border-border shadow-2xl space-y-4 text-left transition-all relative overflow-hidden">
          {/* Subtle Top Inner Highlight Bar */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 dark:via-white/15 to-transparent pointer-events-none" />

          {/* Room Name Input Container */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <label htmlFor="room-input" className="block text-[11px] font-bold text-muted tracking-wider uppercase">
                ROOM NAME
              </label>

              {roomName.trim() && (
                <div className="pointer-events-none">
                  {isChecking ? (
                    <span className="text-[11px] text-muted animate-pulse font-medium">Checking availability...</span>
                  ) : roomExists === true ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Exists
                    </span>
                  ) : roomExists === false ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                      <Plus className="w-3 h-3" /> Ready to create
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            {/* Single Room Name Input */}
            <div className="relative">
              <Input
                id="room-input"
                type="text"
                value={roomName}
                onChange={(e) => {
                  setRoomName(e.target.value);
                  setActionNotice(null);
                }}
                placeholder="e.g. study-room"
                className="py-4 px-4 text-base rounded-2xl font-medium border-border/80 focus:border-primary/80 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Inline Validation Notice */}
          {actionNotice && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 font-medium animate-slide-up">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionNotice}</span>
            </div>
          )}

          {/* Dual Action Buttons (CREATE ROOM & ENTER ROOM) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              type="button"
              onClick={handleCreateRoom}
              isLoading={isSubmitting}
              disabled={roomExists === true}
              className="py-4 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 hover:from-violet-500 hover:to-sky-400 text-white shadow-lg shadow-violet-500/20 border border-white/20 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5 shrink-0 stroke-[2.5]" />
              <span>CREATE ROOM</span>
            </Button>

            <Button
              type="button"
              onClick={handleEnterRoom}
              variant="secondary"
              disabled={roomExists === false}
              className="py-4 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-2xl bg-surface hover:bg-surface-hover border border-border text-foreground active:scale-[0.98] transition-all"
            >
              <LogIn className="w-4 h-4 mr-1.5 shrink-0 stroke-[2.5]" />
              <span>ENTER ROOM</span>
            </Button>
          </div>

          {/* Configuration Options (Expiry & Private Room) */}
          <div className="flex items-center justify-between gap-2 pt-3 text-xs text-muted border-t border-border/50">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 opacity-60" />
              <span className="font-medium">Expires:</span>
              <select
                value={expiration}
                onChange={(e) => setExpiration(e.target.value as RoomExpiration)}
                className="bg-surface text-foreground border border-border rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-primary font-medium transition-colors cursor-pointer"
              >
                <option value="never">Never</option>
                <option value="1h">1 hour</option>
                <option value="24h">24 hours</option>
                <option value="7d">7 days</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold transition-all ${
                isPrivate
                  ? 'bg-violet-500/10 text-violet-500 dark:text-violet-400 border-violet-500/30'
                  : 'bg-transparent text-muted border-border hover:text-foreground hover:bg-surface'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isPrivate ? 'Private' : 'Make Private'}</span>
            </button>
          </div>

          {/* Private Password Drawer */}
          {isPrivate && (
            <div className="animate-slide-up pt-1">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set access password..."
                className="text-xs rounded-xl py-2.5"
              />
            </div>
          )}
        </div>
      </main>

      {/* 05 — SUBTLE DEVELOPER FOOTER */}
      <footer className="relative w-full max-w-5xl mx-auto px-5 py-5 sm:py-6 text-center text-xs text-muted/70 z-10 font-sans border-t border-border/30">
        Built by{' '}
        <a
          href="https://www.instagram.com/mirzasuhail_?stkn=MWE1Y3h2M2h0b2dxdw=="
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground hover:text-primary underline underline-offset-4 transition-colors"
        >
          Mirza Suhail
        </a>
      </footer>
    </div>
  );
};





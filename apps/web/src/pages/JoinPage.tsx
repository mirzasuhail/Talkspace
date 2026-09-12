import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AmbientBackground } from '../components/ui/AmbientBackground';
import { apiGetRoomInfo, apiVerifyRoomPassword } from '../lib/api';
import { useSession } from '../hooks/useSession';
import { generateAvatarSvg } from '../lib/avatar';
import { Lock, ArrowRight } from 'lucide-react';

export const JoinPage: React.FC = () => {
  const { roomSlug } = useParams<{ roomSlug: string }>();
  const navigate = useNavigate();
  const { session, initSession, updateNickname } = useSession();

  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem('talksy_user_display_name') || session?.nickname || '';
  });
  const [password, setPassword] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomSlug) return;

    const checkRoom = async () => {
      setLoading(true);
      try {
        const info = await apiGetRoomInfo(roomSlug);
        setRequiresPassword(info.requiresPassword && !info.isOwner);
      } catch (err: any) {
        if (err.message?.includes('expired')) {
          setError('This room has expired.');
        } else {
          setError("That room doesn't exist yet.");
        }
      } finally {
        setLoading(false);
      }
    };

    checkRoom();
  }, [roomSlug]);

  useEffect(() => {
    if (session && session.nickname) {
      setNickname(session.nickname);
    }
  }, [session]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("Please enter what you'd like to be called");
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (requiresPassword) {
        await apiVerifyRoomPassword(roomSlug!, password);
      }

      // Save display name locally for future rooms
      localStorage.setItem('talksy_user_display_name', nickname.trim());

      // Explicitly update user chosen name
      if (session) {
        await updateNickname(nickname.trim());
      } else {
        await initSession(nickname.trim());
      }

      if (requiresPassword && password) {
        sessionStorage.setItem(`pass_${roomSlug}`, password);
      }

      navigate(`/room/${roomSlug}`);
    } catch (err: any) {
      setError(err.message || 'Could not join room.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between items-center p-6 bg-background text-foreground overflow-hidden">
      <AmbientBackground />

      <header className="relative w-full max-w-md flex justify-center py-6 z-10">
        <Logo size="md" />
      </header>

      <main className="relative w-full max-w-sm glass-panel p-8 rounded-3xl border border-border shadow-2xl animate-slide-up z-10">
        <div className="text-center mb-6">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-orange mb-1 block">
            BEFORE YOU JOIN...
          </span>
          <h2 className="font-display font-black text-3xl tracking-tight text-foreground uppercase">
            What&apos;s your name?
          </h2>
          <p className="text-xs text-muted mt-1 font-mono">Room: #{roomSlug}</p>
        </div>

        {/* Avatar preview based on chosen name */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-brand-orange/40 shadow-xl shadow-brand-orange/20">
            <img
              src={generateAvatarSvg(session?.avatarSeed || nickname || 'talksy', nickname || 'Talksy')}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <Input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Your name..."
            className="text-base py-3 rounded-2xl font-bold"
            autoFocus
          />

          {requiresPassword && (
            <div className="animate-slide-up space-y-1">
              <div className="flex items-center gap-1 text-xs text-amber-500 font-medium ml-1 mb-1">
                <Lock className="w-3 h-3" />
                <span>Private room password required</span>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="rounded-2xl"
              />
            </div>
          )}

          {error && <p className="text-xs text-rose-400 text-center font-medium">{error}</p>}

          <Button type="submit" size="lg" isLoading={submitting} className="w-full font-black uppercase tracking-wider py-3.5 rounded-2xl bg-brand-orange hover:bg-brand-red text-white shadow-lg shadow-brand-orange/25">
            <span>ENTER ROOM</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </main>

      <footer className="relative py-6 text-xs text-muted z-10 font-mono">
        Talksy — Anonymous Real-time Chat
      </footer>
    </div>
  );
};

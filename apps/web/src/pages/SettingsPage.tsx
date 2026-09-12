import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useSession } from '../hooks/useSession';
import { generateAvatarSvg } from '../lib/avatar';
import { sounds } from '../lib/sounds';
import { ArrowLeft, Volume2, VolumeX, RefreshCw, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { session, updateNickname } = useSession();

  const [nickname, setNickname] = useState(session?.nickname || '');
  const [soundsEnabled, setSoundsEnabled] = useState(sounds.isEnabled());
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Nickname cannot be empty');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      if (session && nickname !== session.nickname) {
        await updateNickname(nickname.trim());
      }
      sounds.setEnabled(soundsEnabled);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between items-center p-6 bg-background">
      <header className="w-full max-w-xl flex items-center justify-between py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <Logo size="sm" />
      </header>

      <main className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl animate-slide-up">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Preferences</h2>
          <p className="text-xs text-zinc-400 mt-1">Customize your Talksy session</p>
        </div>

        {/* Avatar Display */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/40 shadow-xl shadow-primary/20">
            <img
              src={generateAvatarSvg(session?.avatarSeed || nickname, nickname || 'Talksy')}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">Session ID: {session?.id.substring(0, 8)}...</span>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Nickname Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300 ml-1">Nickname</label>
            <Input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your nickname..."
            />
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-white/5">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
              {soundsEnabled ? <Volume2 className="w-4 h-4 text-primary-light" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
              <span>Audio Notifications</span>
            </div>
            <button
              type="button"
              onClick={() => setSoundsEnabled(!soundsEnabled)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                soundsEnabled ? 'bg-primary justify-end' : 'bg-zinc-800 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {error && <p className="text-xs text-rose-400 text-center font-medium">{error}</p>}

          <Button type="submit" size="lg" isLoading={isSaving} className="w-full font-bold shadow-lg shadow-primary/25">
            {saved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300 mr-2" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </Button>
        </form>
      </main>

      <footer className="py-6 text-xs text-zinc-600">
        Talksy — Session Preferences
      </footer>
    </div>
  );
};

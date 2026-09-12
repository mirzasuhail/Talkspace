import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Sparkles } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-between items-center p-6 bg-background text-center">
      <header className="w-full max-w-xl flex justify-center py-6">
        <Logo size="md" />
      </header>

      <main className="w-full max-w-md glass-panel p-10 rounded-3xl border border-white/10 shadow-2xl animate-fade-in my-auto">
        <span className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-pink-500 block mb-2">
          404
        </span>
        <h2 className="text-xl font-bold text-white mb-2">Looks like this room doesn&apos;t exist.</h2>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto mb-8">
          The link might be wrong or the room has expired and was automatically cleaned up.
        </p>

        <Button onClick={() => navigate('/')} size="lg" className="w-full font-bold shadow-lg shadow-primary/25">
          <Sparkles className="w-4 h-4 mr-2" />
          <span>Create a room</span>
        </Button>
      </main>

      <footer className="py-6 text-xs text-zinc-600">
        Talksy — 404 Not Found
      </footer>
    </div>
  );
};

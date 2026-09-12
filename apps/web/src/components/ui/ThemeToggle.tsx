import React from 'react';
import { useTheme, Theme } from '../../context/ThemeProvider';
import { Sun, Moon, Laptop } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'system', label: 'System', icon: <Laptop className="w-3.5 h-3.5" /> },
    { value: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="inline-flex items-center p-1 rounded-full bg-surface border border-border">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            theme === opt.value
              ? 'bg-surface-elevated text-foreground shadow-sm border border-border'
              : 'text-muted hover:text-foreground'
          }`}
          title={`Switch theme to ${opt.label}`}
        >
          {opt.icon}
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', clickable = true, className = '' }) => {
  const sizeClasses = {
    sm: 'text-base gap-2',
    md: 'text-lg sm:text-xl gap-2.5',
    lg: 'text-2xl sm:text-3xl gap-3',
  };

  const iconSizes = {
    sm: 'w-6 h-6 rounded-lg',
    md: 'w-7 h-7 sm:w-8 sm:h-8 rounded-xl',
    lg: 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl',
  };

  const content = (
    <div className={`inline-flex items-center font-sans font-bold tracking-tight text-foreground select-none ${sizeClasses[size]} ${className}`}>
      <div className={`relative flex items-center justify-center bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 text-white shadow-md shadow-violet-500/20 border border-white/20 transition-transform duration-200 hover:scale-105 ${iconSizes[size]}`}>
        {/* Subtle inner highlight */}
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-transparent to-white/20 pointer-events-none" />
        <svg className="w-1/2 h-1/2 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </div>
      <span className="font-semibold tracking-tight text-foreground font-sans">
        Talkspace
      </span>
    </div>
  );

  if (clickable) {
    return <Link to="/" className="transition-opacity hover:opacity-90 active:scale-[0.98]">{content}</Link>;
  }

  return content;
};



import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20 border border-primary-light/20 font-semibold',
    secondary: 'bg-surface-elevated hover:bg-surface-hover text-foreground border border-border hover:border-border-hover',
    ghost: 'bg-transparent hover:bg-surface-hover text-muted hover:text-foreground',
    danger: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20',
    outline: 'bg-transparent border border-border hover:border-border-hover text-foreground hover:bg-surface-hover',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base font-semibold',
  };

  return (
    <button
      className={twMerge(clsx(base, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
};


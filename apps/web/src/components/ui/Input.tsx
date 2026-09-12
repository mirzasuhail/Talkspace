import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {icon && <div className="absolute left-3.5 text-muted pointer-events-none">{icon}</div>}
          <input
            ref={ref}
            className={twMerge(
              clsx(
                'w-full bg-surface-elevated text-foreground placeholder:text-muted/60 border border-border rounded-xl py-2.5 text-sm font-normal focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                icon ? 'pl-10 pr-4' : 'px-4',
                error ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20' : '',
                className
              )
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-500 font-medium ml-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';


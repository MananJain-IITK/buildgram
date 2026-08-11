import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-medium uppercase tracking-wider text-zinc-400">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-zinc-300 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            id={id}
            className={cn(
              'flex h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 transition-all duration-200',
              'focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 focus:bg-zinc-900',
              'hover:border-zinc-700/80',
              icon && 'pl-10',
              error && 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };

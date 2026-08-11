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
          <label htmlFor={id} className="block text-xs font-semibold text-zinc-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            id={id}
            className={cn(
              'flex h-10 w-full rounded-lg border border-[#262626] bg-[#121212] px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 transition-colors',
              'focus:outline-none focus:border-zinc-500',
              icon && 'pl-10',
              error && 'border-rose-500/80 focus:border-rose-500',
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

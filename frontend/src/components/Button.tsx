import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 disabled:pointer-events-none disabled:opacity-40 cursor-pointer active:scale-[0.98] select-none',
  {
    variants: {
      variant: {
        default: 'bg-zinc-100 text-zinc-950 hover:bg-white font-semibold shadow-sm shadow-white/5',
        primary: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-md shadow-purple-900/30 border border-purple-400/20',
        secondary: 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-100 border border-white/10 backdrop-blur-sm',
        outline: 'border border-zinc-700/80 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800/60 hover:text-white hover:border-zinc-600',
        ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50',
        danger: 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 font-medium',
        glow: 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] font-semibold border border-white/10',
        link: 'text-purple-400 underline-offset-4 hover:underline hover:text-purple-300 p-0 h-auto',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs rounded-lg',
        lg: 'h-11 px-6 text-base rounded-xl',
        icon: 'h-9 w-9 p-0 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-85" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

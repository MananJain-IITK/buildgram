import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98] select-none',
  {
    variants: {
      variant: {
        default: 'bg-[#0095f6] text-white hover:bg-[#1877f2]',
        primary: 'bg-[#0095f6] text-white hover:bg-[#1877f2]',
        secondary: 'bg-[#262626] text-white hover:bg-[#363636]',
        outline: 'border border-[#363636] bg-transparent text-zinc-200 hover:bg-[#181818]',
        ghost: 'text-zinc-400 hover:text-white hover:bg-[#181818]',
        danger: 'bg-rose-600/10 text-rose-500 hover:bg-rose-600/20 border border-rose-500/20',
        link: 'text-[#0095f6] underline-offset-4 hover:underline hover:text-[#1877f2] p-0 h-auto font-normal',
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm',
        sm: 'h-8 px-3 text-xs rounded-md',
        lg: 'h-11 px-6 text-base rounded-xl',
        icon: 'h-9 w-9 p-0 rounded-lg',
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
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

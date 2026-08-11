import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hasStory?: boolean;
  isOnline?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
};

export function Avatar({
  src,
  alt = 'User',
  size = 'md',
  hasStory = false,
  isOnline = false,
  className,
  onClick,
}: AvatarProps) {
  const initials = alt ? alt.charAt(0).toUpperCase() : 'U';

  return (
    <div
      className={cn(
        'relative inline-block flex-shrink-0 select-none',
        onClick && 'cursor-pointer group',
        className
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'rounded-full p-[2px] transition-transform duration-150',
          onClick && 'group-hover:scale-105',
          hasStory
            ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600'
            : 'bg-transparent'
        )}
      >
        <div
          className={cn(
            'relative rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center font-semibold text-zinc-300 border border-zinc-800',
            sizeMap[size]
          )}
        >
          {src ? (
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="font-medium text-zinc-400">{initials}</span>
          )}
        </div>
      </div>

      {isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-black" />
      )}
    </div>
  );
}

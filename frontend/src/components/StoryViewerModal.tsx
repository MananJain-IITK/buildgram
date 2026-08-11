import { useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar } from './Avatar';

const STORY_DURATION_MS = 5000;

export interface StoryItem {
  id: number;
  image_url: string;
  expires_at: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    full_name?: string;
    profile_picture_url?: string;
  };
}

export interface StoryGroup {
  user: {
    id: number;
    username: string;
    full_name?: string;
    profile_picture_url?: string;
  };
  stories: StoryItem[];
}

interface StoryViewerModalProps {
  groups: StoryGroup[];
  /** Index of the initial group to open */
  initialGroupIndex: number;
  onClose: () => void;
}

interface ViewerState {
  groupIndex: number;
  storyIndex: number;
}

import { useState } from 'react';

export function StoryViewerModal({ groups, initialGroupIndex, onClose }: StoryViewerModalProps) {
  const [state, setState] = useState<ViewerState>({
    groupIndex: initialGroupIndex,
    storyIndex: 0,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [progress, setProgress] = useState(0);

  const currentGroup = groups[state.groupIndex];
  const currentStory = currentGroup?.stories[state.storyIndex];

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  }, []);

  const goNext = useCallback(() => {
    clearTimers();
    setState((prev) => {
      const group = groups[prev.groupIndex];
      // Move to next story in same group
      if (prev.storyIndex < group.stories.length - 1) {
        return { ...prev, storyIndex: prev.storyIndex + 1 };
      }
      // Move to next group
      if (prev.groupIndex < groups.length - 1) {
        return { groupIndex: prev.groupIndex + 1, storyIndex: 0 };
      }
      // End of all stories
      return prev; // will trigger onClose via effect
    });
  }, [groups, clearTimers]);

  const goPrev = useCallback(() => {
    clearTimers();
    setState((prev) => {
      if (prev.storyIndex > 0) {
        return { ...prev, storyIndex: prev.storyIndex - 1 };
      }
      if (prev.groupIndex > 0) {
        const prevGroup = groups[prev.groupIndex - 1];
        return { groupIndex: prev.groupIndex - 1, storyIndex: prevGroup.stories.length - 1 };
      }
      return prev;
    });
  }, [groups, clearTimers]);

  // Auto-advance timer + progress bar
  useEffect(() => {
    setProgress(0);
    const startTime = Date.now();

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / STORY_DURATION_MS) * 100, 100));
    }, 50);

    timerRef.current = setTimeout(() => {
      const { groupIndex, storyIndex } = state;
      const group = groups[groupIndex];
      const isLastStory = storyIndex >= group.stories.length - 1;
      const isLastGroup = groupIndex >= groups.length - 1;
      if (isLastStory && isLastGroup) {
        onClose();
      } else {
        goNext();
      }
    }, STORY_DURATION_MS);

    return clearTimers;
  }, [state, groups, goNext, clearTimers, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose]);

  // Format time ago
  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  if (!currentGroup || !currentStory) return null;

  const baseUrl = import.meta.env.VITE_API_URL || '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      {/* Viewer container — stop propagation so clicks on content don't close */}
      <div
        className="relative w-full max-w-[400px] h-[100dvh] max-h-[700px] bg-black rounded-2xl overflow-hidden select-none shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
          {currentGroup.stories.map((_, i) => (
            <div key={i} className="flex-1 h-[2px] bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width:
                    i < state.storyIndex
                      ? '100%'
                      : i === state.storyIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-3 right-3 z-20 flex items-center gap-2.5">
          <Avatar
            src={currentGroup.user.profile_picture_url ? `${baseUrl}${currentGroup.user.profile_picture_url}` : undefined}
            alt={currentGroup.user.username}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <span className="text-white text-[13px] font-semibold drop-shadow">
              {currentGroup.user.username}
            </span>
            <span className="text-white/60 text-[11px] ml-2">
              {timeAgo(currentStory.created_at)}
            </span>
          </div>
          <button
            id="story-viewer-close"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Story Image */}
        <img
          src={`${baseUrl}${currentStory.image_url}`}
          alt="Story"
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Tap zones */}
        <div className="absolute inset-0 z-10 flex">
          <div
            className="w-1/3 h-full cursor-pointer flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity"
            onClick={goPrev}
          >
            <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
              <ChevronLeft size={18} className="text-white" />
            </div>
          </div>
          <div className="flex-1" />
          <div
            className="w-1/3 h-full cursor-pointer flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
            onClick={goNext}
          >
            <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
              <ChevronRight size={18} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

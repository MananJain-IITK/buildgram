import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from './Avatar';
import { StoryViewerModal, type StoryGroup } from './StoryViewerModal';
import { storyAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export function StoriesBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerGroupIndex, setViewerGroupIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const baseUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await storyAPI.getFeed();
        setGroups(res.data.story_groups || []);
      } catch {
        // fail silently — stories are a bonus feature
      } finally {
        setIsLoading(false);
      }
    };
    fetchStories();
  }, []);

  const openViewer = (groupIndex: number) => {
    setViewerGroupIndex(groupIndex);
    setViewerOpen(true);
  };

  const myGroup = groups.find((g) => g.user.id === user?.id);
  const otherGroups = groups.filter((g) => g.user.id !== user?.id);

  return (
    <>
      <div className="p-3 bg-black border border-[#262626] rounded-xl overflow-x-auto no-scrollbar flex items-center gap-4">
        {/* Your story bubble */}
        <div
          id="stories-bar-my-story"
          className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
          onClick={() => {
            if (myGroup) {
              // Open viewer at own story group index
              const idx = groups.findIndex((g) => g.user.id === user?.id);
              if (idx !== -1) openViewer(idx);
            } else {
              navigate('/stories/create');
            }
          }}
        >
          <div className="relative">
            <Avatar
              src={user?.profile_picture_url ? `${baseUrl}${user.profile_picture_url}` : undefined}
              alt={user?.username || 'You'}
              size="lg"
              hasStory={!!myGroup}
            />
            {!myGroup && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#0095f6] border-2 border-black flex items-center justify-center">
                <Plus size={11} className="text-white" strokeWidth={3} />
              </div>
            )}
          </div>
          <span className="text-[11px] font-normal text-zinc-300 truncate w-14 text-center">
            {myGroup ? user?.username : 'Your story'}
          </span>
        </div>

        {/* Separator */}
        {(isLoading || otherGroups.length > 0) && (
          <div className="h-12 w-px bg-[#262626] flex-shrink-0" />
        )}

        {/* Other users' story bubbles */}
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-zinc-800" />
                <div className="w-10 h-2 rounded bg-zinc-800" />
              </div>
            ))
          : otherGroups.map((group) => {
              const idx = groups.findIndex((g) => g.user.id === group.user.id);
              return (
                <div
                  key={group.user.id}
                  id={`story-bubble-${group.user.id}`}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
                  onClick={() => openViewer(idx)}
                >
                  <Avatar
                    src={group.user.profile_picture_url ? `${baseUrl}${group.user.profile_picture_url}` : undefined}
                    alt={group.user.username}
                    size="lg"
                    hasStory
                  />
                  <span className="text-[11px] font-normal text-zinc-300 truncate w-14 text-center">
                    {group.user.username}
                  </span>
                </div>
              );
            })}
      </div>

      {/* Story Viewer Modal */}
      {viewerOpen && groups.length > 0 && (
        <StoryViewerModal
          groups={groups}
          initialGroupIndex={viewerGroupIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}

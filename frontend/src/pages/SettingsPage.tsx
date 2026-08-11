import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/services/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Avatar } from '@/components/Avatar';
import { Toast } from '@/components/Toast';
import { Lock, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isPrivate, setIsPrivate] = useState(user?.is_private ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await userAPI.updateProfile({
        full_name: fullName,
        username,
        bio,
        is_private: isPrivate,
      });
      updateUser({ ...user!, ...res.data });
      setToast({ message: 'Profile saved.', type: 'success' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await userAPI.uploadProfilePicture(file);
      updateUser({ ...user!, ...res.data });
      setToast({ message: 'Profile photo updated.', type: 'success' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload photo');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6">
      <h1 className="text-xl font-bold text-white">Edit profile</h1>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg p-3 text-center">
          {error}
        </div>
      )}

      {/* Avatar Change Section */}
      <div className="p-4 rounded-xl bg-[#121212] border border-[#262626] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={user?.profile_picture_url} alt={user?.username || 'U'} size="lg" />
          <div>
            <p className="text-sm font-semibold text-white">{user?.username}</p>
            <p className="text-xs text-zinc-500">{user?.full_name}</p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          Change photo
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePictureUpload} className="hidden" />
      </div>

      {/* Profile Form */}
      <div className="space-y-4">
        <Input
          id="settings-fullname"
          label="Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          id="settings-username"
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-300">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={150}
            rows={3}
            className="w-full bg-[#121212] border border-[#262626] rounded-lg p-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
          />
          <p className="text-right text-[10px] text-zinc-500">{bio.length}/150</p>
        </div>

        {/* Privacy Toggle */}
        <div className="p-4 rounded-xl bg-[#121212] border border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center">
              {isPrivate
                ? <Lock size={16} className="text-zinc-300" />
                : <Globe size={16} className="text-zinc-300" />
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {isPrivate ? 'Private account' : 'Public account'}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isPrivate
                  ? 'Only followers can see your posts'
                  : 'Anyone can see your posts'
                }
              </p>
            </div>
          </div>

          {/* Toggle switch */}
          <button
            id="settings-privacy-toggle"
            type="button"
            role="switch"
            aria-checked={isPrivate}
            onClick={() => setIsPrivate((v) => !v)}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
              transition-colors duration-200 ease-in-out focus:outline-none
              ${isPrivate ? 'bg-[#0095f6]' : 'bg-zinc-700'}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg
                transition duration-200 ease-in-out
                ${isPrivate ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>
        </div>

        <Button onClick={handleSave} variant="primary" className="w-full" isLoading={isLoading}>
          Submit
        </Button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

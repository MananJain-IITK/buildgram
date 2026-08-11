import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/services/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Avatar } from '@/components/Avatar';
import { Toast } from '@/components/Toast';
import { Camera, Settings } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await userAPI.updateProfile({ full_name: fullName, username, bio });
      updateUser({ ...user!, ...res.data });
      setToast({ message: 'Profile updated successfully!', type: 'success' });
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
      setToast({ message: 'Profile photo updated!', type: 'success' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload photo');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold font-display text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" /> Account Settings
        </h1>
        <p className="text-xs text-zinc-500">Update your public profile, bio, and avatar.</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl p-3.5 text-center">
          {error}
        </div>
      )}

      {/* Avatar Change Section */}
      <div className="p-6 rounded-2xl glass-panel border border-white/[0.08] space-y-4">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <Avatar src={user?.profile_picture_url} alt={user?.username || 'U'} size="xl" hasStory />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-2 rounded-full bg-purple-600 text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-900/50"
              title="Change Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">{user?.username}</h3>
            <p className="text-xs text-zinc-500">{user?.email}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Upload new photo
            </button>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePictureUpload} className="hidden" />
      </div>

      {/* Profile Form */}
      <div className="p-6 rounded-2xl glass-panel border border-white/[0.08] space-y-4">
        <Input
          id="settings-fullname"
          label="Full Name"
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
          <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Bio & Developer Headline
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Tell other builders about your tech stack, projects, or interests..."
            className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 resize-none transition-all"
          />
          <p className="text-right text-[10px] text-zinc-500">{bio.length}/500</p>
        </div>

        <Button onClick={handleSave} variant="primary" className="w-full mt-2" isLoading={isLoading}>
          Save Changes
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

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Mail, Lock, User, AtSign, Instagram } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(username, email, password, fullName);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-3">
        <div className="bg-black border border-[#262626] rounded-xl p-8 space-y-5">
          <div className="text-center space-y-2">
            <Instagram className="w-10 h-10 mx-auto text-white" />
            <h1 className="text-2xl font-bold font-serif italic text-white tracking-wide">
              BuildGram
            </h1>
            <p className="text-xs font-semibold text-zinc-400">
              Sign up to see photos and videos from your friends.
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg p-3 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              id="register-fullname"
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={<User className="w-4 h-4" />}
            />
            <Input
              id="register-username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={<AtSign className="w-4 h-4" />}
              required
            />
            <Input
              id="register-email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />
            <Input
              id="register-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
              minLength={6}
            />

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
              Sign up
            </Button>
          </form>
        </div>

        <div className="bg-black border border-[#262626] rounded-xl p-4 text-center">
          <p className="text-xs text-zinc-400">
            Have an account?{' '}
            <Link to="/login" className="text-[#0095f6] font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Mail, Lock, User, AtSign, Terminal, Sparkles, Code2, ShieldCheck } from 'lucide-react';

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
      setError(err.response?.data?.error || 'Registration failed. Please check inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 selection:bg-purple-500/20">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-1/4 right-1/2 translate-x-1/2 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Side: Developer Branding Showcase */}
        <div className="hidden md:flex flex-col justify-between h-full p-8 rounded-3xl glass-panel border border-white/[0.08] relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-purple-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-display text-white tracking-tight leading-tight">
                Join the Network of <br />
                <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  Modern Builders.
                </span>
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Create your developer profile, showcase projects, and engage with a global developer community.
              </p>
            </div>

            <div className="space-y-2.5 pt-4">
              {[
                { icon: Code2, label: 'Instant Profile Creation' },
                { icon: Sparkles, label: 'Showcase Live Project Snapshots' },
                { icon: ShieldCheck, label: 'Privacy & Security Focused' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs text-zinc-300 font-medium">
                  <div className="p-1.5 rounded-lg bg-zinc-900 border border-white/5 text-purple-400">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-white/[0.06] text-[11px] text-zinc-500 font-mono">
            BuildGram • The Developer Social Network
          </div>
        </div>

        {/* Right Side: Register Form */}
        <div className="w-full max-w-sm mx-auto space-y-4">
          <div className="glass-panel border border-white/[0.08] rounded-3xl p-8 shadow-2xl space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center md:hidden">
                <Terminal className="w-6 h-6 text-purple-400" />
              </div>
              <h1 className="text-xl font-bold font-display text-white tracking-tight">Create Account</h1>
              <p className="text-xs text-zinc-500">Enter your details to join BuildGram</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl p-3 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <Input
                id="register-fullname"
                type="text"
                label="Full Name"
                placeholder="Alex Developer"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={<User className="w-4 h-4" />}
              />
              <Input
                id="register-username"
                type="text"
                label="Username"
                placeholder="alex_dev"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                icon={<AtSign className="w-4 h-4" />}
                required
              />
              <Input
                id="register-email"
                type="email"
                label="Email"
                placeholder="alex@buildgram.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
              />
              <Input
                id="register-password"
                type="password"
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                required
                minLength={6}
              />
              <Button type="submit" variant="primary" className="w-full mt-1" isLoading={isLoading}>
                Create Builder Profile
              </Button>
            </form>
          </div>

          <div className="glass-panel border border-white/[0.08] rounded-2xl p-4 text-center">
            <p className="text-xs text-zinc-400">
              Already registered?{' '}
              <Link to="/login" className="text-purple-400 font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

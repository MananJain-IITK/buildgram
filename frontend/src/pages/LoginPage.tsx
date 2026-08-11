import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Mail, Lock, Terminal, Sparkles, ShieldCheck, Code2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 selection:bg-purple-500/20">
      {/* Background Subtle Radial Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[140px]" />
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
                Where Developers <br />
                <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  Share What They Build.
                </span>
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Connect with engineers, share project milestones, and explore open-source updates in real time.
              </p>
            </div>

            {/* Feature Badges */}
            <div className="space-y-2.5 pt-4">
              {[
                { icon: Code2, label: 'Code & Media Snapshots' },
                { icon: Sparkles, label: 'Build in Public Culture' },
                { icon: ShieldCheck, label: 'Fast & Secure Authentication' },
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
            BuildGram Platform • v1.0.0
          </div>
        </div>

        {/* Right Side: Login Form Card */}
        <div className="w-full max-w-sm mx-auto space-y-4">
          <div className="glass-panel border border-white/[0.08] rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center md:hidden">
                <Terminal className="w-6 h-6 text-purple-400" />
              </div>
              <h1 className="text-xl font-bold font-display text-white tracking-tight">Welcome Back</h1>
              <p className="text-xs text-zinc-500">Sign in to your builder account to continue</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl p-3 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="login-email"
                type="email"
                label="Email"
                placeholder="developer@buildgram.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
              />
              <Input
                id="login-password"
                type="password"
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                required
              />

              <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
                Sign In
              </Button>
            </form>
          </div>

          {/* Sign up prompt */}
          <div className="glass-panel border border-white/[0.08] rounded-2xl p-4 text-center">
            <p className="text-xs text-zinc-400">
              New to BuildGram?{' '}
              <Link to="/register" className="text-purple-400 font-semibold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { LogIn, Key, Mail, Shield, User as UserIcon, Loader2, Github } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Listen for success message from popup (after callback completes)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { user, token } = event.data;
        if (user && token) {
          onLoginSuccess(user, token);
          navigate('/');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate, onLoginSuccess]);

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`/api/auth/${provider}/url`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to initiate ${provider} oauth.`);
      }

      const authWindow = window.open(
        data.url,
        `${provider}_oauth_popup`,
        'width=600,height=700,status=no,resizable=yes,scrollbars=yes'
      );

      if (!authWindow) {
        throw new Error('Popup blocked! Please allow popups to sign in with social nodes.');
      }
    } catch (err: any) {
      setError(err.message || `An error occurred initializing ${provider} login.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const data = await api.post<{ token: string; user: any }>('/auth/login', { email, password });
      onLoginSuccess(data.user, data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    try {
      setError(null);
      setLoading(true);
      const data = await api.post<{ token: string; user: any }>('/auth/login', { 
        email: demoEmail, 
        password: demoPass 
      });
      onLoginSuccess(data.user, data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Demo sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-[#09090b] font-sans selection:bg-slate-800 text-slate-200">
      {/* Visual Ambient Section */}
      <div className="hidden lg:flex lg:col-span-7 bg-[#111113] border-r border-slate-800 flex-col p-12 justify-between relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-[-20%] left-[-2%] z-0 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[120px]" />
        
        <div className="flex items-center gap-2.5 z-10">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-mono font-bold text-sm shadow-sm opacity-90">
            PW
          </div>
          <span className="font-sans font-semibold text-slate-200 tracking-tight text-lg">Project Workspace</span>
        </div>

        <div className="space-y-6 max-w-lg z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#09090b] border border-slate-800 text-indigo-400 font-mono text-[10px] uppercase rounded-full tracking-wide">
            Linear Clean Aesthetics
          </div>
          <h1 className="text-4xl font-medium tracking-tight text-white leading-[1.1]">
            Plan, collaborate, and deploy in real-time.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            A secure workspace framework engineered with role-based restrictions, interactive Kanban boards, and immediate dashboard summaries.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono tracking-wider z-10 uppercase">
          Build v1.0.1 • UTC Standard Time
        </div>
      </div>

      {/* Form Section */}
      <div className="col-span-12 lg:col-span-5 flex flex-col justify-center px-6 sm:px-12 py-12 relative bg-[#09090b]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[90px]" />

        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-white">Sign in to Workspace</h2>
            <p className="text-slate-400 text-xs">
              Welcome back. Input email and credentials or choose quick access templates below.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-start gap-2.5">
              <Shield className="w-4 h-4 shrink-0 mt-0.5 animate-pulse" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@workspace.com"
                  className="w-full bg-[#111113] border border-slate-800 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:border-slate-700 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Account Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#111113] border border-slate-800 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:border-slate-700 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm py-2 px-4 rounded-lg cursor-pointer transition select-none disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Continue to App
                </>
              )}
            </button>
          </form>

          {/* Social Logins */}
          <div className="space-y-3">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-500 uppercase tracking-widest font-mono">Or authenticate with</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-2 px-4 bg-[#111113] border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer transition select-none shadow-sm group hover:bg-[#161619] disabled:opacity-50"
              >
                <span className="text-red-400 font-bold group-hover:scale-110 transition text-sm">G</span>
                <span>Google Account</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('github')}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-2 px-4 bg-[#111113] border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer transition select-none shadow-sm group hover:bg-[#161619] disabled:opacity-50"
              >
                <Github className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:scale-110 transition" />
                <span>GitHub Node</span>
              </button>
            </div>
          </div>

          {/* Quick Access Section */}
          <div className="space-y-3 pt-2">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-500 uppercase tracking-widest font-mono">Quick Access Templates</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('arpitv1005@gmail.com', 'admin123')}
                disabled={loading}
                className="flex flex-col items-start p-3 bg-[#111113] border border-slate-800 hover:border-slate-700 text-left rounded-lg cursor-pointer transition select-none group"
              >
                <div className="flex items-center gap-1 text-slate-200 font-medium text-xs">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  Admin Profile
                </div>
                <span className="text-slate-500 font-mono text-[9px] mt-1 group-hover:text-slate-400 transition font-semibold">Arpit Verma</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('aarav@workspace.com', 'member123')}
                disabled={loading}
                className="flex flex-col items-start p-3 bg-[#111113] border border-slate-800 hover:border-slate-700 text-left rounded-lg cursor-pointer transition select-none group"
              >
                <div className="flex items-center gap-1 text-slate-200 font-medium text-xs">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                  Member Profile
                </div>
                <span className="text-slate-500 font-mono text-[9px] mt-1 group-hover:text-slate-400 transition font-semibold">Aarav Patel</span>
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500">
            Don't have an account on this server?{' '}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 transition hover:underline">
              Create User Profile
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

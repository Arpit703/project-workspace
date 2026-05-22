import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { UserPlus, Mail, Key, User as UserIcon, Shield, Loader2, Github } from 'lucide-react';
import { UserRole } from '../types';

interface SignupProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export default function Signup({ onLoginSuccess }: SignupProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Member');
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
    if (!name || !email || !password) {
      setError('Please fill in all standard inputs.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const data = await api.post<{ token: string; user: any }>('/auth/signup', {
        name,
        email,
        password,
        role,
      });
      onLoginSuccess(data.user, data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred during profile registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-[#09090b] font-sans selection:bg-slate-800 text-slate-200">
      {/* Visual Ambient Side */}
      <div className="hidden lg:flex lg:col-span-7 bg-[#111113] border-r border-slate-800 flex-col p-12 justify-between relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-[-20%] left-[-2%] z-0 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[120px]" />
        
        <div className="flex items-center gap-2.5 z-10">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-mono font-bold text-sm shadow-sm opacity-90">
            PW
          </div>
          <span className="font-sans font-semibold text-slate-200 tracking-tight text-lg">Project Workspace</span>
        </div>

        <div className="space-y-6 max-w-lg z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#09090b] border border-slate-800 text-indigo-400 font-mono text-[10px] uppercase rounded-full tracking-wide">
            Role-Based Authorization (RBAC)
          </div>
          <h1 className="text-4xl font-medium tracking-tight text-white leading-[1.1]">
            Build roles & direct workflows dynamically.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Select between Admin permissions for complete portfolio editing, or Member scopes to focus on self-assigned tasks and status tracking.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono tracking-wider z-10 uppercase">
          Build v1.0.1 • UTC Standard Time
        </div>
      </div>

      {/* Form Side */}
      <div className="col-span-12 lg:col-span-5 flex flex-col justify-center px-6 sm:px-12 py-12 relative bg-[#09090b]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[90px]" />

        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-white">Create Workspace Profile</h2>
            <p className="text-slate-400 text-xs">
              Complete registration details to provision your credentials and access permissions.
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
              <label className="text-xs text-slate-400 font-medium">Full Representative Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marcus Aurelius"
                  required
                  className="w-full bg-[#111113] border border-slate-800 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:border-slate-700 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Corporate Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@workspace.com"
                  required
                  className="w-full bg-[#111113] border border-slate-800 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:border-slate-700 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Access Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  className="w-full bg-[#111113] border border-slate-800 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:border-slate-700 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium font-sans">Corporate Workspace Role</label>
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setRole('Admin')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-lg border cursor-pointer select-none transition ${
                    role === 'Admin'
                      ? 'bg-indigo-600 border-indigo-600 text-white font-bold'
                      : 'bg-[#111113] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Administrator
                </button>

                <button
                  type="button"
                  onClick={() => setRole('Member')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-lg border cursor-pointer select-none transition ${
                    role === 'Member'
                      ? 'bg-indigo-600 border-indigo-600 text-white font-bold'
                      : 'bg-[#111113] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Team Member
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {role === 'Admin' 
                  ? 'Admin access: full power to create/delete projects and tasks.'
                  : 'Member access: view tasks, transition self-assigned ticket statuses.'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-550 text-white font-medium text-sm py-2 px-4 rounded-lg cursor-pointer transition select-none disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Sign up & Create Profile
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

          <p className="text-center text-xs text-slate-500 font-sans">
            Already registered?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-305 transition hover:underline">
              Sign In Instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

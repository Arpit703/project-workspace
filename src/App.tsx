import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { api } from './lib/api';
import { User } from './types';

// Components & Layout
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Kanban from './pages/Kanban';
import Login from './pages/Login';
import Signup from './pages/Signup';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  redirectPath?: string;
}

function ProtectedRoute({ isAuthenticated, redirectPath = '/login' }: ProtectedRouteProps) {
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }
  return <Outlet />;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Optionally verify token status with backend
          const data = await api.get<{ user: User }>('/auth/me');
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } catch (error) {
          console.error('Session restored token verification failed:', error);
          handleLogout();
        }
      }
      setLoading(false);
    }
    restoreSession();
  }, []);

  const handleLoginSuccess = (loggedInUser: User, token: string) => {
    setUser(loggedInUser);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 rounded-xl bg-white text-zinc-950 flex items-center justify-center font-mono font-bold text-sm mb-4 animate-bounce">
          PW
        </div>
        <p className="text-zinc-500 text-xs font-mono select-none">Hydrating persistent secure workspace...</p>
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    <BrowserRouter>
      {/* Dynamic Theme Context Wrapper */}
      <div className="min-h-screen bg-zinc-950 text-white flex select-none overflow-hidden h-screen bg-zinc-95 px-0">
        <Routes>
          {/* Public authentication flows */}
          <Route 
            path="/login" 
            element={
              isAuthenticated 
                ? <Navigate to="/" replace /> 
                : <Login onLoginSuccess={handleLoginSuccess} />
            } 
          />
          <Route 
            path="/signup" 
            element={
              isAuthenticated 
                ? <Navigate to="/" replace /> 
                : <Signup onLoginSuccess={handleLoginSuccess} />
            } 
          />

          {/* Secure Workspace pages */}
          <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
            <Route 
              element={
                <div className="flex-1 flex overflow-hidden w-full h-full">
                  <Sidebar user={user} onLogout={handleLogout} />
                  <div className="flex-grow flex flex-col h-screen overflow-hidden bg-zinc-95">
                    {/* Dynamic topbar details */}
                    <Routes>
                      <Route path="/" element={<Navbar title="Core Telemetry" user={user} />} />
                      <Route path="/projects" element={<Navbar title="Portfolio Matrix" user={user} />} />
                      <Route path="/tasks" element={<Navbar title="Work Backlog Grid" user={user} />} />
                      <Route path="/kanban" element={<Navbar title="Interactivity Kanban Sprints" user={user} />} />
                    </Routes>
                    
                    {/* View viewport window */}
                    <div className="flex-1 overflow-hidden flex flex-col h-full w-full">
                      <Outlet />
                    </div>
                  </div>
                </div>
              }
            >
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/projects" element={<Projects user={user} />} />
              <Route path="/tasks" element={<Tasks user={user} />} />
              <Route path="/kanban" element={<Kanban user={user} />} />
            </Route>
          </Route>

          {/* Fail-safe Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

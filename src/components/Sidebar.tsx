import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Briefcase, 
  CheckSquare, 
  LayoutDashboard, 
  Layers, 
  LogOut, 
  Shield, 
  User as UserIcon, 
  FolderGit2
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderGit2 },
    { name: 'Tasks Grid', path: '/tasks', icon: CheckSquare },
    { name: 'Kanban Board', path: '/kanban', icon: Layers },
  ];

  return (
    <aside className="w-64 bg-[#09090b] border-r border-slate-800 flex flex-col justify-between h-screen shrink-0 font-sans select-none">
      {/* Upper Brand Section */}
      <div className="flex flex-col">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">
            PW
          </div>
          <span className="font-bold text-base text-white tracking-tight">Project Workspace</span>
        </div>

        {/* Workspace Quick Details */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#09090b]">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1.5">Workspace Context</div>
          <div className="flex items-center gap-2 text-slate-300 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Production Container</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition ${
                  isActive
                    ? 'bg-slate-800/50 text-white border border-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/20'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile Section */}
      <div className="border-t border-slate-800 p-4 space-y-3.5 bg-[#09090b]">
        {user && (
          <div className="flex items-center gap-3 p-2 bg-[#111113] border border-slate-800/70 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-slate-800/70 flex items-center justify-center text-slate-300">
              {user.role === 'Admin' ? (
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate leading-tight">
                {user.name}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`inline-flex items-center px-1.5 py-0.5 text-[8px] font-mono leading-none rounded uppercase ${
                  user.role === 'Admin'
                    ? 'bg-indigo-505/10 text-indigo-400 font-bold'
                    : 'bg-emerald-505/10 text-emerald-400 font-medium'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/30 rounded-lg cursor-pointer transition"
        >
          <LogOut className="w-4 h-4 text-slate-550" />
          <span>Profile Logout</span>
        </button>
      </div>
    </aside>
  );
}

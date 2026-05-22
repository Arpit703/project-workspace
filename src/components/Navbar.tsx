import { Shield, Clock, Sun, Moon } from 'lucide-react';
import { User } from '../types';
import { useState, useEffect } from 'react';

interface NavbarProps {
  title: string;
  user: User | null;
}

export default function Navbar({ title, user }: NavbarProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-[#09090b] flex items-center justify-between px-8 shrink-0 font-sans select-none">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-mono">{title}</h1>
      </div>

      <div className="flex items-center gap-6">
        {/* Local Environment Stats Widget */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-500 border-r border-slate-800 pr-6">
          <div className="flex items-center gap-1.5 bg-[#111113] border border-slate-800 px-3 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="text-slate-300 select-none">
              {formatDate(time)} • {formatTime(time)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>API Active</span>
          </div>
        </div>

        {/* User Context Info */}
        <div className="flex items-center gap-2.5 bg-[#111113] border border-slate-800 rounded-lg px-2.5 py-1">
          <span className="text-xs text-slate-400 font-medium">
            Active: <span className="text-white">{user?.name.split(' ')[0]}</span>
          </span>
          <span className={`text-[9px] font-mono py-0.5 px-2 rounded-full uppercase ${
            user?.role === 'Admin'
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 font-bold'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 font-medium'
          }`}>
            {user?.role}
          </span>
        </div>
      </div>
    </header>
  );
}

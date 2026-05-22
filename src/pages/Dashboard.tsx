import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { DashboardStats, User } from '../types';
import { 
  FolderGit2, 
  CheckSquare, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  Loader2, 
  Calendar,
  Layers,
  ShieldAlert
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface DashboardProps {
  user: User | null;
}

export default function Dashboard({ user }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<DashboardStats>('/dashboard/stats');
        setStats(data);
      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message || 'Failed to fetch analytics metrics.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-zinc-950">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-zinc-400 text-xs font-mono">Aggregating workspace telemetry analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-zinc-950">
        <ShieldAlert className="w-10 h-10 text-red-500 mb-4" />
        <h3 className="text-sm font-semibold text-white mb-2">Failed to Load Dashboard</h3>
        <p className="text-zinc-500 text-xs text-center max-w-md leading-relaxed">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 bg-zinc-90 w-full hover:bg-zinc-90 text-xs text-white rounded-lg border border-zinc-800 hover:border-zinc-700 cursor-pointer transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const CHART_COLORS = ['#3f3f46', '#6366f1', '#10b981']; // Todo, In Progress, Done

  const cardData = [
    {
      title: 'Active Projects',
      value: stats?.totalProjects || 0,
      description: 'Connected portfolio boards',
      icon: FolderGit2,
      color: 'text-indigo-400',
      bgColor: 'bg-[#111113]',
      borderColor: 'border-slate-800',
      path: '/projects'
    },
    {
      title: 'Current Tasks',
      value: stats?.totalTasks || 0,
      description: 'Distributed backlog workload',
      icon: CheckSquare,
      color: 'text-zinc-300',
      bgColor: 'bg-[#111113]',
      borderColor: 'border-slate-800',
      path: '/tasks'
    },
    {
      title: 'Work Completed',
      value: stats?.completedTasks || 0,
      description: 'Done tickets on user boards',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-[#111113]',
      borderColor: 'border-slate-800',
      path: '/tasks'
    },
    {
      title: 'Backlog Pending',
      value: stats?.pendingTasks || 0,
      description: 'Todo and Active sprints',
      icon: Layers,
      color: 'text-indigo-400',
      bgColor: 'bg-[#111113]',
      borderColor: 'border-slate-800',
      path: '/tasks'
    },
    {
      title: 'Overdue Tickets',
      value: stats?.overdueTasks || 0,
      description: 'Active tickets past due date',
      icon: AlertCircle,
      color: stats?.overdueTasks && stats.overdueTasks > 0 ? 'text-red-400 font-bold' : 'text-slate-400',
      bgColor: stats?.overdueTasks && stats.overdueTasks > 0 ? 'bg-red-950/20' : 'bg-[#111113]',
      borderColor: stats?.overdueTasks && stats.overdueTasks > 0 ? 'border-red-500/30' : 'border-slate-800',
      path: '/tasks'
    }
  ];

  const barChartData = [
    { name: 'To Do', Count: stats?.tasksByStatus.find(s => s.name === 'To Do')?.value || 0 },
    { name: 'Active Sprint', Count: stats?.tasksByStatus.find(s => s.name === 'In Progress')?.value || 0 },
    { name: 'Completed', Count: stats?.tasksByStatus.find(s => s.name === 'Completed')?.value || 0 }
  ];

  return (
    <div className="flex-1 bg-[#09090b] font-sans p-8 space-y-6 overflow-y-auto selection:bg-slate-800 text-slate-200">
      
      {/* Welcome Board */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#111113] border border-slate-800 rounded-2xl relative overflow-hidden shadow-sm">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-80 h-32 bg-indigo-500/5 rounded-full blur-[80px] -z-10" />
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs font-mono uppercase tracking-wider">Telemetry Core</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome, {user?.name}</h2>
          <p className="text-slate-400 text-xs">
            {user?.role === 'Admin'
              ? 'Administrator Access. Fully qualified to provision global projects and delegate tasks.'
              : 'Workspace Member. Visualizing custom active status grids and team sprints.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-3 bg-[#09090b] border border-slate-800 rounded-xl px-4 py-2.5">
            <Clock className="w-4 h-4 text-indigo-400 animate-pulse" />
            <div className="text-left font-mono">
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Dynamic Clock</span>
              <span className="text-xs font-semibold text-white">
                {time.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#09090b] border border-slate-800 rounded-xl px-4 py-2.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <div className="text-left font-mono">
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider">assignee tasks</span>
              <span className="text-xs font-semibold text-emerald-400">
                {(stats as any)?.userSpecificTasksCount || 0} Tickets Total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Cards Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cardData.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(card.path)}
              className={`${card.bgColor} ${card.borderColor} border rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 cursor-pointer transition select-none group shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-sans font-medium uppercase tracking-wider">{card.title}</span>
                <Icon className={`w-4 h-4 ${card.color} group-hover:scale-110 transition`} />
              </div>

              <div className="mt-4 space-y-1">
                <span className="text-3xl font-bold text-white tracking-tight font-mono block leading-none">
                  {card.value}
                </span>
                <span className="text-[10px] text-slate-500 font-sans block truncate">
                  {card.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Visualizers Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status distribution PieChart */}
        <div className="lg:col-span-5 bg-[#111113] border border-slate-800 rounded-xl p-6 flex flex-col justify-between h-[340px] shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-widest">Backlog Sprints Ratio</h3>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>

          <div className="flex-1 h-44 relative mt-2">
            {stats && stats.totalTasks > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.tasksByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.tasksByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#f1f5f9', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                No tickets in scope
              </div>
            )}
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-2xl font-mono font-bold text-white block leading-none">
                {stats?.totalTasks || 0}
              </span>
              <span className="text-[9px] text-slate-500 tracking-wider block font-sans uppercase mt-1">Backlog</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-[10px] font-mono border-t border-slate-800 pt-3">
            <div className="flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[0] }}></span>
              <span className="text-slate-400">Backlog Todo</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[1] }}></span>
              <span className="text-slate-400">In Progress</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[2] }}></span>
              <span className="text-slate-400">Completed</span>
            </div>
          </div>
        </div>

        {/* Backlog Bar Metrics */}
        <div className="lg:col-span-7 bg-[#111113] border border-slate-800 rounded-xl p-6 flex flex-col justify-between h-[340px] shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-widest">Sprint Velocity</h3>
            <TrendingUp className="w-4 h-4 text-slate-500" />
          </div>

          <div className="flex-1 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f1f5f9', fontSize: '11px', fontFamily: 'monospace' }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                />
                <Bar dataKey="Count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent portfolio changes grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent projects */}
        <div className="bg-[#111113] border border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-widest">Connected Projects Portfolio</h3>
            <button 
              onClick={() => navigate('/projects')}
              className="text-[10px] text-indigo-400 font-mono font-semibold hover:text-indigo-350 flex items-center gap-1 cursor-pointer transition"
            >
              All Projects <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-850 shrink-0">
            {stats && stats.recentProjects.length > 0 ? (
              stats.recentProjects.map((prj) => (
                <div 
                  key={prj.id} 
                  onClick={() => navigate('/projects')}
                  className="py-3 flex items-start justify-between cursor-pointer group"
                >
                  <div className="min-w-0 pr-4">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 block transition">
                      {prj.title}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate max-w-[280px] mt-0.5">
                      {prj.description}
                    </span>
                  </div>

                  <div className="text-right text-[10px] font-mono shrink-0">
                    <span className="text-slate-500 block">Owner/Admin</span>
                    <span className="text-slate-400 block mt-0.5 font-medium">{prj.creatorName}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs font-mono">
                No active projects constructed yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Work / Backlog */}
        <div className="bg-[#111113] border border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-widest">Recently Assigned</h3>
            <button 
              onClick={() => navigate('/tasks')}
              className="text-[10px] text-indigo-400 font-mono font-semibold hover:text-indigo-350 flex items-center gap-1 cursor-pointer transition"
            >
              All Work Backlog <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-850 shrink-0">
            {stats && stats.recentTasks.length > 0 ? (
              stats.recentTasks.map((t) => (
                <div 
                  key={t.id} 
                  onClick={() => navigate('/tasks')}
                  className="py-3 flex items-start justify-between cursor-pointer group"
                >
                  <div className="min-w-0 pr-4">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 block transition">
                      {t.title}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
                      Scope: {t.projectName}
                    </span>
                  </div>

                  <div className="text-right flex flex-col items-end shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[8px] font-mono leading-none rounded-full uppercase ${
                       t.status === 'Done'
                         ? 'bg-emerald-500/10 text-emerald-400'
                         : t.status === 'In Progress'
                         ? 'bg-indigo-500/10 text-indigo-400'
                         : 'bg-slate-800 text-slate-400'
                    }`}>
                      {t.status}
                    </span>

                    <span className="text-[9px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      {t.dueDate}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs font-mono">
                No tickets in workload backlog.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

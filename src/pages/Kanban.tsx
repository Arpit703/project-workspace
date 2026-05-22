import { useEffect, useState, DragEvent } from 'react';
import { api } from '../lib/api';
import { Task, Project, User } from '../types';
import { 
  CheckSquare, 
  Calendar, 
  User as UserIcon, 
  ShieldAlert, 
  Loader2, 
  Layers,
  ArrowRight,
  ChevronRight,
  Hand
} from 'lucide-react';

interface KanbanProps {
  user: User | null;
}

export default function Kanban({ user }: KanbanProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      setLoading(true);
      setError(null);
      const { tasks: loadedTasks } = await api.get<{ tasks: Task[] }>('/tasks');
      setTasks(loadedTasks);
    } catch (err: any) {
      setError(err.message || 'Failed to load team tasks for board.');
    } finally {
      setLoading(false);
    }
  }

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault(); // Required to allow drop!
  };

  const handleDrop = async (e: DragEvent, targetStatus: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // Save previous state for optimistic updates
    const previousTasks = [...tasks];

    // Optimistically update status in state
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));

    try {
      await api.put(`/tasks/${taskId}`, { status: targetStatus });
    } catch (err: any) {
      alert(err.message || 'Unauthorized: You are not assigned to this task or member of this project.');
      // Revert if API failed
      setTasks(previousTasks);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#09090b] flex flex-col items-center justify-center py-16">
        <Loader2 className="w-7 h-7 text-indigo-500 animate-spin mb-3" />
        <p className="text-slate-500 text-[11px] font-mono">Loading Kanban board...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl flex items-start gap-4 m-8">
        <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-red-400">Board Pipeline Sync Failed</h4>
          <p className="text-slate-500 text-xs leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  const columns: { title: string; status: Task['status']; color: string; dot: string }[] = [
    { title: 'Backlog List', status: 'Todo', color: 'border-slate-800 text-slate-300', dot: 'bg-slate-500' },
    { title: 'Active Sprint', status: 'In Progress', color: 'border-indigo-500/20 text-indigo-400', dot: 'bg-indigo-500' },
    { title: 'Completed Sprints', status: 'Done', color: 'border-emerald-500/20 text-emerald-400', dot: 'bg-emerald-500' }
  ];

  return (
    <div className="flex-1 bg-[#09090b] font-sans p-8 flex flex-col gap-6 overflow-y-auto selection:bg-slate-800 text-slate-200">
      
      {/* Interactive Tooltip bar */}
      <div className="flex items-center gap-3 p-4 bg-indigo-500/5 border border-slate-800 rounded-xl shadow-sm">
        <Hand className="w-4 h-4 text-indigo-400 animate-bounce" />
        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
          <strong>Kanban Interface Active:</strong> Hold and drag any card below to transition its sprint segment. 
          Members can update statuses optimistically! Illegal transitions are safely rolled-back.
        </p>
      </div>

      {/* Kanban Slices Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-start min-h-[500px]">
        {columns.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.status);
          
          return (
            <div
              key={col.status}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
              className="bg-[#111113] border border-slate-800 rounded-xl p-5 flex flex-col gap-4 min-h-[480px] hover:border-slate-700/60 transition group shadow-sm"
            >
              {/* Column Name */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`}></span>
                  <h3 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-widest leading-none">
                    {col.title}
                  </h3>
                </div>
                <span className="text-[10px] bg-[#09090b] border border-slate-800 text-slate-500 px-2.2 py-0.5 rounded-full font-mono">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards block */}
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[550px] pr-1 scrollbar-thin">
                {colTasks.length > 0 ? (
                  colTasks.map((t) => {
                    const isOverdue = t.status !== 'Done' && t.dueDate < new Date().toISOString().split('T')[0];
                    return (
                      <div
                        key={t.id}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        className={`p-4 bg-[#09090b] w-full hover:bg-slate-900/40 border rounded-xl cursor-grab active:cursor-grabbing transition shadow-sm border-slate-800 flex flex-col justify-between group h-[135px] select-none ${
                          isOverdue ? 'border-red-500/20 hover:border-red-500/30 bg-red-950/5' : 'hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <span className="text-[9px] text-slate-500 font-mono block uppercase truncate select-none">
                            {t.projectName}
                          </span>
                          <span className={`text-xs font-semibold block leading-tight truncate mt-1 ${
                            t.status === 'Done' ? 'text-slate-500 line-through font-normal' : 'text-slate-200'
                          }`}>
                            {t.title}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-800 pt-2.5 mt-2.5 shrink-0 select-none">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-slate-850 border border-slate-750 flex items-center justify-center text-[8px] font-mono text-slate-400 uppercase font-semibold">
                              {t.assigneeDetails ? t.assigneeDetails.name.charAt(0) : '?'}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[80px]">
                              {t.assigneeDetails ? t.assigneeDetails.name.split(' ')[0] : 'Unassigned'}
                            </span>
                          </div>

                          <span className={`text-[9px] font-mono inline-flex items-center gap-1 ${
                            isOverdue ? 'text-red-400 font-semibold' : 'text-slate-500'
                          }`}>
                            <Calendar className="w-3 h-3 text-slate-600" />
                            {t.dueDate}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-600 text-[10px] font-mono">
                    Empty slot segment
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

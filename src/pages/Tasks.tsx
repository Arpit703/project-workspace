import { useEffect, useState, FormEvent, MouseEvent } from 'react';
import { api } from '../lib/api';
import { Task, Project, User } from '../types';
import { 
  Plus, 
  CheckSquare, 
  Trash2, 
  Calendar, 
  User as UserIcon, 
  Search, 
  ShieldAlert, 
  Loader2, 
  X, 
  Edit3, 
  ChevronRight,
  FolderLock,
  Layers,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface TasksProps {
  user: User | null;
}

export default function Tasks({ user }: TasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterAssignedMe, setFilterAssignedMe] = useState(false);

  // Creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taskStatus, setTaskStatus] = useState<'Todo' | 'In Progress' | 'Done'>('Todo');
  const [createError, setCreateError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit/transition dialog state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState<Task['status']>('Todo');
  const [editError, setEditError] = useState<string | null>(null);

  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    loadData();
  }, [filterProject, filterAssignedMe]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Construct query paths
      let path = '/tasks?';
      if (filterProject !== 'ALL') path += `projectId=${filterProject}&`;
      if (filterAssignedMe) path += `assignedToMe=true&`;

      const { tasks: loadedTasks } = await api.get<{ tasks: Task[] }>(path);
      setTasks(loadedTasks);

      const { projects: loadedProjects } = await api.get<{ projects: Project[] }>('/projects');
      setProjects(loadedProjects);

      const { users: loadedUsers } = await api.get<{ users: User[] }>('/auth/users');
      setUsers(loadedUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to load task backing backlog.');
    } finally {
      setLoading(false);
    }
  }

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !selectedProject || !selectedAssignee) {
      setCreateError('Please fill in title, project, and assignee fields.');
      return;
    }

    try {
      setSubmitting(true);
      setCreateError(null);
      await api.post('/tasks', {
        title,
        description,
        project: selectedProject,
        assignedTo: selectedAssignee,
        dueDate,
        status: taskStatus,
      });

      // Reset
      setTitle('');
      setDescription('');
      setSelectedProject('');
      setSelectedAssignee('');
      setDueDate('');
      setTaskStatus('Todo');
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create task transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditAssignee(task.assignedTo);
    setEditDueDate(task.dueDate);
    setEditStatus(task.status);
    setEditError(null);
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      setSubmitting(true);
      setEditError(null);

      // Create body depending on user role
      const updatePayload: any = {};
      if (isAdmin) {
        updatePayload.title = editTitle;
        updatePayload.description = editDescription;
        updatePayload.assignedTo = editAssignee;
        updatePayload.dueDate = editDueDate;
        updatePayload.status = editStatus;
      } else {
        // Members can ONLY transition status
        updatePayload.status = editStatus;
      }

      await api.put(`/tasks/${editingTask.id}`, updatePayload);
      setEditingTask(null);
      loadData();
    } catch (err: any) {
      setEditError(err.message || 'Failed to submit modifications.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you absolutely sure you want to delete this task ticket?')) {
      return;
    }

    try {
      await api.delete(`/tasks/${taskId}`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task.');
    }
  };

  // Instant inline toggle status for extreme ease-of-use (Members can check things off!)
  const handleToggleStatus = async (task: Task, e: MouseEvent) => {
    e.stopPropagation();
    const nextStatus: Task['status'] = task.status === 'Done' ? 'Todo' : 'Done';
    try {
      await api.put(`/tasks/${task.id}`, { status: nextStatus });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Unauthorized: You are not assigned to this task or member of this project.');
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 bg-[#09090b] font-sans p-8 flex flex-col gap-6 overflow-y-auto selection:bg-slate-800 text-slate-200">
      
      {/* Search, filters & Creation Actions */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-[#111113] border border-slate-800 rounded-xl p-4.5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full lg:w-auto">
          {/* Search Query */}
          <div className="relative w-full sm:w-56 overflow-hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks by name..."
              className="w-full bg-[#09090b] border border-slate-800 text-white rounded-lg pl-9 pr-3.5 py-1.5 text-xs focus:border-slate-700 transition"
            />
          </div>

          {/* Project Node Filter */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="w-full sm:w-44 bg-[#09090b] border border-slate-800 text-slate-300 rounded-lg px-2 py-1.5 text-xs focus:border-slate-700 transition cursor-pointer"
          >
            <option value="ALL">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>

          {/* Status filter dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-36 bg-[#09090b] border border-slate-800 text-slate-300 rounded-lg px-2 py-1.5 text-xs focus:border-slate-700 transition cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Todo">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Completed</option>
          </select>

          {/* Toggle Self Tasks */}
          <button
            onClick={() => setFilterAssignedMe(!filterAssignedMe)}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 text-xs border rounded-lg cursor-pointer transition select-none shadow-sm ${
              filterAssignedMe
                ? 'bg-indigo-600 border-indigo-600 text-white font-semibold'
                : 'bg-[#09090b] border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Assigned to Me
          </button>
        </div>

        {/* Create Sprints Trigger (Admin Only) */}
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition select-none w-full lg:w-auto justify-center shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-indigo-500 animate-spin mb-3" />
          <p className="text-slate-500 text-[11px] font-mono">Syncing active backlogs...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl flex items-start gap-4">
          <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-red-400">Backlog Sync Interrupt</h4>
            <p className="text-slate-500 text-xs leading-relaxed">{error}</p>
          </div>
        </div>
      ) : (
        /* Tasks List Wrapper */
        <div className="bg-[#111113] border border-slate-800 rounded-xl overflow-hidden select-none shadow-sm">
          <div className="min-w-full divide-y divide-slate-850">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-[#09090b] text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-800">
              <span className="col-span-5">Backlog Title & Scope</span>
              <span className="col-span-2">Belongs to</span>
              <span className="col-span-2">Assigned Member</span>
              <span className="col-span-2">Deadline</span>
              <span className="col-span-1 text-right">Settings</span>
            </div>

            {/* Table Body rows */}
            {filteredTasks.length > 0 ? (
              filteredTasks.map((t) => {
                const isOverdue = t.status !== 'Done' && t.dueDate < new Date().toISOString().split('T')[0];
                return (
                  <div
                    key={t.id}
                    onClick={() => handleOpenEdit(t)}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center w-full hover:bg-slate-800/10 transition border-b border-slate-850 cursor-pointer group"
                  >
                    {/* Title with checkbox */}
                    <div className="col-span-5 flex items-start gap-3 min-w-0 pr-4">
                      <button
                        onClick={(e) => handleToggleStatus(t, e)}
                        className={`mt-0.5 p-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition cursor-pointer ${
                          t.status === 'Done'
                            ? 'bg-emerald-500/10 border-emerald-400 text-emerald-400'
                            : 'bg-[#09090b] border-slate-800 text-transparent hover:border-slate-700'
                        }`}
                        title={t.status === 'Done' ? 'Mark Backlog Pending' : 'Mark Task Completed'}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>

                      <div className="min-w-0">
                        <span className={`text-xs font-semibold block leading-snug truncate ${
                          t.status === 'Done' ? 'text-slate-500 line-through font-normal' : 'text-slate-200'
                        }`}>
                          {t.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-sans block truncate max-w-sm mt-0.5">
                          {t.description || 'No detailed scope.'}
                        </span>
                      </div>
                    </div>

                    {/* Project Node */}
                    <div className="col-span-2 text-xs text-slate-400 truncate font-mono">
                      {t.projectName}
                    </div>

                    {/* Assignee */}
                    <div className="col-span-2 flex items-center gap-2 min-w-0">
                      <div className="w-5.5 h-5.5 rounded-full bg-slate-800 border border-slate-700 text-[8px] font-semibold font-mono text-slate-300 flex items-center justify-center uppercase shrink-0">
                        {t.assigneeDetails ? t.assigneeDetails.name.charAt(0) : '?'}
                      </div>
                      <span className="text-xs text-slate-300 truncate font-semibold">
                        {t.assigneeDetails ? t.assigneeDetails.name : 'Unassigned'}
                      </span>
                    </div>

                    {/* Deadline */}
                    <div className="col-span-2 text-xs font-mono flex items-center gap-1.5">
                      <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-red-400' : 'text-slate-600'}`} />
                      <span className={isOverdue ? 'text-red-400 font-semibold uppercase text-[10px] tracking-wide animate-pulse' : 'text-slate-400'}>
                        {t.dueDate} {isOverdue && '(Overdue)'}
                      </span>
                    </div>

                    {/* Actions column */}
                    <div className="col-span-1 flex items-center justify-end gap-1.5 shrink-0">
                      <span className={`inline-flex items-center px-1.5 py-0.5 text-[8px] font-semibold font-mono leading-none rounded uppercase group-hover:hidden ${
                        t.status === 'Done'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : t.status === 'In Progress'
                          ? 'bg-indigo-500/10 text-indigo-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {t.status}
                      </span>

                      <div className="hidden group-hover:flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition select-none cursor-pointer"
                          title="View and Modify"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {isAdmin && (
                          <button
                            onClick={(e) => handleDeleteTask(t.id, e)}
                            className="p-1 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded transition select-none cursor-pointer"
                            title="Delete Task Ticket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="p-16 text-center text-slate-500 text-xs font-mono">
                No active backlog items matched your querying constraints.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL (Admin Only) */}
      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-[#111113] border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden flex flex-col relative shadow-xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#111113]">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Initialize Task Ticket</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-[#09090b] border border-transparent hover:border-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer transition select-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTask} className="p-6 space-y-4 bg-[#111113]">
              {createError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">{createError}</div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Task Heading / Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Wireframe User Settings Dashboard"
                  className="w-full bg-[#09090b] border border-slate-800 text-white rounded-lg px-3 py-2 text-xs focus:border-slate-700 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Detailed Backlog Scope</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe technical implementation path, access metrics, and deliverables..."
                  className="w-full bg-[#09090b] border border-slate-800 text-white rounded-lg p-3 text-xs focus:border-slate-700 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium font-sans">Belongs to Project Node</label>
                  <select
                    required
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full bg-[#09090b] border border-slate-800 text-slate-350 rounded-lg p-2 text-xs focus:border-slate-700 transition cursor-pointer"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium font-sans">Allocate Assignee</label>
                  <select
                    required
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    className="w-full bg-[#09090b] border border-slate-800 text-slate-350 rounded-lg p-2 text-xs focus:border-slate-700 transition cursor-pointer"
                  >
                    <option value="">Select Developer</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium font-sans">Sprints Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as any)}
                    className="w-full bg-[#09090b] border border-slate-800 text-slate-350 rounded-lg p-2 text-xs focus:border-slate-700 transition cursor-pointer"
                  >
                    <option value="Todo">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Completed</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Target Deadline</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#09090b] border border-slate-800 text-white rounded-lg p-2 text-xs focus:border-slate-700 transition cursor-pointer font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#09090b] border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-400 hover:text-white rounded-lg cursor-pointer transition select-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg cursor-pointer transition select-none disabled:opacity-50 shadow-sm"
                >
                  {submitting ? 'Initializing Node...' : 'Commit Ticket'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* VIEW / TRANSITION MODAL (Everyone can view, Admins edit everything, Members edit only Status) */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-[#111113] border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden flex flex-col relative shadow-xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#111113]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
                  {isAdmin ? 'Modify Backlog Ticket' : 'Backlog Node Details'}
                </span>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1 hover:bg-[#09090b] border border-transparent hover:border-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer transition select-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 bg-[#111113]">
              {editError && (
                <div className="p-3 bg-red-400/10 border border-red-500/20 text-red-400 text-xs rounded-lg">{editError}</div>
              )}

              {/* Title input (Editable for Admin, Static for Member) */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Task Heading / Title</label>
                {isAdmin ? (
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-[#09090b] border border-slate-800 text-white rounded-lg px-3 py-2 text-xs focus:border-slate-700 transition"
                  />
                ) : (
                  <div className="bg-[#09090b] p-3 rounded-lg border border-slate-800 text-slate-200 text-xs font-semibold">
                    {editingTask.title}
                  </div>
                )}
              </div>

              {/* Description input */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Detailed Backlog Scope</label>
                {isAdmin ? (
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-[#09090b] border border-slate-800 text-white rounded-lg p-3 text-xs focus:border-slate-700 transition"
                  />
                ) : (
                  <div className="bg-[#09090b] p-3 rounded-lg border border-slate-805 text-slate-400 text-xs leading-relaxed max-h-36 overflow-y-auto">
                    {editingTask.description || 'No detailed scope.'}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Project Node (Static) */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium uppercase font-mono text-[9px] tracking-wider">Project Node</label>
                  <div className="bg-[#09090b] px-3 py-2 rounded-lg border border-slate-800 text-slate-350 text-xs font-semibold font-mono">
                    {editingTask.projectName}
                  </div>
                </div>

                {/* Assignee (Editable for Admin, Static for Member) */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Allocate Assignee</label>
                  {isAdmin ? (
                    <select
                      value={editAssignee}
                      onChange={(e) => setEditAssignee(e.target.value)}
                      className="w-full bg-[#09090b] border border-slate-800 text-slate-350 rounded-lg p-2 text-xs focus:border-slate-700 transition cursor-pointer"
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-[#09090b] px-3 py-2 rounded-lg border border-slate-800 text-slate-300 text-xs flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-mono text-slate-400 uppercase font-semibold">
                        {editingTask.assigneeDetails ? editingTask.assigneeDetails.name.charAt(0) : '?'}
                      </div>
                      <span className="truncate font-semibold">{editingTask.assigneeDetails ? editingTask.assigneeDetails.name : 'Unassigned'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Status selector (Editable for ALL, Members can transition own tickets) */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Sprint Slices Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-[#09090b] border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:border-slate-700 transition cursor-pointer font-bold"
                  >
                    <option value="Todo">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Completed</option>
                  </select>
                </div>

                {/* Due Date (Editable for Admin, Static for Member) */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Deadline Target</label>
                  {isAdmin ? (
                    <input
                      type="date"
                      required
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="w-full bg-[#09090b] border border-slate-800 text-white rounded-lg p-2 text-xs focus:border-slate-700 transition cursor-pointer font-mono"
                    />
                  ) : (
                    <div className="bg-[#09090b] px-3 py-2 rounded-lg border border-slate-800 text-slate-300 text-xs font-mono">
                      {editingTask.dueDate}
                    </div>
                  )}
                </div>
              </div>

              {/* Role Help Info tag for Member */}
              {!isAdmin && (
                <div className="p-2.5 bg-[#09090b] border border-slate-800 rounded-lg flex items-center gap-2 shadow-inner">
                  <FolderLock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] text-slate-500 font-mono">Note: Only Administrators can modify task text details or allocation.</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3.5 bg-[#111113]">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 bg-[#09090b] border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-400 hover:text-white rounded-lg cursor-pointer transition select-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg cursor-pointer transition select-none disabled:opacity-50 shadow-sm"
                >
                  {submitting ? 'Applying Change...' : 'Save Configuration'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

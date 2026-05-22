import { useEffect, useState, FormEvent, MouseEvent } from 'react';
import { api } from '../lib/api';
import { Project, User, Task } from '../types';
import { 
  Plus, 
  FolderGit2, 
  User as UserIcon, 
  Search, 
  ShieldAlert, 
  Loader2, 
  Calendar, 
  Trash2, 
  Edit3, 
  X,
  PlusCircle,
  FolderOpen,
  Group
} from 'lucide-react';

interface ProjectsProps {
  user: User | null;
}

export default function Projects({ user }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      
      const { projects: loadedProjects } = await api.get<{ projects: Project[] }>('/projects');
      setProjects(loadedProjects);

      const { users: loadedUsers } = await api.get<{ users: User[] }>('/auth/users');
      setUsers(loadedUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects portfolio data.');
    } finally {
      setLoading(false);
    }
  }

  const handleOpenProjectDetails = async (project: Project) => {
    try {
      const data = await api.get<{ project: Project; tasks: Task[] }>(`/projects/${project.id}`);
      setSelectedProject(data.project);
      setProjectTasks(data.tasks);
    } catch (err: any) {
      alert(err.message || 'Failed to open project details.');
    }
  };

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!title) {
      setCreateError('Project Title is required.');
      return;
    }

    try {
      setSubmitting(true);
      setCreateError(null);
      await api.post('/projects', {
        title,
        description,
        teamMembers: selectedMembers,
      });

      // Reset & Reload
      setTitle('');
      setDescription('');
      setSelectedMembers([]);
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create project portfolio item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you absolutely sure you want to delete this project? This will cascade-delete all associated backlog tasks!')) {
      return;
    }

    try {
      await api.delete(`/projects/${projectId}`);
      // Close detail view if currently selected
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project.');
    }
  };

  const handleToggleMemberSelection = (userId: string) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 bg-[#09090b] font-sans p-8 flex flex-col gap-6 overflow-y-auto selection:bg-slate-800 text-slate-200">
      
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by title..."
            className="w-full bg-[#111113] border border-slate-800 text-white rounded-lg pl-10 pr-4 py-2 text-xs focus:border-slate-700 transition"
          />
        </div>

        {/* Create Trigger (Admin Only) */}
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition select-none shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-indigo-500 animate-spin mb-3" />
          <p className="text-slate-500 text-[11px] font-mono">Syncing project portfolios...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl flex items-start gap-3.5">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-red-400">Error Loading Project Portfolio</h4>
            <p className="text-slate-500 text-xs leading-relaxed">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Portfolio Grid List */}
          <div className="lg:col-span-12 xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((prj) => {
                const isSelected = selectedProject?.id === prj.id;
                return (
                  <div
                    key={prj.id}
                    onClick={() => handleOpenProjectDetails(prj)}
                    className={`p-6 border rounded-xl cursor-pointer select-none transition flex flex-col justify-between h-[190px] shadow-sm ${
                      isSelected
                        ? 'bg-[#111113] border-indigo-500/50 relative shadow-indigo-500/5'
                        : 'bg-[#111113] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <FolderGit2 className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-zinc-400'}`} />
                          <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wide font-mono leading-none truncate max-w-[180px]">
                            {prj.title}
                          </h3>
                        </div>

                        {isAdmin && (
                          <button
                            onClick={(e) => handleDeleteProject(prj.id, e)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-850 rounded-lg cursor-pointer transition select-none"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <p className="text-zinc-500 text-[10px] mt-2.5 leading-relaxed line-clamp-3">
                        {prj.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-900 pt-3 mt-4">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {prj.membersDetails?.map((memb) => (
                          <div
                            key={memb.id}
                            className="w-5.5 h-5.5 rounded-full bg-zinc-800 border-2 border-zinc-950 flex items-center justify-center text-[8px] font-mono text-zinc-400 uppercase font-semibold select-none"
                            title={`${memb.name} (${memb.role})`}
                          >
                            {memb.name.charAt(0)}
                          </div>
                        ))}
                      </div>

                      <span className="text-[9px] text-zinc-500 font-mono inline-flex items-center gap-1 leading-none">
                        <Calendar className="w-3 h-3 text-zinc-600" />
                        {new Date(prj.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-16 text-center border border-dashed border-zinc-900 rounded-2xl text-zinc-500 text-xs font-mono">
                No projects matched your details query
              </div>
            )}
          </div>

          {/* Project Details Sidebar Drawer */}
          {selectedProject && (
            <div className="lg:col-span-12 xl:col-span-4 bg-[#111113] border border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200 font-mono uppercase tracking-widest leading-none">Portfolio Node Details</span>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-1 bgColor bg-[#09090b] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg cursor-pointer transition shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Title & metadata */}
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{selectedProject.title}</h2>
                <p className="text-slate-400 text-xs leading-relaxed">{selectedProject.description}</p>
              </div>

              {/* Members */}
              <div className="space-y-3 border-t border-slate-800 pt-5">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-semibold">Allocated Team Members</label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedProject.membersDetails?.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 bg-[#09090b] border border-slate-800/80 rounded-lg p-2 shadow-sm">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-300 font-bold uppercase">
                        {m.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-200 block truncate font-semibold">{m.name}</span>
                        <span className="text-[8px] text-slate-500 block uppercase font-mono">{m.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Associated Tasks */}
              <div className="space-y-3.5 border-t border-slate-800 pt-5">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-semibold">Active Backlog Tickets ({projectTasks.length})</label>
                <div className="divide-y divide-slate-850">
                  {projectTasks.length > 0 ? (
                    projectTasks.map((tsk) => (
                      <div key={tsk.id} className="py-2.5 flex items-start justify-between">
                        <div className="min-w-0 pr-4">
                          <span className="text-xs font-semibold text-slate-300 block truncate leading-tight">{tsk.title}</span>
                          <span className="text-[9px] text-slate-500 block font-mono mt-0.5">Assignee: {tsk.assigneeDetails ? tsk.assigneeDetails.name : 'Unassigned'}</span>
                        </div>
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[8px] font-mono leading-none rounded uppercase shrink-0 ${
                          tsk.status === 'Done'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                            : tsk.status === 'In Progress'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10'
                            : 'bg-slate-800 text-slate-400 border border-slate-800'
                        }`}>
                          {tsk.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-600 text-[10px] font-mono">No tasks associated with this node.</div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* Creation Modal (Admin Only) */}
      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden flex flex-col relative select-none shadow-xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#111113]">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Initialize Project Node</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-[#09090b] border border-transparent hover:border-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer transition select-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateProject} className="p-6 space-y-4 bg-[#111113]">
              {createError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">{createError}</div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Project Name / Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Project Apollo"
                  className="w-full bg-[#09090b] border border-slate-800 text-white rounded-lg px-3 py-2 text-xs focus:border-slate-700 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Scope Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize objectives, targets, access schemas..."
                  className="w-full bg-[#09090b] border border-slate-800 text-white rounded-lg p-3 text-xs focus:border-slate-700 transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-medium font-sans">Allocate Team Members ({selectedMembers.length} Selected)</label>
                <div className="max-h-36 overflow-y-auto border border-slate-800 bg-[#09090b] rounded-lg p-2 gap-1 flex flex-col">
                  {users.map((u) => {
                    const isChecked = selectedMembers.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleToggleMemberSelection(u.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer select-none transition ${
                          isChecked ? 'bg-[#111113]/85 border border-slate-800' : 'hover:bg-slate-800/20 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono font-semibold uppercase text-slate-300">
                            {u.name.charAt(0)}
                          </div>
                          <span className="text-xs font-semibold">{u.name}</span>
                        </div>

                        <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${
                          u.role === 'Admin' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-emerald-500/15 text-emerald-400'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#09090b] border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-400 hover:text-white rounded-lg cursor-pointer transition select-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg cursor-pointer transition select-none disabled:opacity-50 shadow-sm"
                >
                  {submitting ? 'Initializing Node...' : 'Commit Project'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

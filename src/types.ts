export type UserRole = 'Admin' | 'Member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  createdBy: string; // User ID
  creatorName?: string;
  teamMembers: string[]; // User IDs
  membersDetails?: User[];
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  project: string; // Project ID
  projectName?: string;
  assignedTo: string; // User ID
  assigneeDetails?: User;
  status: 'Todo' | 'In Progress' | 'Done';
  dueDate: string;
  createdAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  tasksByStatus: { name: string; value: number }[];
  recentTasks: Task[];
  recentProjects: Project[];
}

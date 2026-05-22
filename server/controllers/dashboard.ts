import { Response } from 'express';
import db from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export function getDashboardStats(req: AuthenticatedRequest, res: Response): void {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'Admin';

  const allProjects = db.getProjects();
  const allTasks = db.getTasks();

  // Filter projects/tasks visible to user
  const visibleProjects = allProjects.filter(p => isAdmin || p.teamMembers.includes(userId));
  const visibleProjectIds = visibleProjects.map(p => p.id);

  const visibleTasks = allTasks.filter(t => 
    isAdmin || t.assignedTo === userId || visibleProjectIds.includes(t.project)
  );

  const myTasks = allTasks.filter(t => t.assignedTo === userId);

  // Status analysis
  const statusCounts = {
    Todo: 0,
    'In Progress': 0,
    Done: 0,
  };

  const todayStr = new Date().toISOString().split('T')[0];
  let overdueCount = 0;

  visibleTasks.forEach(task => {
    if (task.status in statusCounts) {
      statusCounts[task.status]++;
    }
    
    // An active task is overdue if its due date is prior to today and it is not completed
    if (task.status !== 'Done' && task.dueDate < todayStr) {
      overdueCount++;
    }
  });

  const completed = statusCounts['Done'];
  const pending = statusCounts['Todo'] + statusCounts['In Progress'];

  // format status metrics for Recharts
  const tasksByStatus = [
    { name: 'To Do', value: statusCounts['Todo'] },
    { name: 'In Progress', value: statusCounts['In Progress'] },
    { name: 'Completed', value: statusCounts['Done'] },
  ];

  // Map and populate recent tasks (limit to 5)
  const recentTasks = [...visibleTasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(t => {
      const assignee = db.getUserById(t.assignedTo);
      const proj = db.getProjectById(t.project);
      return {
        ...t,
        projectName: proj ? proj.title : 'Deleted Project',
        assigneeDetails: assignee ? {
          id: assignee.id,
          name: assignee.name,
          email: assignee.email,
          role: assignee.role,
          createdAt: assignee.createdAt,
        } : undefined,
      };
    });

  // Map and populate recent projects (limit to 5)
  const recentProjects = [...visibleProjects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(p => {
      const creator = db.getUserById(p.createdBy);
      return {
        ...p,
        creatorName: creator ? creator.name : 'Unknown Creator',
      };
    });

  res.json({
    totalProjects: visibleProjects.length,
    totalTasks: visibleTasks.length,
    completedTasks: completed,
    pendingTasks: pending,
    overdueTasks: overdueCount,
    tasksByStatus,
    recentTasks,
    recentProjects,
    userSpecificTasksCount: myTasks.length,
  });
}

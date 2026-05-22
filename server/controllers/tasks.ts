import { Response } from 'express';
import db from '../db';
import { AuthenticatedRequest } from '../middleware/auth';
import { Task } from '../../src/types';

export function createTask(req: AuthenticatedRequest, res: Response): void {
  const { title, description, project: projectId, assignedTo, dueDate, status } = req.body;

  if (!title || !projectId || !assignedTo) {
    res.status(400).json({ error: 'Title, project and assignedTo are required fields.' });
    return;
  }

  // Validate Project
  const projectDoc = db.getProjectById(projectId);
  if (!projectDoc) {
    res.status(400).json({ error: 'Project not found.' });
    return;
  }

  // Validate Assignee
  const assigneeDoc = db.getUserById(assignedTo);
  if (!assigneeDoc) {
    res.status(400).json({ error: 'Assignee not found.' });
    return;
  }

  try {
    const newTask = db.createTask({
      title: title.trim(),
      description: (description || '').trim(),
      project: projectId,
      assignedTo,
      status: (status || 'Todo') as Task['status'],
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    res.status(201).json({
      message: 'Task created successfully',
      task: newTask,
    });
  } catch (error) {
    console.error('CreateTask error:', error);
    res.status(500).json({ error: 'Internal server error creating task.' });
  }
}

export function getTasks(req: AuthenticatedRequest, res: Response): void {
  const { projectId, assignedToMe } = req.query;
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'Admin';

  let filteredTasks = db.getTasks();

  // If filtered by project
  if (projectId && typeof projectId === 'string') {
    filteredTasks = filteredTasks.filter(t => t.project === projectId);
  }

  // If filtered explicitly by "assigned to me"
  if (assignedToMe === 'true') {
    filteredTasks = filteredTasks.filter(t => t.assignedTo === userId);
  } else if (!isAdmin) {
    // Standard Member constraint: Members can view tasks assigned to them, OR on projects they belong to
    const myProjectsList = db.getProjects()
      .filter(p => p.teamMembers.includes(userId))
      .map(p => p.id);

    filteredTasks = filteredTasks.filter(t => 
      t.assignedTo === userId || myProjectsList.includes(t.project)
    );
  }

  // Populate references
  const tasksWithDetails = filteredTasks.map(t => {
    const assignee = db.getUserById(t.assignedTo);
    const projDetail = db.getProjectById(t.project);

    return {
      ...t,
      projectName: projDetail ? projDetail.title : 'Deleted Project',
      assigneeDetails: assignee ? {
        id: assignee.id,
        name: assignee.name,
        email: assignee.email,
        role: assignee.role,
        createdAt: assignee.createdAt,
      } : undefined,
    };
  });

  res.json({ tasks: tasksWithDetails });
}

export function updateTask(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params;
  const { title, description, assignedTo, status, dueDate } = req.body;
  const user = req.user!;

  const taskDoc = db.getTaskById(id);
  if (!taskDoc) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  const updates: Partial<Omit<Task, 'id' | 'createdAt' | 'project'>> = {};

  if (user.role === 'Admin') {
    // Admins can change any task parameters
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (dueDate !== undefined) updates.dueDate = dueDate;
    
    if (assignedTo !== undefined) {
      const assigneeDoc = db.getUserById(assignedTo);
      if (!assigneeDoc) {
        res.status(400).json({ error: 'Assignee user not found.' });
        return;
      }
      updates.assignedTo = assignedTo;
    }

    if (status !== undefined) {
      if (!['Todo', 'In Progress', 'Done'].includes(status)) {
        res.status(400).json({ error: 'Invalid status type. Must be Todo, In Progress, or Done.' });
        return;
      }
      updates.status = status as Task['status'];
    }
  } else {
    // Members can ONLY transition the task status
    if (title !== undefined || description !== undefined || assignedTo !== undefined || dueDate !== undefined) {
      res.status(403).json({ error: 'Forbidden. Members can only modify a task status.' });
      return;
    }

    if (status !== undefined) {
      if (!['Todo', 'In Progress', 'Done'].includes(status)) {
        res.status(400).json({ error: 'Invalid status type.' });
        return;
      }
      // Security Check: Is this member assigned to this task, OR are they on the project team?
      const pj = db.getProjectById(taskDoc.project);
      const isProjectMember = pj?.teamMembers.includes(user.id);

      if (taskDoc.assignedTo !== user.id && !isProjectMember) {
        res.status(403).json({ error: 'Forbidden. You are not assigned to this task or member of this project.' });
        return;
      }

      updates.status = status as Task['status'];
    }
  }

  const updatedTask = db.updateTask(id, updates);
  if (!updatedTask) {
    res.status(500).json({ error: 'Failed to update task.' });
    return;
  }

  // Populate detailing before response
  const assignee = db.getUserById(updatedTask.assignedTo);
  const proj = db.getProjectById(updatedTask.project);

  res.json({
    message: 'Task updated successfully',
    task: {
      ...updatedTask,
      projectName: proj ? proj.title : 'Deleted Project',
      assigneeDetails: assignee ? {
        id: assignee.id,
        name: assignee.name,
        email: assignee.email,
        role: assignee.role,
        createdAt: assignee.createdAt,
      } : undefined,
    },
  });
}

export function deleteTask(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params;
  const taskDoc = db.getTaskById(id);

  if (!taskDoc) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  const success = db.deleteTask(id);
  if (!success) {
    res.status(500).json({ error: 'Failed to delete task.' });
    return;
  }

  res.json({ message: 'Task deleted successfully.' });
}

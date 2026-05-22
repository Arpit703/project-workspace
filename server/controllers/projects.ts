import { Response } from 'express';
import db from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export function createProject(req: AuthenticatedRequest, res: Response): void {
  const { title, description, teamMembers } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Project title is required.' });
    return;
  }

  const creatorId = req.user!.id;
  
  // Make sure team members list is parsed safely and includes the creator
  let membersList: string[] = [creatorId];
  if (Array.isArray(teamMembers)) {
    // Standardize IDs and remove duplicates
    const uniqueIds = Array.from(new Set([...teamMembers, creatorId]));
    membersList = uniqueIds.filter(id => typeof id === 'string' && db.getUserById(id));
  }

  try {
    const newProject = db.createProject({
      title: title.trim(),
      description: (description || '').trim(),
      createdBy: creatorId,
      teamMembers: membersList,
    });

    res.status(201).json({
      message: 'Project created successfully',
      project: newProject,
    });
  } catch (error) {
    console.error('CreateProject error:', error);
    res.status(500).json({ error: 'Failed to create project.' });
  }
}

export function getProjects(req: AuthenticatedRequest, res: Response): void {
  const allProjects = db.getProjects();
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'Admin';

  // Filter projects: Admins see everything, Members see projects they are assigned to
  const filteredProjects = allProjects.filter(prj => 
    isAdmin || prj.teamMembers.includes(userId)
  );

  // Populate references
  const projectsWithDetails = filteredProjects.map(prj => {
    const creator = db.getUserById(prj.createdBy);
    const membersDetails = prj.teamMembers
      .map(id => db.getUserById(id))
      .filter((u): u is NonNullable<typeof u> => !!u)
      .map(({ id, name, email, role, createdAt }) => ({ id, name, email, role, createdAt }));

    return {
      ...prj,
      creatorName: creator ? creator.name : 'Unknown Creator',
      membersDetails,
    };
  });

  res.json({ projects: projectsWithDetails });
}

export function getProjectById(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params;
  const project = db.getProjectById(id);

  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'Admin';

  // Verify access privileges
  if (!isAdmin && !project.teamMembers.includes(userId)) {
    res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    return;
  }

  // Populate reference stats and details
  const creator = db.getUserById(project.createdBy);
  const membersDetails = project.teamMembers
    .map(mId => db.getUserById(mId))
    .filter((u): u is NonNullable<typeof u> => !!u)
    .map(({ id, name, email, role, createdAt }) => ({ id, name, email, role, createdAt }));

  // Populate tasks belonging to this project
  const projectTasks = db.getTasks().filter(t => t.project === project.id).map(tsk => {
    const assignee = db.getUserById(tsk.assignedTo);
    return {
      ...tsk,
      assigneeDetails: assignee ? {
        id: assignee.id,
        name: assignee.name,
        email: assignee.email,
        role: assignee.role,
        createdAt: assignee.createdAt,
      } : undefined
    };
  });

  res.json({
    project: {
      ...project,
      creatorName: creator ? creator.name : 'Unknown Creator',
      membersDetails,
    },
    tasks: projectTasks,
  });
}

export function updateProject(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params;
  const { title, description, teamMembers } = req.body;

  const project = db.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const updates: any = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description.trim();

  if (teamMembers !== undefined && Array.isArray(teamMembers)) {
    // Ensure creator remains in project team
    const uniqueIds = Array.from(new Set([...teamMembers, project.createdBy]));
    updates.teamMembers = uniqueIds.filter(mId => typeof mId === 'string' && db.getUserById(mId));
  }

  const updatedProject = db.updateProject(id, updates);
  if (!updatedProject) {
    res.status(500).json({ error: 'Failed to update project.' });
    return;
  }

  res.json({
    message: 'Project updated successfully',
    project: updatedProject,
  });
}

export function deleteProject(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params;
  const project = db.getProjectById(id);

  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const success = db.deleteProject(id);
  if (!success) {
    res.status(500).json({ error: 'Failed to delete project.' });
    return;
  }

  res.json({
    message: 'Project and all associated tasks successfully deleted.',
  });
}

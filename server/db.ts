import * as fs from 'fs';
import * as path from 'path';
import { User, Project, Task } from '../src/types';
import bcrypt from 'bcryptjs';

const DB_DIR = path.join(process.cwd(), 'server-data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> hashed_password
  projects: Project[];
  tasks: Task[];
}

class LocalDatabase {
  private data: DatabaseSchema = {
    users: [],
    passwords: {},
    projects: [],
    tasks: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
      } else {
        this.seedInitialData();
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      this.seedInitialData();
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  private seedInitialData() {
    console.log('Seeding initial workspace data...');
    const hashedAdminPassword = bcrypt.hashSync('admin123', 10);
    const hashedMemberPassword = bcrypt.hashSync('member123', 10);

    const adminUser: User = {
      id: 'usr_admin1',
      name: 'Arpit Verma',
      email: 'arpitv1005@gmail.com',
      role: 'Admin',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const memberUser1: User = {
      id: 'usr_member1',
      name: 'Aarav Patel',
      email: 'aarav@workspace.com',
      role: 'Member',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const memberUser2: User = {
      id: 'usr_member2',
      name: 'Kavya Reddy',
      email: 'kavya@workspace.com',
      role: 'Member',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const project1: Project = {
      id: 'prj_nebula',
      title: 'Project Parivartan',
      description: 'Modernize the core customer web portal to support vernacular languages and simplified local UPI payment checkouts.',
      createdBy: adminUser.id,
      teamMembers: [adminUser.id, memberUser1.id, memberUser2.id],
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const project2: Project = {
      id: 'prj_apex',
      title: 'Uday Design System',
      description: 'Create a reusable, highly accessible UI component library and visual brand guidelines for all web portals and mobile services.',
      createdBy: adminUser.id,
      teamMembers: [adminUser.id, memberUser2.id],
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const task1: Task = {
      id: 'tsk_1',
      title: 'Enhance Mobile Load Speeds',
      description: 'Optimize image components and bundle sizes to ensure fluid user navigation over unstable 3G networks.',
      project: project1.id,
      assignedTo: memberUser1.id,
      status: 'In Progress',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const task2: Task = {
      id: 'tsk_2',
      title: 'UPI Gateway Integration Audit',
      description: 'Ensure double-spend protection guards are in position for the upcoming backend payout endpoints.',
      project: project1.id,
      assignedTo: adminUser.id,
      status: 'Done',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const task3: Task = {
      id: 'tsk_3',
      title: 'Audit Vernacular Font Contrast',
      description: 'Verify color contrast scores on UI widgets displaying regional languages to support AA standards.',
      project: project2.id,
      assignedTo: memberUser2.id,
      status: 'Todo',
      dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const task4: Task = {
      id: 'tsk_4',
      title: 'Real-time Portal Synchronization',
      description: 'Implement dynamic local state events to reflect ongoing ticket transitions cleanly on user dashboards.',
      project: project1.id,
      assignedTo: memberUser2.id,
      status: 'Todo',
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Overdue
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    };

    this.data = {
      users: [adminUser, memberUser1, memberUser2],
      passwords: {
        [adminUser.id]: hashedAdminPassword,
        [memberUser1.id]: hashedMemberPassword,
        [memberUser2.id]: hashedMemberPassword,
      },
      projects: [project1, project2],
      tasks: [task1, task2, task3, task4],
    };

    this.save();
  }

  // User methods
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getPasswordHash(userId: string): string | undefined {
    return this.data.passwords[userId];
  }

  createUser(user: Omit<User, 'id' | 'createdAt'>, passwordHash: string): User {
    const newUser: User = {
      ...user,
      id: `usr_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.data.passwords[newUser.id] = passwordHash;
    this.save();
    return newUser;
  }

  // Project methods
  getProjects(): Project[] {
    return this.data.projects;
  }

  getProjectById(id: string): Project | undefined {
    return this.data.projects.find(p => p.id === id);
  }

  createProject(project: Omit<Project, 'id' | 'createdAt'>): Project {
    const newProject: Project = {
      ...project,
      id: `prj_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.projects.push(newProject);
    this.save();
    return newProject;
  }

  updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'createdBy'>>): Project | undefined {
    const index = this.data.projects.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    this.data.projects[index] = {
      ...this.data.projects[index],
      ...updates,
    };
    this.save();
    return this.data.projects[index];
  }

  deleteProject(id: string): boolean {
    const initialLen = this.data.projects.length;
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    // Also cascade delete tasks belonging to this project
    this.data.tasks = this.data.tasks.filter(t => t.project !== id);
    this.save();
    return this.data.projects.length < initialLen;
  }

  // Task methods
  getTasks(): Task[] {
    return this.data.tasks;
  }

  getTaskById(id: string): Task | undefined {
    return this.data.tasks.find(t => t.id === id);
  }

  createTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
    const newTask: Task = {
      ...task,
      id: `tsk_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.tasks.push(newTask);
    this.save();
    return newTask;
  }

  updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'project'>>): Task | undefined {
    const index = this.data.tasks.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    this.data.tasks[index] = {
      ...this.data.tasks[index],
      ...updates,
    } as Task;
    this.save();
    return this.data.tasks[index];
  }

  deleteTask(id: string): boolean {
    const initialLen = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    this.save();
    return this.data.tasks.length < initialLen;
  }
}

export const db = new LocalDatabase();
export default db;

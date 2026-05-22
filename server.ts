import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

// Controllers
import { signup, login, me, getAllUsers } from './server/controllers/auth';
import { getGoogleAuthUrl, googleCallback, getGithubAuthUrl, githubCallback } from './server/controllers/oauth';
import { createProject, getProjects, getProjectById, updateProject, deleteProject } from './server/controllers/projects';
import { createTask, getTasks, updateTask, deleteTask } from './server/controllers/tasks';
import { getDashboardStats } from './server/controllers/dashboard';

// Middleware
import { authMiddleware, adminMiddleware } from './server/middleware/auth';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic Middleware
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Authentication Endpoints
  app.post('/api/auth/signup', signup);
  app.post('/api/auth/login', login);
  app.get('/api/auth/me', authMiddleware as any, me as any);
  app.get('/api/auth/users', authMiddleware as any, getAllUsers as any);

  // Social OAuth 2.0 Endpoints
  app.get('/api/auth/google/url', getGoogleAuthUrl);
  app.get(['/auth/callback/google', '/auth/callback/google/'], googleCallback);
  app.get('/api/auth/github/url', getGithubAuthUrl);
  app.get(['/auth/callback/github', '/auth/callback/github/'], githubCallback);

  // Project Endpoints
  app.post('/api/projects', authMiddleware as any, adminMiddleware as any, createProject as any);
  app.get('/api/projects', authMiddleware as any, getProjects as any);
  app.get('/api/projects/:id', authMiddleware as any, getProjectById as any);
  app.put('/api/projects/:id', authMiddleware as any, adminMiddleware as any, updateProject as any);
  app.delete('/api/projects/:id', authMiddleware as any, adminMiddleware as any, deleteProject as any);

  // Task Endpoints
  app.post('/api/tasks', authMiddleware as any, adminMiddleware as any, createTask as any);
  app.get('/api/tasks', authMiddleware as any, getTasks as any);
  app.put('/api/tasks/:id', authMiddleware as any, updateTask as any);
  app.delete('/api/tasks/:id', authMiddleware as any, adminMiddleware as any, deleteTask as any);

  // Dashboard Endpoints
  app.get('/api/dashboard/stats', authMiddleware as any, getDashboardStats as any);

  // Integration with Vite
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start fullstack server:', err);
});

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import { UserRole } from '../../src/types';
import { AuthenticatedRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_workspace_token_key_1337';

export async function signup(req: Request, res: Response): Promise<void> {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email and password are required fields.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = db.getUserByEmail(normalizedEmail);
  if (existingUser) {
    res.status(400).json({ error: 'A user with this email address already exists.' });
    return;
  }

  const selectedRole: UserRole = role === 'Admin' ? 'Admin' : 'Member';

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = db.createUser(
      {
        name: name.trim(),
        email: normalizedEmail,
        role: selectedRole,
      },
      passwordHash
    );

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(211).json({
      message: 'Account registered successfully',
      token,
      user: newUser,
    });
  } catch (error) {
    console.error('Signup controller error:', error);
    res.status(500).json({ error: 'An unexpected error occurred during account registration' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required fields.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.getUserByEmail(normalizedEmail);

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  try {
    const hash = db.getPasswordHash(user.id);
    if (!hash) {
      res.status(411).json({ error: 'Internal server credentials error.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      message: 'Logged in successfully',
      token,
      user,
    });
  } catch (error) {
    console.error('Login controller error:', error);
    res.status(500).json({ error: 'An unexpected error occurred during authentication' });
  }
}

export function me(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }
  res.json({ user: req.user });
}

export function getAllUsers(req: AuthenticatedRequest, res: Response): void {
  // Return list of other users to assign tasks
  const users = db.getUsers().map(({ id, name, email, role, createdAt }) => ({
    id,
    name,
    email,
    role,
    createdAt,
  }));
  res.json({ users });
}

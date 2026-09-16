import { Router } from 'express';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../db/client.js';
import { users, folders } from '../db/schema.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { conflict, unauthorized } from '../utils/errors.js';
import { newId } from '../utils/id.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  displayName: z.string().max(255).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const DEFAULT_FOLDERS = [
  'Welcome',
  'Orders',
  'Follow Up',
  'Payment',
  'Products',
  'Customer Support',
  'Voice Messages',
  'Videos',
  'Images',
];

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body as z.infer<typeof registerSchema>;
    const db = getDb();
    const existing = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1);
    if (existing.length) {
      throw conflict('Email already registered');
    }
    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({
        id: newId(),
        email: email.toLowerCase(),
        passwordHash,
        displayName: displayName ?? null,
      })
      .returning();

    await db.insert(folders).values(
      DEFAULT_FOLDERS.map((name, i) => ({
        id: newId(),
        userId: user.id,
        name,
        sortOrder: i,
      }))
    );

    const token = signToken({ sub: user.id, email: user.email });
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1);
    if (!user) throw unauthorized('Invalid email or password');
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw unauthorized('Invalid email or password');
    const token = signToken({ sub: user.id, email: user.email });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (e) {
    next(e);
  }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.id, req.user!.id), isNull(users.deletedAt)))
      .limit(1);
    if (!user) throw unauthorized();
    res.json({ user });
  } catch (e) {
    next(e);
  }
});


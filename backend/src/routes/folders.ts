import { Router } from 'express';
import { and, eq, isNull, asc } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../db/client.js';
import { folders } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { notFound, badRequest } from '../utils/errors.js';
import { paramId } from '../utils/params.js';
import { newId } from '../utils/id.js';

const createSchema = z.object({
  name: z.string().min(1).max(255),
  sortOrder: z.number().int().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sortOrder: z.number().int().optional(),
});

export const foldersRouter = Router();
foldersRouter.use(requireAuth);

foldersRouter.get('/', async (req, res, next) => {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(folders)
      .where(and(eq(folders.userId, req.user!.id), isNull(folders.deletedAt)))
      .orderBy(asc(folders.sortOrder), asc(folders.name));
    res.json({ folders: rows });
  } catch (e) {
    next(e);
  }
});

foldersRouter.post('/', validateBody(createSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof createSchema>;
    const db = getDb();
    const [row] = await db
      .insert(folders)
      .values({
        id: newId(),
        userId: req.user!.id,
        name: body.name,
        sortOrder: body.sortOrder ?? 0,
      })
      .returning();
    res.status(201).json({ folder: row });
  } catch (e) {
    next(e);
  }
});

foldersRouter.get('/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(folders)
      .where(
        and(
          eq(folders.id, paramId(req)),
          eq(folders.userId, req.user!.id),
          isNull(folders.deletedAt)
        )
      )
      .limit(1);
    if (!row) throw notFound('Folder not found');
    res.json({ folder: row });
  } catch (e) {
    next(e);
  }
});

foldersRouter.patch('/:id', validateBody(updateSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof updateSchema>;
    if (!body.name && body.sortOrder === undefined) {
      throw badRequest('No fields to update');
    }
    const db = getDb();
    const [existing] = await db
      .select()
      .from(folders)
      .where(
        and(
          eq(folders.id, paramId(req)),
          eq(folders.userId, req.user!.id),
          isNull(folders.deletedAt)
        )
      )
      .limit(1);
    if (!existing) throw notFound('Folder not found');
    const [row] = await db
      .update(folders)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        updatedAt: new Date(),
      })
      .where(eq(folders.id, existing.id))
      .returning();
    res.json({ folder: row });
  } catch (e) {
    next(e);
  }
});

foldersRouter.delete('/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const [existing] = await db
      .select()
      .from(folders)
      .where(
        and(
          eq(folders.id, paramId(req)),
          eq(folders.userId, req.user!.id),
          isNull(folders.deletedAt)
        )
      )
      .limit(1);
    if (!existing) throw notFound('Folder not found');
    await db
      .update(folders)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(folders.id, existing.id));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

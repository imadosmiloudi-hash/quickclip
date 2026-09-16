import { Router } from 'express';
import { and, eq, isNull, desc, ilike, or, SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../db/client.js';
import { contentItems, folders } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { notFound, badRequest } from '../utils/errors.js';
import { paramId } from '../utils/params.js';
import { newId } from '../utils/id.js';

const TYPES = ['text', 'voice', 'video', 'image'] as const;

const createSchema = z.object({
  type: z.enum(TYPES),
  title: z.string().min(1).max(512),
  textContent: z.string().optional().nullable(),
  folderId: z.string().uuid().optional().nullable(),
  mimeType: z.string().max(128).optional().nullable(),
  fileReference: z.string().optional().nullable(),
  thumbnailReference: z.string().optional().nullable(),
  durationMs: z.number().int().optional().nullable(),
  sizeBytes: z.number().int().optional().nullable(),
  shortcut: z.string().max(64).optional().nullable(),
  favorite: z.boolean().optional(),
  isDemo: z.boolean().optional(),
});

const updateSchema = createSchema.partial().omit({ type: true }).extend({
  type: z.enum(TYPES).optional(),
  usageCount: z.number().int().optional(),
  lastUsedAt: z.string().datetime().optional().nullable(),
});

export const contentRouter = Router();
contentRouter.use(requireAuth);

async function assertFolderOwned(userId: string, folderId: string | null | undefined) {
  if (!folderId) return;
  const db = getDb();
  const [f] = await db
    .select()
    .from(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId), isNull(folders.deletedAt)))
    .limit(1);
  if (!f) throw badRequest('folderId does not belong to user');
}

contentRouter.get('/', async (req, res, next) => {
  try {
    const db = getDb();
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const folderId = typeof req.query.folderId === 'string' ? req.query.folderId : undefined;
    const favorite = req.query.favorite === 'true' ? true : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;

    const conditions: SQL[] = [
      eq(contentItems.userId, req.user!.id),
      isNull(contentItems.deletedAt),
    ];
    if (type) conditions.push(eq(contentItems.type, type));
    if (folderId) conditions.push(eq(contentItems.folderId, folderId));
    if (favorite) conditions.push(eq(contentItems.favorite, true));
    if (q) {
      const pattern = `%${q}%`;
      conditions.push(
        or(
          ilike(contentItems.title, pattern),
          ilike(contentItems.textContent, pattern),
          ilike(contentItems.shortcut, pattern)
        )!
      );
    }

    const rows = await db
      .select()
      .from(contentItems)
      .where(and(...conditions))
      .orderBy(desc(contentItems.updatedAt));
    res.json({ items: rows });
  } catch (e) {
    next(e);
  }
});

contentRouter.post('/', validateBody(createSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof createSchema>;
    await assertFolderOwned(req.user!.id, body.folderId);
    const db = getDb();
    const [row] = await db
      .insert(contentItems)
      .values({
        id: newId(),
        userId: req.user!.id,
        folderId: body.folderId ?? null,
        type: body.type,
        title: body.title,
        textContent: body.textContent ?? null,
        mimeType: body.mimeType ?? null,
        fileReference: body.fileReference ?? null,
        thumbnailReference: body.thumbnailReference ?? null,
        durationMs: body.durationMs ?? null,
        sizeBytes: body.sizeBytes ?? null,
        shortcut: body.shortcut ?? null,
        favorite: body.favorite ?? false,
        isDemo: body.isDemo ?? false,
      })
      .returning();
    res.status(201).json({ item: row });
  } catch (e) {
    next(e);
  }
});

contentRouter.get('/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(contentItems)
      .where(
        and(
          eq(contentItems.id, paramId(req)),
          eq(contentItems.userId, req.user!.id),
          isNull(contentItems.deletedAt)
        )
      )
      .limit(1);
    if (!row) throw notFound('Content not found');
    res.json({ item: row });
  } catch (e) {
    next(e);
  }
});

contentRouter.patch('/:id', validateBody(updateSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof updateSchema>;
    await assertFolderOwned(req.user!.id, body.folderId);
    const db = getDb();
    const [existing] = await db
      .select()
      .from(contentItems)
      .where(
        and(
          eq(contentItems.id, paramId(req)),
          eq(contentItems.userId, req.user!.id),
          isNull(contentItems.deletedAt)
        )
      )
      .limit(1);
    if (!existing) throw notFound('Content not found');

    const [row] = await db
      .update(contentItems)
      .set({
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.textContent !== undefined ? { textContent: body.textContent } : {}),
        ...(body.folderId !== undefined ? { folderId: body.folderId } : {}),
        ...(body.mimeType !== undefined ? { mimeType: body.mimeType } : {}),
        ...(body.fileReference !== undefined ? { fileReference: body.fileReference } : {}),
        ...(body.thumbnailReference !== undefined
          ? { thumbnailReference: body.thumbnailReference }
          : {}),
        ...(body.durationMs !== undefined ? { durationMs: body.durationMs } : {}),
        ...(body.sizeBytes !== undefined ? { sizeBytes: body.sizeBytes } : {}),
        ...(body.shortcut !== undefined ? { shortcut: body.shortcut } : {}),
        ...(body.favorite !== undefined ? { favorite: body.favorite } : {}),
        ...(body.usageCount !== undefined ? { usageCount: body.usageCount } : {}),
        ...(body.lastUsedAt !== undefined
          ? { lastUsedAt: body.lastUsedAt ? new Date(body.lastUsedAt) : null }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(contentItems.id, existing.id))
      .returning();
    res.json({ item: row });
  } catch (e) {
    next(e);
  }
});

contentRouter.post('/:id/use', async (req, res, next) => {
  try {
    const db = getDb();
    const [existing] = await db
      .select()
      .from(contentItems)
      .where(
        and(
          eq(contentItems.id, paramId(req)),
          eq(contentItems.userId, req.user!.id),
          isNull(contentItems.deletedAt)
        )
      )
      .limit(1);
    if (!existing) throw notFound('Content not found');
    const [row] = await db
      .update(contentItems)
      .set({
        usageCount: existing.usageCount + 1,
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contentItems.id, existing.id))
      .returning();
    res.json({ item: row });
  } catch (e) {
    next(e);
  }
});

contentRouter.delete('/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const [existing] = await db
      .select()
      .from(contentItems)
      .where(
        and(
          eq(contentItems.id, paramId(req)),
          eq(contentItems.userId, req.user!.id),
          isNull(contentItems.deletedAt)
        )
      )
      .limit(1);
    if (!existing) throw notFound('Content not found');
    await db
      .update(contentItems)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(contentItems.id, existing.id));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

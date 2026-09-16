import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import { mediaFiles, contentItems } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { getStorage } from '../storage/index.js';
import { config } from '../config.js';
import { badRequest, notFound } from '../utils/errors.js';
import { paramId } from '../utils/params.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes },
});

const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'audio/ogg',
  'audio/wav',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

export const mediaRouter = Router();
mediaRouter.use(requireAuth);

mediaRouter.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw badRequest('file is required (multipart field "file")');
    const mime = req.file.mimetype;
    if (!ALLOWED.has(mime)) {
      throw badRequest(`Unsupported MIME type: ${mime}`);
    }
    const contentItemId =
      typeof req.body.contentItemId === 'string' ? req.body.contentItemId : undefined;

    const db = getDb();
    if (contentItemId) {
      const [item] = await db
        .select()
        .from(contentItems)
        .where(
          and(
            eq(contentItems.id, contentItemId),
            eq(contentItems.userId, req.user!.id),
            isNull(contentItems.deletedAt)
          )
        )
        .limit(1);
      if (!item) throw badRequest('contentItemId not found for user');
    }

    const id = randomUUID();
    const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') ?? 'bin';
    const key = `${req.user!.id}/${id}.${ext}`;
    const storage = getStorage();
    await storage.put(key, req.file.buffer, mime);
    const checksum = createHash('sha256').update(req.file.buffer).digest('hex');

    const [row] = await db
      .insert(mediaFiles)
      .values({
        id,
        userId: req.user!.id,
        contentItemId: contentItemId ?? null,
        storageKey: key,
        originalName: req.file.originalname,
        mimeType: mime,
        sizeBytes: req.file.size,
        checksum,
      })
      .returning();

    if (contentItemId) {
      await db
        .update(contentItems)
        .set({
          fileReference: key,
          mimeType: mime,
          sizeBytes: req.file.size,
          updatedAt: new Date(),
        })
        .where(eq(contentItems.id, contentItemId));
    }

    res.status(201).json({
      media: row,
      downloadUrl: `/media/${row.id}/download`,
    });
  } catch (e) {
    next(e);
  }
});

mediaRouter.get('/:id/download', async (req, res, next) => {
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(mediaFiles)
      .where(
        and(
          eq(mediaFiles.id, paramId(req)),
          eq(mediaFiles.userId, req.user!.id),
          isNull(mediaFiles.deletedAt)
        )
      )
      .limit(1);
    if (!row) throw notFound('Media not found');
    const stored = await getStorage().get(row.storageKey);
    if (!stored) throw notFound('Media file missing from storage');
    res.setHeader('Content-Type', stored.mimeType);
    res.setHeader('Content-Length', String(stored.data.length));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${row.originalName ?? row.id}"`
    );
    res.send(stored.data);
  } catch (e) {
    next(e);
  }
});

mediaRouter.delete('/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(mediaFiles)
      .where(
        and(
          eq(mediaFiles.id, paramId(req)),
          eq(mediaFiles.userId, req.user!.id),
          isNull(mediaFiles.deletedAt)
        )
      )
      .limit(1);
    if (!row) throw notFound('Media not found');
    await getStorage().delete(row.storageKey);
    await db
      .update(mediaFiles)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(mediaFiles.id, row.id));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

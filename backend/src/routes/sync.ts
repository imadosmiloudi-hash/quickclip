import { newId } from '../utils/id.js';
import { Router } from 'express';
import { and, eq, gt, isNull, desc } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../db/client.js';
import {
  syncRecords,
  folders,
  contentItems,
  devices,
} from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { badRequest } from '../utils/errors.js';

const pushSchema = z.object({
  deviceId: z.string().uuid().optional(),
  changes: z
    .array(
      z.object({
        entityType: z.enum(['folder', 'content_item']),
        entityId: z.string().uuid(),
        operation: z.enum(['upsert', 'delete']),
        clientUpdatedAt: z.string().datetime().optional(),
        payload: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .max(500),
});

export const syncRouter = Router();
syncRouter.use(requireAuth);

syncRouter.get('/pull', async (req, res, next) => {
  try {
    const sinceRaw = typeof req.query.since === 'string' ? req.query.since : undefined;
    const since = sinceRaw ? new Date(sinceRaw) : new Date(0);
    if (Number.isNaN(since.getTime())) throw badRequest('Invalid since timestamp');

    const db = getDb();
    const userId = req.user!.id;

    const folderRows = await db
      .select()
      .from(folders)
      .where(and(eq(folders.userId, userId), gt(folders.updatedAt, since)));

    const contentRows = await db
      .select()
      .from(contentItems)
      .where(and(eq(contentItems.userId, userId), gt(contentItems.updatedAt, since)));

    const records = await db
      .select()
      .from(syncRecords)
      .where(and(eq(syncRecords.userId, userId), gt(syncRecords.serverUpdatedAt, since)))
      .orderBy(desc(syncRecords.serverUpdatedAt))
      .limit(1000);

    res.json({
      serverTime: new Date().toISOString(),
      folders: folderRows,
      contentItems: contentRows,
      syncRecords: records,
    });
  } catch (e) {
    next(e);
  }
});

syncRouter.post('/push', validateBody(pushSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof pushSchema>;
    const db = getDb();
    const userId = req.user!.id;
    let deviceId = body.deviceId ?? null;

    if (deviceId) {
      const [dev] = await db
        .select()
        .from(devices)
        .where(and(eq(devices.id, deviceId), eq(devices.userId, userId), isNull(devices.deletedAt)))
        .limit(1);
      if (!dev) {
        const [created] = await db
          .insert(devices)
          .values({ id: deviceId, userId, deviceName: 'android', platform: 'android' })
          .returning();
        deviceId = created.id;
      } else {
        await db
          .update(devices)
          .set({ lastSeenAt: new Date(), updatedAt: new Date() })
          .where(eq(devices.id, deviceId));
      }
    }

    const applied: string[] = [];

    for (const change of body.changes) {
      const clientUpdatedAt = change.clientUpdatedAt
        ? new Date(change.clientUpdatedAt)
        : new Date();

      if (change.entityType === 'folder') {
        if (change.operation === 'delete') {
          await db
            .update(folders)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where(and(eq(folders.id, change.entityId), eq(folders.userId, userId)));
        } else if (change.payload) {
          const name = String(change.payload.name ?? 'Untitled');
          const sortOrder = Number(change.payload.sortOrder ?? 0);
          const existing = await db
            .select()
            .from(folders)
            .where(and(eq(folders.id, change.entityId), eq(folders.userId, userId)))
            .limit(1);
          if (existing.length) {
            // Last-write-wins by clientUpdatedAt vs server updatedAt
            if (existing[0].updatedAt <= clientUpdatedAt) {
              await db
                .update(folders)
                .set({ name, sortOrder, updatedAt: clientUpdatedAt, deletedAt: null })
                .where(eq(folders.id, change.entityId));
            }
          } else {
            await db.insert(folders).values({
              id: change.entityId,
              userId,
              name,
              sortOrder,
              updatedAt: clientUpdatedAt,
            });
          }
        }
      }

      if (change.entityType === 'content_item') {
        if (change.operation === 'delete') {
          await db
            .update(contentItems)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where(and(eq(contentItems.id, change.entityId), eq(contentItems.userId, userId)));
        } else if (change.payload) {
          const p = change.payload;
          const existing = await db
            .select()
            .from(contentItems)
            .where(and(eq(contentItems.id, change.entityId), eq(contentItems.userId, userId)))
            .limit(1);
          const values = {
            type: String(p.type ?? 'text'),
            title: String(p.title ?? 'Untitled'),
            textContent: p.textContent != null ? String(p.textContent) : null,
            folderId: p.folderId ? String(p.folderId) : null,
            mimeType: p.mimeType != null ? String(p.mimeType) : null,
            fileReference: p.fileReference != null ? String(p.fileReference) : null,
            shortcut: p.shortcut != null ? String(p.shortcut) : null,
            favorite: p.favorite === true || p.favorite === "true",
            usageCount: Number(p.usageCount ?? 0),
            updatedAt: clientUpdatedAt,
            deletedAt: null as Date | null,
          };
          if (existing.length) {
            if (existing[0].updatedAt <= clientUpdatedAt) {
              await db.update(contentItems).set(values).where(eq(contentItems.id, change.entityId));
            }
          } else {
            await db.insert(contentItems).values({
              id: change.entityId,
              userId,
              ...values,
            });
          }
        }
      }

      await db.insert(syncRecords).values({
        id: newId(),
        userId,
        deviceId,
        entityType: change.entityType,
        entityId: change.entityId,
        operation: change.operation,
        payload: change.payload ? JSON.stringify(change.payload) : null,
        clientUpdatedAt,
      });
      applied.push(change.entityId);
    }

    res.json({ applied: applied.length, ids: applied, serverTime: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

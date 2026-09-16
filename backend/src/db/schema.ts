import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  bigint,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    displayName: varchar('display_name', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('users_email_idx').on(t.email)]
);

export const folders = pgTable(
  'folders',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('folders_user_id_idx').on(t.userId),
    index('folders_created_at_idx').on(t.createdAt),
    index('folders_updated_at_idx').on(t.updatedAt),
  ]
);

export const contentItems = pgTable(
  'content_items',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
    type: varchar('type', { length: 32 }).notNull(), // text | voice | video | image
    title: varchar('title', { length: 512 }).notNull(),
    textContent: text('text_content'),
    mimeType: varchar('mime_type', { length: 128 }),
    fileReference: text('file_reference'),
    thumbnailReference: text('thumbnail_reference'),
    durationMs: integer('duration_ms'),
    sizeBytes: bigint('size_bytes', { mode: 'number' }),
    shortcut: varchar('shortcut', { length: 64 }),
    favorite: boolean('favorite').notNull().default(false),
    usageCount: integer('usage_count').notNull().default(0),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('content_user_id_idx').on(t.userId),
    index('content_folder_id_idx').on(t.folderId),
    index('content_type_idx').on(t.type),
    index('content_favorite_idx').on(t.favorite),
    index('content_created_at_idx').on(t.createdAt),
    index('content_updated_at_idx').on(t.updatedAt),
    index('content_shortcut_idx').on(t.shortcut),
  ]
);

export const mediaFiles = pgTable(
  'media_files',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    contentItemId: uuid('content_item_id').references(() => contentItems.id, {
      onDelete: 'set null',
    }),
    storageKey: text('storage_key').notNull(),
    originalName: varchar('original_name', { length: 512 }),
    mimeType: varchar('mime_type', { length: 128 }).notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    checksum: varchar('checksum', { length: 128 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('media_user_id_idx').on(t.userId),
    index('media_content_item_id_idx').on(t.contentItemId),
  ]
);

export const devices = pgTable(
  'devices',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    deviceName: varchar('device_name', { length: 255 }),
    platform: varchar('platform', { length: 64 }).notNull().default('android'),
    pushToken: text('push_token'),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('devices_user_id_idx').on(t.userId)]
);

export const syncRecords = pgTable(
  'sync_records',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    deviceId: uuid('device_id').references(() => devices.id, { onDelete: 'set null' }),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    operation: varchar('operation', { length: 32 }).notNull(), // upsert | delete
    payload: text('payload'),
    clientUpdatedAt: timestamp('client_updated_at', { withTimezone: true }),
    serverUpdatedAt: timestamp('server_updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('sync_user_id_idx').on(t.userId),
    index('sync_entity_idx').on(t.entityType, t.entityId),
    index('sync_server_updated_at_idx').on(t.serverUpdatedAt),
  ]
);

export type User = typeof users.$inferSelect;
export type Folder = typeof folders.$inferSelect;
export type ContentItem = typeof contentItems.$inferSelect;
export type MediaFile = typeof mediaFiles.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type SyncRecord = typeof syncRecords.$inferSelect;

import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { PGlite } from '@electric-sql/pglite';
import * as schema from './schema.js';
import { config } from '../config.js';

export type AppDb =
  | PostgresJsDatabase<typeof schema>
  | PgliteDatabase<typeof schema>;

let dbInstance: AppDb | null = null;
let pgClient: ReturnType<typeof postgres> | null = null;
let pglite: PGlite | null = null;

const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email);

CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS folders_user_id_idx ON folders(user_id);
CREATE INDEX IF NOT EXISTS folders_created_at_idx ON folders(created_at);
CREATE INDEX IF NOT EXISTS folders_updated_at_idx ON folders(updated_at);

CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  type VARCHAR(32) NOT NULL,
  title VARCHAR(512) NOT NULL,
  text_content TEXT,
  mime_type VARCHAR(128),
  file_reference TEXT,
  thumbnail_reference TEXT,
  duration_ms INTEGER,
  size_bytes BIGINT,
  shortcut VARCHAR(64),
  favorite BOOLEAN NOT NULL DEFAULT FALSE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS content_user_id_idx ON content_items(user_id);
CREATE INDEX IF NOT EXISTS content_folder_id_idx ON content_items(folder_id);
CREATE INDEX IF NOT EXISTS content_type_idx ON content_items(type);
CREATE INDEX IF NOT EXISTS content_favorite_idx ON content_items(favorite);
CREATE INDEX IF NOT EXISTS content_created_at_idx ON content_items(created_at);
CREATE INDEX IF NOT EXISTS content_updated_at_idx ON content_items(updated_at);
CREATE INDEX IF NOT EXISTS content_shortcut_idx ON content_items(shortcut);

CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_item_id UUID REFERENCES content_items(id) ON DELETE SET NULL,
  storage_key TEXT NOT NULL,
  original_name VARCHAR(512),
  mime_type VARCHAR(128) NOT NULL,
  size_bytes BIGINT NOT NULL,
  checksum VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS media_user_id_idx ON media_files(user_id);
CREATE INDEX IF NOT EXISTS media_content_item_id_idx ON media_files(content_item_id);

CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name VARCHAR(255),
  platform VARCHAR(64) NOT NULL DEFAULT 'android',
  push_token TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS devices_user_id_idx ON devices(user_id);

CREATE TABLE IF NOT EXISTS sync_records (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id UUID NOT NULL,
  operation VARCHAR(32) NOT NULL,
  payload TEXT,
  client_updated_at TIMESTAMPTZ,
  server_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS sync_user_id_idx ON sync_records(user_id);
CREATE INDEX IF NOT EXISTS sync_entity_idx ON sync_records(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS sync_server_updated_at_idx ON sync_records(server_updated_at);
`;

export async function migrate(db: AppDb): Promise<void> {
  // Prefer executing via underlying client
  if (pglite) {
    await pglite.exec(DDL);
    return;
  }
  if (pgClient) {
    await pgClient.unsafe(DDL);
    return;
  }
  // Fallback: try drizzle execute with raw sql pieces
  void db;
  throw new Error('No database client available for migrate()');
}

export async function initDb(options?: { forcePglite?: boolean }): Promise<AppDb> {
  if (dbInstance && !options?.forcePglite) return dbInstance;

  const usePglite =
    options?.forcePglite ||
    config.isTest ||
    !config.databaseUrl ||
    config.databaseUrl.startsWith('pglite:');

  if (usePglite) {
    pglite = new PGlite();
    await pglite.waitReady;
    dbInstance = drizzlePglite(pglite, { schema });
    await migrate(dbInstance);
    return dbInstance;
  }

  pgClient = postgres(config.databaseUrl, { max: 10 });
  dbInstance = drizzlePg(pgClient, { schema });
  await migrate(dbInstance);
  return dbInstance;
}

export function getDb(): AppDb {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return dbInstance;
}

export async function closeDb(): Promise<void> {
  if (pgClient) {
    await pgClient.end({ timeout: 5 });
    pgClient = null;
  }
  if (pglite) {
    await pglite.close();
    pglite = null;
  }
  dbInstance = null;
}

/** Test helper: reset to a fresh in-memory PGlite */
export async function resetTestDb(): Promise<AppDb> {
  await closeDb();
  return initDb({ forcePglite: true });
}

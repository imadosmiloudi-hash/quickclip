import { beforeAll, afterAll, beforeEach } from 'vitest';
import { resetTestDb, closeDb } from '../src/db/client.js';
import { setStorage } from '../src/storage/index.js';
import { LocalStorageDriver } from '../src/storage/local.js';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

const storageRoot = path.join(os.tmpdir(), `qc-test-storage-${process.pid}`);

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-not-for-production';
  await fs.mkdir(storageRoot, { recursive: true });
  setStorage(new LocalStorageDriver(storageRoot));
  await resetTestDb();
});

beforeEach(async () => {
  await resetTestDb();
  await fs.rm(storageRoot, { recursive: true, force: true });
  await fs.mkdir(storageRoot, { recursive: true });
  setStorage(new LocalStorageDriver(storageRoot));
});

afterAll(async () => {
  await closeDb();
  await fs.rm(storageRoot, { recursive: true, force: true });
});

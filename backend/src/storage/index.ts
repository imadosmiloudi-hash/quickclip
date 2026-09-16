import path from 'node:path';
import os from 'node:os';
import { config } from '../config.js';
import { LocalStorageDriver } from './local.js';
import { S3StorageDriver } from './s3.js';
import type { StorageDriver } from './types.js';

let storage: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (storage) return storage;
  if (config.storageDriver === 's3') {
    storage = new S3StorageDriver(
      config.storageEndpoint,
      config.storageBucket,
      config.storageAccessKey,
      config.storageSecretKey,
      config.storageRegion
    );
  } else {
    const root = config.isTest
      ? path.join(os.tmpdir(), `quickclip-storage-${process.pid}`)
      : config.storagePath;
    storage = new LocalStorageDriver(root);
  }
  return storage;
}

export function setStorage(driver: StorageDriver): void {
  storage = driver;
}

export type { StorageDriver, StoredObject } from './types.js';

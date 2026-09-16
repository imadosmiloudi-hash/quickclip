import fs from 'node:fs/promises';
import path from 'node:path';
import type { StorageDriver, StoredObject } from './types.js';

export class LocalStorageDriver implements StorageDriver {
  constructor(private readonly root: string) {}

  private resolve(key: string): string {
    const safe = key.replace(/\.\./g, '').replace(/^\/+/, '');
    return path.join(this.root, safe);
  }

  async put(key: string, data: Buffer, mimeType: string): Promise<StoredObject> {
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
    await fs.writeFile(`${full}.meta.json`, JSON.stringify({ mimeType, size: data.length }));
    return { key, size: data.length, mimeType };
  }

  async get(key: string): Promise<{ data: Buffer; mimeType: string } | null> {
    const full = this.resolve(key);
    try {
      const data = await fs.readFile(full);
      let mimeType = 'application/octet-stream';
      try {
        const meta = JSON.parse(await fs.readFile(`${full}.meta.json`, 'utf8')) as {
          mimeType?: string;
        };
        mimeType = meta.mimeType ?? mimeType;
      } catch {
        /* ignore */
      }
      return { data, mimeType };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const full = this.resolve(key);
    await fs.unlink(full).catch(() => undefined);
    await fs.unlink(`${full}.meta.json`).catch(() => undefined);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }
}

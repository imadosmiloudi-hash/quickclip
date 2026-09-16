/**
 * S3-compatible storage interface stub.
 * Local driver is used by default. Wire AWS SDK / MinIO when STORAGE_DRIVER=s3.
 */
import type { StorageDriver, StoredObject } from './types.js';

export class S3StorageDriver implements StorageDriver {
  constructor(
    private readonly endpoint: string,
    private readonly bucket: string,
    private readonly accessKey: string,
    private readonly secretKey: string,
    private readonly region: string
  ) {
    void this.endpoint;
    void this.bucket;
    void this.accessKey;
    void this.secretKey;
    void this.region;
  }

  async put(_key: string, _data: Buffer, _mimeType: string): Promise<StoredObject> {
    throw new Error(
      'S3 storage driver not configured. Set STORAGE_DRIVER=local or implement S3 client.'
    );
  }

  async get(_key: string): Promise<{ data: Buffer; mimeType: string } | null> {
    throw new Error('S3 storage driver not configured.');
  }

  async delete(_key: string): Promise<void> {
    throw new Error('S3 storage driver not configured.');
  }

  async exists(_key: string): Promise<boolean> {
    throw new Error('S3 storage driver not configured.');
  }
}

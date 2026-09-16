import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetTestDb } from '../src/db/client.js';

describe('GET /health', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    await resetTestDb();
  });

  it('returns ok', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('quickclip-backend');
  });
});

describe('GET /', () => {
  it('returns API info JSON', async () => {
    const app = createApp();
    const res = await request(app).get('/').set('Accept', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('QUICKCLIP API');
    expect(res.body.health).toBe('/health');
  });
});

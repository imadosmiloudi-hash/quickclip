import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetTestDb } from '../src/db/client.js';

describe('Auth', () => {
  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    await resetTestDb();
  });

  it('registers a user and returns JWT', async () => {
    const app = createApp();
    const res = await request(app).post('/auth/register').send({
      email: 'alice@example.com',
      password: 'password123',
      displayName: 'Alice',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('alice@example.com');
  });

  it('rejects duplicate email', async () => {
    const app = createApp();
    await request(app).post('/auth/register').send({
      email: 'bob@example.com',
      password: 'password123',
    });
    const res = await request(app).post('/auth/register').send({
      email: 'bob@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(409);
  });

  it('logs in with correct password', async () => {
    const app = createApp();
    await request(app).post('/auth/register').send({
      email: 'carol@example.com',
      password: 'password123',
    });
    const res = await request(app).post('/auth/login').send({
      email: 'carol@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects bad password', async () => {
    const app = createApp();
    await request(app).post('/auth/register').send({
      email: 'dave@example.com',
      password: 'password123',
    });
    const res = await request(app).post('/auth/login').send({
      email: 'dave@example.com',
      password: 'wrong-password',
    });
    expect(res.status).toBe(401);
  });

  it('seeds default folders on register', async () => {
    const app = createApp();
    const reg = await request(app).post('/auth/register').send({
      email: 'erin@example.com',
      password: 'password123',
    });
    const folders = await request(app)
      .get('/folders')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(folders.status).toBe(200);
    expect(folders.body.folders.length).toBeGreaterThanOrEqual(9);
    const names = folders.body.folders.map((f: { name: string }) => f.name);
    expect(names).toContain('Welcome');
    expect(names).toContain('Customer Support');
  });
});

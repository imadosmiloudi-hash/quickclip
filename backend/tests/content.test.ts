import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetTestDb } from '../src/db/client.js';

async function token(app: ReturnType<typeof createApp>, email: string) {
  const res = await request(app).post('/auth/register').send({
    email,
    password: 'password123',
  });
  return res.body.token as string;
}

describe('Content + media', () => {
  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    await resetTestDb();
  });

  it('creates, lists, updates, uses, and soft-deletes text', async () => {
    const app = createApp();
    const t = await token(app, 'writer@example.com');
    const created = await request(app)
      .post('/content')
      .set('Authorization', `Bearer ${t}`)
      .send({ type: 'text', title: 'Hello', textContent: 'مرحبا', shortcut: '/hi' });
    expect(created.status).toBe(201);
    const id = created.body.item.id;

    const listed = await request(app).get('/content?q=مرحبا').set('Authorization', `Bearer ${t}`);
    expect(listed.body.items.some((i: { id: string }) => i.id === id)).toBe(true);

    const used = await request(app).post(`/content/${id}/use`).set('Authorization', `Bearer ${t}`);
    expect(used.body.item.usageCount).toBe(1);

    const patched = await request(app)
      .patch(`/content/${id}`)
      .set('Authorization', `Bearer ${t}`)
      .send({ favorite: true });
    expect(patched.body.item.favorite).toBe(true);

    const del = await request(app).delete(`/content/${id}`).set('Authorization', `Bearer ${t}`);
    expect(del.status).toBe(204);
    const gone = await request(app).get(`/content/${id}`).set('Authorization', `Bearer ${t}`);
    expect(gone.status).toBe(404);
  });

  it('uploads and downloads media isolated per user', async () => {
    const app = createApp();
    const a = await token(app, 'media-a@example.com');
    const b = await token(app, 'media-b@example.com');
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    const up = await request(app)
      .post('/media/upload')
      .set('Authorization', `Bearer ${a}`)
      .attach('file', png, { filename: 'dot.png', contentType: 'image/png' });
    expect(up.status).toBe(201);
    const id = up.body.media.id;

    const dlA = await request(app)
      .get(`/media/${id}/download`)
      .set('Authorization', `Bearer ${a}`);
    expect(dlA.status).toBe(200);
    expect(dlA.headers['content-type']).toMatch(/image\/png/);

    const dlB = await request(app)
      .get(`/media/${id}/download`)
      .set('Authorization', `Bearer ${b}`);
    expect(dlB.status).toBe(404);
  });
});

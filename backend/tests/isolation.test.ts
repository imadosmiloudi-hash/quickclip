import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetTestDb } from '../src/db/client.js';

async function register(app: ReturnType<typeof createApp>, email: string) {
  const res = await request(app).post('/auth/register').send({
    email,
    password: 'password123',
  });
  expect(res.status).toBe(201);
  return res.body.token as string;
}

describe('Authorization isolation', () => {
  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    await resetTestDb();
  });

  it('user A cannot read user B folders or content', async () => {
    const app = createApp();
    const tokenA = await register(app, 'a@example.com');
    const tokenB = await register(app, 'b@example.com');

    const createFolder = await request(app)
      .post('/folders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Secret A' });
    expect(createFolder.status).toBe(201);
    const folderId = createFolder.body.folder.id;

    const createContent = await request(app)
      .post('/content')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'text',
        title: 'Private note',
        textContent: 'classified',
        folderId,
      });
    expect(createContent.status).toBe(201);
    const contentId = createContent.body.item.id;

    const bFolders = await request(app)
      .get('/folders')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(bFolders.body.folders.find((f: { id: string }) => f.id === folderId)).toBeUndefined();

    const bGetFolder = await request(app)
      .get(`/folders/${folderId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(bGetFolder.status).toBe(404);

    const bGetContent = await request(app)
      .get(`/content/${contentId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(bGetContent.status).toBe(404);

    const bList = await request(app)
      .get('/content')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(bList.body.items.find((i: { id: string }) => i.id === contentId)).toBeUndefined();

    const bDelete = await request(app)
      .delete(`/content/${contentId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(bDelete.status).toBe(404);

    // Owner still has it
    const aGet = await request(app)
      .get(`/content/${contentId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(aGet.status).toBe(200);
    expect(aGet.body.item.title).toBe('Private note');
  });

  it('rejects unauthenticated content access', async () => {
    const app = createApp();
    const res = await request(app).get('/content');
    expect(res.status).toBe(401);
  });
});

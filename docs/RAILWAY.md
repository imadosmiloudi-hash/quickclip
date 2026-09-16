# Railway deploy

Backend lives in `/backend` (Node 20 + TypeScript + Express + Drizzle + Postgres).

## 1. Create a Railway project

1. New project → **Empty**.
2. Add **PostgreSQL** plugin. Copy `DATABASE_URL`.
3. Add a **service** from this GitHub repo.
   - Root directory: `backend` **or** use the repo-root `Dockerfile` (it copies backend layout — prefer setting Root Directory to `backend`).
4. Set environment variables (see `.env.example`):

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<long random string>
NODE_ENV=production
APP_BASE_URL=https://<your-service>.up.railway.app
STORAGE_DRIVER=local
STORAGE_PATH=/app/storage
PORT=3000
```

Optional later (S3-compatible):

```
STORAGE_DRIVER=s3
STORAGE_ENDPOINT=
STORAGE_BUCKET=quickclip
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_REGION=auto
```

5. `railway.json` uses the Dockerfile builder and health-checks `GET /health`.
6. Generate a public domain. Confirm `GET https://<domain>/health` returns `{ "status": "ok" }`.

## 2. Migrations

`src/db/client.ts` applies DDL on boot (`CREATE TABLE IF NOT EXISTS` + indexes). SQL is also in `backend/drizzle/0000_init.sql`.

For a one-shot: `npm run migrate`.

## 3. Local without Postgres

Tests and `npm run dev` with **no** `DATABASE_URL` use **PGlite** (in-memory Postgres). CI needs no Docker.

```
cd backend
cp .env.example .env   # JWT_SECRET required in production only
npm install
npm run build
npm test
npm run dev
```

## 4. Android client

Settings → Account: register/login against `APP_BASE_URL`.
Default Retrofit base URL is `https://quickclip.up.railway.app/` — change in `di/AppModule.kt` after you have a real domain.

Local keyboard **does not** require login. Sync is optional.

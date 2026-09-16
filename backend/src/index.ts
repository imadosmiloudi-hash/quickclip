import { assertProdSecrets, config } from './config.js';
import { initDb, closeDb } from './db/client.js';
import { createApp } from './app.js';

async function main() {
  assertProdSecrets();
  await initDb();
  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`QUICKCLIP backend listening on :${config.port}`);
  });

  const shutdown = async () => {
    server.close();
    await closeDb();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

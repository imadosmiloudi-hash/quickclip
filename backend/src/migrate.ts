import { initDb, closeDb } from './db/client.js';

async function main() {
  await initDb();
  console.log('Migrations applied.');
  await closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

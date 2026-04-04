import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const srcDir = path.dirname(fileURLToPath(import.meta.url));
const backendEnv = path.resolve(path.join(srcDir, '..', '.env'));
const repoEnv = path.resolve(path.join(srcDir, '..', '..', '.env'));

// Repo-level .env first (optional), then backend/.env with override so backend wins on conflicts
if (fs.existsSync(repoEnv)) {
  dotenv.config({ path: repoEnv });
  console.log(`[PulseShield] Loaded repo .env: ${repoEnv}`);
}

if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv, override: true });
  console.log(`[PulseShield] Loaded backend/.env: ${backendEnv}`);
} else if (!fs.existsSync(repoEnv)) {
  console.warn(
    `[PulseShield] No .env file found.\n` +
      `  Create: ${backendEnv}\n` +
      `  Copy backend/.env.example to backend/.env and set MYSQL_PASSWORD.`
  );
}

if (process.env.MYSQL_PASSWORD === undefined) {
  console.warn(
    '[PulseShield] MYSQL_PASSWORD is not set — MySQL often rejects root with "using password: NO". Add MYSQL_PASSWORD=... to backend/.env.'
  );
}

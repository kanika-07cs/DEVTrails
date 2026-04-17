import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import pool from './config/database.js';

import authRoutes from './routes/auth.js';
import earningsRoutes from './routes/earnings.js';
import predictRoutes from './routes/predict.js';
import claimsRoutes from './routes/claims.js';
import lossRoutes from './routes/loss.js';
import disruptionRoutes from './routes/disruption.js';
import insightsRoutes from './routes/insights.js';
import featureRoutes from './routes/features.js';
import adminRoutes from './routes/admin.js';
import { bootstrapSchema } from './config/bootstrap.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://dev-trails-ivory.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'pulseshield-api' });
});

app.use('/auth', authRoutes);
app.use('/earnings', earningsRoutes);
app.use('/', predictRoutes);
app.use('/', claimsRoutes);
app.use('/', lossRoutes);
app.use('/', disruptionRoutes);
app.use('/', insightsRoutes);
app.use('/', featureRoutes);
app.use('/', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  try {
    await pool.query('SELECT 1');
    await bootstrapSchema();
    console.log('[PulseShield] MySQL connection established');

    app.listen(PORT, () => {
      console.log(`PulseShield API listening on http://127.0.0.1:${PORT}`);
    });
  } catch (err) {
    console.error('[PulseShield] Failed to connect to MySQL.');
    console.error(
      '[PulseShield] Check backend/.env (MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE) and run sql/schema.sql.'
    );
    console.error(err.message || err);
    process.exit(1);
  }
}

startServer();

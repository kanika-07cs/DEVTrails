import './loadEnv.js';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import earningsRoutes from './routes/earnings.js';
import predictRoutes from './routes/predict.js';
import claimsRoutes from './routes/claims.js';
import lossRoutes from './routes/loss.js';
import disruptionRoutes from './routes/disruption.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

const cors = require("cors");

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

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`PulseShield API listening on http://127.0.0.1:${PORT}`);
});

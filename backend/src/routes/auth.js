import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { authMiddleware, signToken } from '../middleware/auth.js';
import { sendDbError, isMysqlError } from '../utils/dbErrors.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      location,
      platform,
      working_hours,
      avg_daily_earnings,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, location, platform, working_hours, avg_daily_earnings)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        password_hash,
        location ?? '',
        platform ?? '',
        working_hours ?? '',
        avg_daily_earnings != null ? Number(avg_daily_earnings) : 0,
      ]
    );

    const userId = result.insertId;
    const token = signToken({ id: userId, email });
    res.status(201).json({
      token,
      user: {
        id: userId,
        name,
        email,
        location: location ?? '',
        platform: platform ?? '',
        working_hours: working_hours ?? '',
        avg_daily_earnings: avg_daily_earnings != null ? Number(avg_daily_earnings) : 0,
      },
    });
  } catch (e) {
    if (isMysqlError(e)) return sendDbError(res, e, 'Registration failed');
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    const [rows] = await pool.query(
      `SELECT id, name, email, password_hash, location, platform, working_hours, avg_daily_earnings
       FROM users WHERE email = ?`,
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, email: user.email });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        location: user.location,
        platform: user.platform,
        working_hours: user.working_hours,
        avg_daily_earnings: Number(user.avg_daily_earnings),
      },
    });
  } catch (e) {
    if (isMysqlError(e)) return sendDbError(res, e, 'Login failed');
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, location, platform, working_hours, avg_daily_earnings, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const u = rows[0];
    res.json({
      id: u.id,
      name: u.name,
      email: u.email,
      location: u.location,
      platform: u.platform,
      working_hours: u.working_hours,
      avg_daily_earnings: Number(u.avg_daily_earnings),
      created_at: u.created_at,
    });
  } catch (e) {
    if (isMysqlError(e)) return sendDbError(res, e, 'Failed to load profile');
    console.error(e);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, location, platform, working_hours, avg_daily_earnings } = req.body;
    const fields = [];
    const vals = [];
    if (name != null) {
      fields.push('name = ?');
      vals.push(name);
    }
    if (location != null) {
      fields.push('location = ?');
      vals.push(location);
    }
    if (platform != null) {
      fields.push('platform = ?');
      vals.push(platform);
    }
    if (working_hours != null) {
      fields.push('working_hours = ?');
      vals.push(working_hours);
    }
    if (avg_daily_earnings != null) {
      fields.push('avg_daily_earnings = ?');
      vals.push(Number(avg_daily_earnings));
    }
    if (!fields.length) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    vals.push(req.user.id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, vals);
    const [rows] = await pool.query(
      `SELECT id, name, email, location, platform, working_hours, avg_daily_earnings FROM users WHERE id = ?`,
      [req.user.id]
    );
    const u = rows[0];
    res.json({
      id: u.id,
      name: u.name,
      email: u.email,
      location: u.location,
      platform: u.platform,
      working_hours: u.working_hours,
      avg_daily_earnings: Number(u.avg_daily_earnings),
    });
  } catch (e) {
    if (isMysqlError(e)) return sendDbError(res, e, 'Profile update failed');
    console.error(e);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

export default router;

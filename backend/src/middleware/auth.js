import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function signToken(user) {
  return jwt.sign(
    { email: user.email },
    process.env.JWT_SECRET,
    {
      subject: String(user.id),
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
}

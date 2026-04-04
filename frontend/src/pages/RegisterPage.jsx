import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    location: '',
    platform: 'Swiggy',
    working_hours: '8h / day',
    avg_daily_earnings: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        location: form.location,
        platform: form.platform,
        working_hours: form.working_hours,
        avg_daily_earnings: form.avg_daily_earnings ? Number(form.avg_daily_earnings) : 0,
      });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <div className="auth-brand">
          <span className="brand-mark lg" aria-hidden />
          <div>
            <h1>Join PulseShield</h1>
            <p>Onboard once — we model your income and watch for disruption-driven loss.</p>
          </div>
        </div>
        <form className="form grid-2" onSubmit={onSubmit}>
          <label className="field">
            <span>Full name</span>
            <input value={form.name} onChange={(e) => setField('name', e.target.value)} required />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              required
              minLength={8}
            />
          </label>
          <label className="field">
            <span>Location</span>
            <input
              value={form.location}
              onChange={(e) => setField('location', e.target.value)}
              placeholder="City / zone"
              required
            />
          </label>
          <label className="field">
            <span>Platform</span>
            <select value={form.platform} onChange={(e) => setField('platform', e.target.value)}>
              <option>Swiggy</option>
              <option>Zomato</option>
              <option>Zepto</option>
              <option>Instamart</option>
              <option>Other</option>
            </select>
          </label>
          <label className="field">
            <span>Working hours</span>
            <input
              value={form.working_hours}
              onChange={(e) => setField('working_hours', e.target.value)}
              placeholder="e.g. 10am–6pm"
            />
          </label>
          <label className="field span-2">
            <span>Average daily earnings</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.avg_daily_earnings}
              onChange={(e) => setField('avg_daily_earnings', e.target.value)}
              placeholder="Typical day before tax / tips"
            />
          </label>
          {error ? <div className="alert alert-error span-2">{error}</div> : null}
          <button className="btn btn-primary btn-block span-2" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="auth-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

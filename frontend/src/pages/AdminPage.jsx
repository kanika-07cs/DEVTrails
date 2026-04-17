import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiFetch } from '../services/api.js';

export function AdminPage() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [claims, setClaims] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    const [a, u, c, f] = await Promise.all([
      apiFetch('/api/admin/analytics', { token }),
      apiFetch('/api/admin/users', { token }),
      apiFetch('/api/admin/claims', { token }),
      apiFetch('/api/fraud/alerts', { token }),
    ]);
    setAnalytics(a);
    setUsers(u);
    setClaims(c);
    setAlerts(f.alerts || []);
  }, [token]);

  useEffect(() => {
    load().catch((e) => setMsg({ type: 'err', text: e.message }));
  }, [load]);

  async function setClaimStatus(id, action) {
    try {
      await apiFetch(`/api/admin/claims/${id}/${action}`, { token, method: 'POST' });
      setMsg({ type: 'ok', text: `Claim #${id} ${action}d.` });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="muted">Review claims, payout performance, and fraud ring alerts.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => load()}>
          Refresh
        </button>
      </header>
      {msg ? <div className={msg.type === 'err' ? 'alert alert-error' : 'alert alert-success'}>{msg.text}</div> : null}

      <section className="grid cards-3 mb-lg">
        <article className="card stat"><h3>Total users</h3><p className="stat-value mono">{analytics?.total_users ?? '—'}</p></article>
        <article className="card stat"><h3>Total claims</h3><p className="stat-value mono">{analytics?.total_claims ?? '—'}</p></article>
        <article className="card stat"><h3>Total payouts</h3><p className="stat-value mono">{analytics?.total_payouts?.toFixed?.(2) ?? '—'}</p></article>
      </section>

      <section className="card mb-lg table-card">
        <h2>Fraud Ring Alerts</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Area</th><th>Hour</th><th>Claims</th><th>Severity</th><th>Users</th></tr></thead>
            <tbody>
              {alerts.length === 0 ? <tr><td colSpan={5} className="center muted">No suspicious clusters found.</td></tr> : alerts.map((a) => (
                <tr key={a.cluster_key}>
                  <td className="mono">{a.area?.lat != null ? `${a.area.lat}, ${a.area.lng}` : 'N/A'}</td>
                  <td className="mono">{a.time_window_hour}</td>
                  <td>{a.claim_count}</td>
                  <td><span className={`risk-pill ${a.severity}`}>{a.severity}</span></td>
                  <td className="small">{a.users.map((u) => `${u.name} (#${u.user_id})`).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card mb-lg table-card">
        <h2>Claims Moderation</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>ID</th><th>User</th><th>Loss</th><th>Status</th><th>Risk</th><th>Actions</th></tr></thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.id}>
                  <td className="mono">#{c.id}</td>
                  <td>{c.name}<div className="muted small">{c.email}</div></td>
                  <td className="mono">{Number(c.loss_amount).toFixed(2)}</td>
                  <td><span className={`status-pill ${c.status}`}>{c.status}</span></td>
                  <td><span className={`risk-pill ${c.risk_score}`}>{c.risk_score}</span></td>
                  <td className="actions">
                    {c.status === 'pending' ? (
                      <>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => setClaimStatus(c.id, 'approve')}>Approve</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setClaimStatus(c.id, 'reject')}>Reject</button>
                      </>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card table-card">
        <h2>Users</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Platform</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="mono">#{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={`status-pill ${u.role === 'admin' ? 'approved' : 'pending'}`}>{u.role}</span></td>
                  <td>{u.platform || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

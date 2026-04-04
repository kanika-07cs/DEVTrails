import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiFetch } from '../services/api.js';

function todayISODate() {
  const d = new Date();
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export function ClaimsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [manual, setManual] = useState({
    claim_date: todayISODate(),
    loss_amount: '',
    predicted_income: '',
    actual_income: '',
  });

  const load = useCallback(async () => {
    const data = await apiFetch('/claims', { token });
    setRows(data);
  }, [token]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  async function simulatePayout(id) {
    setMsg(null);
    setLoading(true);
    try {
      const res = await apiFetch(`/claims/${id}/payout-simulate`, { token, method: 'POST' });
      setMsg({
        type: 'ok',
        text: `${res.payout.message} Ref: ${res.payout.upi_reference}`,
      });
      await load();
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function reject(id) {
    setMsg(null);
    setLoading(true);
    try {
      await apiFetch(`/claims/${id}/reject-simulate`, { token, method: 'POST' });
      setMsg({ type: 'ok', text: 'Claim marked rejected (simulated).' });
      await load();
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function createManual(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      await apiFetch('/claim/create', {
        token,
        method: 'POST',
        body: {
          claim_date: manual.claim_date,
          loss_amount: Number(manual.loss_amount),
          predicted_income: manual.predicted_income ? Number(manual.predicted_income) : undefined,
          actual_income: manual.actual_income ? Number(manual.actual_income) : undefined,
          mock_gps: {
            prev_lat: 12.97,
            prev_lng: 77.59,
            curr_lat: 13.4,
            curr_lng: 78.2,
          },
        },
      });
      setMsg({ type: 'ok', text: 'Manual claim created — review fraud risk below.' });
      await load();
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Claims</h1>
          <p className="muted">
            Auto-generated when loss exceeds threshold. Fraud engine assigns low / medium / high risk
            before payout simulation.
          </p>
        </div>
      </header>

      {msg ? (
        <div className={msg.type === 'err' ? 'alert alert-error' : 'alert alert-success'}>{msg.text}</div>
      ) : null}

      <section className="card mb-lg">
        <h2>Manual claim (demo)</h2>
        <p className="muted small">
          Use exaggerated GPS jump in the request to see fraud score increase (backend mock).
        </p>
        <form className="form grid-3" onSubmit={createManual}>
          <label className="field">
            <span>Date</span>
            <input
              type="date"
              value={manual.claim_date}
              onChange={(e) => setManual((m) => ({ ...m, claim_date: e.target.value }))}
              required
            />
          </label>
          <label className="field">
            <span>Loss amount</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={manual.loss_amount}
              onChange={(e) => setManual((m) => ({ ...m, loss_amount: e.target.value }))}
              required
            />
          </label>
          <label className="field">
            <span>Predicted (optional)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={manual.predicted_income}
              onChange={(e) => setManual((m) => ({ ...m, predicted_income: e.target.value }))}
            />
          </label>
          <label className="field span-3">
            <span>Actual (optional)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={manual.actual_income}
              onChange={(e) => setManual((m) => ({ ...m, actual_income: e.target.value }))}
            />
          </label>
          <button className="btn btn-secondary span-3" type="submit" disabled={loading}>
            Create claim
          </button>
        </form>
      </section>

      <section className="card table-card">
        <div className="table-head">
          <h2>Your claims</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => load()} disabled={loading}>
            Refresh
          </button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Loss</th>
                <th>Risk</th>
                <th>Status</th>
                <th>Payout ref</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted center">
                    No claims yet. Run loss detection from the dashboard.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">#{c.id}</td>
                    <td className="mono">{String(c.claim_date).slice(0, 10)}</td>
                    <td className="mono">{Number(c.loss_amount).toFixed(2)}</td>
                    <td>
                      <span className={`risk-pill ${c.risk_score}`}>{c.risk_score}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${c.status}`}>{c.status}</span>
                    </td>
                    <td className="mono small">{c.payout_reference || '—'}</td>
                    <td className="actions">
                      {c.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => simulatePayout(c.id)}
                            disabled={loading}
                          >
                            Simulate UPI payout
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => reject(c.id)}
                            disabled={loading}
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

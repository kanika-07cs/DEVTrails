import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiFetch } from '../services/api.js';

export function HistoryPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);

  const load = useCallback(async () => {
    const data = await apiFetch('/earnings/history?limit=180', { token });
    setRows(data);
  }, [token]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const chart = useMemo(() => {
    const sorted = [...rows].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const last = sorted.slice(-14);
    const maxVal = Math.max(
      1,
      ...last.flatMap((r) => [Number(r.actual_income), Number(r.predicted_income || 0)])
    );
    return { last, maxVal };
  }, [rows]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Earnings history</h1>
          <p className="muted">Daily actuals stored in MySQL with model predictions when available.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => load()}>
          Refresh
        </button>
      </header>

      <section className="card mb-lg">
        <h2>Last 14 days — actual vs predicted</h2>
        <p className="muted small">Plain CSS bars (no charting library).</p>
        <div className="chart" aria-label="Earnings comparison chart">
          {chart.last.map((r) => {
            const a = Number(r.actual_income);
            const p = r.predicted_income != null ? Number(r.predicted_income) : null;
            const ah = Math.round((a / chart.maxVal) * 100);
            const ph = p != null ? Math.round((p / chart.maxVal) * 100) : 0;
            const label = String(r.date).slice(5, 10);
            return (
              <div key={r.id} className="chart-col">
                <div className="chart-bars">
                  <div
                    className="chart-bar actual"
                    style={{ height: `${ah}%` }}
                    title={`Actual ${a}`}
                  />
                  {p != null ? (
                    <div
                      className="chart-bar predicted"
                      style={{ height: `${ph}%` }}
                      title={`Predicted ${p}`}
                    />
                  ) : (
                    <div className="chart-bar predicted ghost" style={{ height: '2%' }} title="No prediction" />
                  )}
                </div>
                <span className="chart-label mono">{label}</span>
              </div>
            );
          })}
        </div>
        <div className="legend">
          <span>
            <i className="swatch actual" /> Actual
          </span>
          <span>
            <i className="swatch predicted" /> Predicted
          </span>
        </div>
      </section>

      <section className="card table-card">
        <h2>All records</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Actual</th>
                <th>Predicted</th>
                <th>Gap</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted center">
                    No rows yet. Add earnings from the dashboard.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const a = Number(r.actual_income);
                  const p = r.predicted_income != null ? Number(r.predicted_income) : null;
                  const gap = p != null ? (p - a).toFixed(2) : '—';
                  return (
                    <tr key={r.id}>
                      <td className="mono">{String(r.date).slice(0, 10)}</td>
                      <td className="mono">{a.toFixed(2)}</td>
                      <td className="mono">{p != null ? p.toFixed(2) : '—'}</td>
                      <td className="mono">{gap}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

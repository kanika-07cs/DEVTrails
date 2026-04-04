import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiFetch } from '../services/api.js';

function todayISODate() {
  const d = new Date();
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export function DashboardPage() {
  const { token } = useAuth();
  const [date, setDate] = useState(todayISODate);
  const [actualInput, setActualInput] = useState('');
  const [history, setHistory] = useState([]);
  const [predicted, setPredicted] = useState(null);
  const [disruption, setDisruption] = useState(null);
  const [lossResult, setLossResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const refreshHistory = useCallback(async () => {
    const rows = await apiFetch('/earnings/history?limit=120', { token });
    setHistory(rows);
  }, [token]);

  useEffect(() => {
    refreshHistory().catch(() => {});
  }, [refreshHistory]);

  const todayRow = useMemo(
    () => history.find((r) => String(r.date).slice(0, 10) === date),
    [history, date]
  );

  const actual = todayRow != null ? Number(todayRow.actual_income) : null;
  const storedPredicted = todayRow?.predicted_income != null ? Number(todayRow.predicted_income) : null;

  async function onAddEarnings(e) {
    e.preventDefault();
    setMsg(null);
    if (!actualInput) return;
    setLoading(true);
    try {
      await apiFetch('/earnings/add', {
        token,
        method: 'POST',
        body: { date, actual_income: Number(actualInput) },
      });
      setActualInput('');
      await refreshHistory();
      setMsg({ type: 'ok', text: 'Earnings saved for selected date.' });
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function onPredict() {
    setMsg(null);
    setLoading(true);
    try {
      const res = await apiFetch('/predict-income', {
        token,
        method: 'POST',
        body: { date },
      });
      setPredicted(res.predicted_income);
      setMsg({ type: 'ok', text: 'Prediction refreshed from AI service.' });
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function loadDisruption() {
    setLoading(true);
    try {
      const res = await apiFetch('/disruption/signals', { token });
      setDisruption(res);
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function onDetectLoss() {
    setMsg(null);
    setLossResult(null);
    setLoading(true);
    try {
      const res = await apiFetch('/detect-loss', {
        token,
        method: 'POST',
        body: {
          date,
          auto_claim: true,
          mock_gps: {
            prev_lat: 12.97,
            prev_lng: 77.59,
            curr_lat: 12.98,
            curr_lng: 77.6,
          },
        },
      });
      setLossResult(res);
      await refreshHistory();
      if (res.notification) {
        setMsg({ type: 'ok', text: res.notification.message });
      } else if (res.claim_triggered) {
        setMsg({ type: 'ok', text: 'Loss detected — check claims.' });
      } else {
        setMsg({ type: 'ok', text: 'No claim threshold breach for this day.' });
      }
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  const displayPredicted = predicted ?? storedPredicted;
  const loss =
    displayPredicted != null && actual != null ? Math.max(0, displayPredicted - actual) : null;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            Track today&apos;s earnings, expected income from PulseShield AI, and run automated loss
            detection.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={loadDisruption} disabled={loading}>
          Refresh disruption signals
        </button>
      </header>

      {msg ? (
        <div className={msg.type === 'err' ? 'alert alert-error' : 'alert alert-success'}>{msg.text}</div>
      ) : null}

      <section className="grid cards-3">
        <article className="card stat">
          <h3>Actual earnings</h3>
          <p className="stat-value mono">{actual != null ? actual.toFixed(2) : '—'}</p>
          <p className="muted small">For {date}</p>
        </article>
        <article className="card stat">
          <h3>Expected (AI)</h3>
          <p className="stat-value mono">
            {displayPredicted != null ? displayPredicted.toFixed(2) : '—'}
          </p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onPredict} disabled={loading}>
            Run prediction
          </button>
        </article>
        <article className="card stat accent">
          <h3>Opportunity loss</h3>
          <p className="stat-value mono">{loss != null ? loss.toFixed(2) : '—'}</p>
          <p className="muted small">Expected − actual (never below zero)</p>
        </article>
      </section>

      <section className="grid two-col">
        <article className="card">
          <h2>Log earnings</h2>
          <form className="form compact" onSubmit={onAddEarnings}>
            <label className="field">
              <span>Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <label className="field">
              <span>Actual income</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={actualInput}
                onChange={(e) => setActualInput(e.target.value)}
                placeholder={actual != null ? String(actual) : '0.00'}
              />
            </label>
            <div className="row">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                Save earnings
              </button>
              <button type="button" className="btn btn-secondary" onClick={onDetectLoss} disabled={loading}>
                Detect loss &amp; auto-claim
              </button>
            </div>
          </form>
          {lossResult ? (
            <div className="loss-panel">
              <h3>Last detection result</h3>
              <ul className="kv">
                <li>
                  <span>Predicted</span>
                  <span className="mono">{lossResult.predicted_income?.toFixed?.(2)}</span>
                </li>
                <li>
                  <span>Actual</span>
                  <span className="mono">{lossResult.actual_income?.toFixed?.(2)}</span>
                </li>
                <li>
                  <span>Loss</span>
                  <span className="mono">{lossResult.loss?.toFixed?.(2)}</span>
                </li>
                <li>
                  <span>Claim triggered</span>
                  <span>{lossResult.claim_triggered ? 'Yes' : 'No'}</span>
                </li>
                {lossResult.claim ? (
                  <li>
                    <span>Risk</span>
                    <span className={`risk-pill ${lossResult.claim.risk_score}`}>
                      {lossResult.claim.risk_score}
                    </span>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </article>

        <article className="card">
          <h2>Disruption monitor</h2>
          <p className="muted">
            Mock feeds for weather, traffic, pollution, and demand — used as context alongside your
            earnings curve.
          </p>
          {disruption ? (
            <div className="disruption-grid">
              <div className="pill">
                <span>Weather</span>
                <strong>{disruption.weather?.severity}</strong>
              </div>
              <div className="pill">
                <span>Traffic</span>
                <strong>{disruption.traffic?.congestion_level}</strong>
              </div>
              <div className="pill">
                <span>AQI</span>
                <strong>{disruption.pollution?.aqi}</strong>
              </div>
              <div className="pill">
                <span>Demand index</span>
                <strong>{disruption.demand_drop?.platform_demand_index?.toFixed?.(2)}</strong>
              </div>
            </div>
          ) : (
            <p className="muted">Load signals to preview external disruption context.</p>
          )}
        </article>
      </section>
    </div>
  );
}

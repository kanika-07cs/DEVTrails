import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { useAuth } from '../context/AuthContext.jsx';
import { apiFetch } from '../services/api.js';

const colors = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

export function DemandMapPage() {
  const { token } = useAuth();
  const [data, setData] = useState({ zones: [], bestAreaSuggestion: null });

  useEffect(() => {
    apiFetch('/api/demand/zones', { token })
      .then(setData)
      .catch(() => {});
  }, [token]);

  const center = useMemo(() => {
    if (!data.zones.length) return [12.9716, 77.5946];
    return [data.zones[0].lat, data.zones[0].lng];
  }, [data.zones]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Smart Demand Heatmap</h1>
          <p className="muted">Live zone demand guidance with earnings potential for better shift decisions.</p>
        </div>
      </header>

      {data.bestAreaSuggestion ? (
        <section className="card mb-lg">
          <h2>Best Area Suggestion</h2>
          <p className="muted">
            Head to <strong>{data.bestAreaSuggestion.name}</strong> ({data.bestAreaSuggestion.demand_level}
            {' '}demand) for estimated earnings of{' '}
            <span className="mono">{Number(data.bestAreaSuggestion.estimated_earnings).toFixed(2)}</span>.
          </p>
        </section>
      ) : null}

      <section className="card">
        <div className="map-wrap">
          <MapContainer center={center} zoom={11} scrollWheelZoom style={{ height: '420px', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {data.zones.map((zone) => (
              <CircleMarker
                key={zone.id}
                center={[zone.lat, zone.lng]}
                radius={zone.demand_level === 'high' ? 18 : zone.demand_level === 'medium' ? 14 : 10}
                pathOptions={{ color: colors[zone.demand_level], fillColor: colors[zone.demand_level], fillOpacity: 0.45 }}
              >
                <Popup>
                  <div>
                    <strong>{zone.name}</strong>
                    <div>Demand: {zone.demand_level}</div>
                    <div>Earnings: {Number(zone.estimated_earnings).toFixed(2)}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </section>
    </div>
  );
}

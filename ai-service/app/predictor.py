"""
Time-series style income prediction using scikit-learn regression
on rolling statistics and calendar features.
"""
from __future__ import annotations

import hashlib
import numpy as np
from sklearn.linear_model import Ridge


def _location_drift(location: str, platform: str) -> float:
    raw = f"{location}|{platform}".encode()
    h = hashlib.sha256(raw).digest()
    return int.from_bytes(h[:2], "big") / 65535.0


def predict_income(
    past_earnings: list[float],
    day_of_week: int,
    hour: int,
    location: str,
    platform: str,
    baseline: float,
) -> float:
    y = np.array([float(x) for x in past_earnings], dtype=np.float64)
    baseline = float(baseline or 0)
    hour_norm = (float(hour) % 24) / 24.0
    dow = float(day_of_week % 7) / 7.0
    geo = _location_drift(location or "", platform or "")

    if y.size == 0:
        return max(0.0, baseline)

    if y.size < 5:
        blend = 0.65 * float(np.mean(y)) + 0.35 * baseline
        seasonal = 1.0 + 0.05 * np.sin(2 * np.pi * dow) + 0.03 * np.sin(2 * np.pi * hour_norm)
        return max(0.0, float(blend * seasonal + 10 * (geo - 0.5)))

    X_train: list[list[float]] = []
    y_train: list[float] = []

    for i in range(3, y.size):
        window3 = y[max(0, i - 3) : i]
        window7 = y[max(0, i - 7) : i]
        feat = [
            float(np.mean(window3)),
            float(np.mean(window7)),
            float(np.std(window7)) if window7.size > 1 else 0.0,
            float((i - 1) % 7) / 7.0,
            hour_norm,
            geo,
            baseline,
        ]
        X_train.append(feat)
        y_train.append(float(y[i]))

    X = np.array(X_train, dtype=np.float64)
    y_t = np.array(y_train, dtype=np.float64)

    if X.shape[0] < 2:
        blend = 0.65 * float(np.mean(y)) + 0.35 * baseline
        seasonal = 1.0 + 0.05 * np.sin(2 * np.pi * dow) + 0.03 * np.sin(2 * np.pi * hour_norm)
        return max(0.0, float(blend * seasonal + 10 * (geo - 0.5)))

    model = Ridge(alpha=1.0)
    model.fit(X, y_t)

    window3 = y[-3:]
    window7 = y[-7:] if y.size >= 7 else y
    x_pred = np.array(
        [
            [
                float(np.mean(window3)),
                float(np.mean(window7)),
                float(np.std(window7)) if window7.size > 1 else 0.0,
                dow,
                hour_norm,
                geo,
                baseline,
            ]
        ],
        dtype=np.float64,
    )

    pred = float(model.predict(x_pred)[0])
    pred = max(0.0, pred)
    if baseline > 0:
        pred = 0.85 * pred + 0.15 * baseline
    return pred

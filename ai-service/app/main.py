from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.predictor import predict_income

app = FastAPI(
    title="PulseShield AI",
    description="Income prediction microservice for gig workers",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    past_earnings: list[float] = Field(default_factory=list)
    day_of_week: int = Field(default=0, ge=0, le=6)
    hour: int = Field(default=12, ge=0, le=23)
    location: str = ""
    platform: str = ""
    avg_daily_earnings_baseline: float = 0


class PredictResponse(BaseModel):
    predicted_income: float


@app.get("/health")
def health():
    return {"ok": True, "service": "pulseshield-ai"}


@app.post("/predict", response_model=PredictResponse)
def predict(body: PredictRequest):
    value = predict_income(
        past_earnings=body.past_earnings,
        day_of_week=body.day_of_week,
        hour=body.hour,
        location=body.location,
        platform=body.platform,
        baseline=body.avg_daily_earnings_baseline,
    )
    return PredictResponse(predicted_income=round(value, 2))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import random
from typing import List
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock Data for Mutual Funds
FUNDS_DATA = [
    {"id": 1, "name": "Growth Alpha Fund", "nav": 120.50, "1Y_return": 15.2, "risk_level": "High"},
    {"id": 2, "name": "Stable Income Bond", "nav": 10.15, "1Y_return": 6.5, "risk_level": "Low"},
    {"id": 3, "name": "Global Tech Equity", "nav": 450.20, "1Y_return": 22.8, "risk_level": "Very High"},
    {"id": 4, "name": "Balanced Heritage Fund", "nav": 85.75, "1Y_return": 11.1, "risk_level": "Medium"},
    {"id": 5, "name": "ESG Green Energy", "nav": 112.30, "1Y_return": 18.4, "risk_level": "High"},
    {"id": 6, "name": "Liquid Cash Plus", "nav": 1000.00, "1Y_return": 4.2, "risk_level": "Very Low"},
]

class Fund(BaseModel):
    id: int
    name: str
    nav: float
    return_1y: float
    risk_level: str

@app.get("/api/funds")
async def get_funds():
    # Simulate dynamic price movements
    updated_funds = []
    for fund in FUNDS_DATA:
        # Small random fluctuation -0.5% to +0.5%
        change = 1 + random.uniform(-0.005, 0.005)
        updated_funds.append({
            **fund,
            "nav": round(fund["nav"] * change, 2)
        })
    return updated_funds

@app.get("/api/portfolio")
async def get_portfolio():
    return {
        "total_value": 124500.00,
        "returns_pct": 12.4,
        "holdings": [
            {"fund_id": 1, "units": 100, "avg_price": 110.00},
            {"fund_id": 3, "units": 50, "avg_price": 400.00},
            {"fund_id": 4, "units": 200, "avg_price": 80.00},
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

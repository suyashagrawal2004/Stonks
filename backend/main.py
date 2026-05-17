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

# Mock Data for Indian Mutual Funds (in INR)
FUNDS_DATA = [
    {"id": 1, "name": "Parag Parikh Flexi Cap Fund", "nav": 82.45, "1Y_return": 24.5, "risk_level": "High"},
    {"id": 2, "name": "SBI Bluechip Fund", "nav": 94.20, "1Y_return": 16.8, "risk_level": "Medium"},
    {"id": 3, "name": "ICICI Prudential Technology Fund", "nav": 185.60, "1Y_return": 28.2, "risk_level": "Very High"},
    {"id": 4, "name": "HDFC Balanced Advantage Fund", "nav": 480.15, "1Y_return": 18.1, "risk_level": "Medium"},
    {"id": 5, "name": "Nippon India Small Cap Fund", "nav": 160.30, "1Y_return": 38.4, "risk_level": "High"},
    {"id": 6, "name": "Axis Liquid Fund", "nav": 2750.50, "1Y_return": 7.2, "risk_level": "Low"},
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
        "returns_pct": 18.2,
        "holdings": [
            {"fund_id": 1, "units": 500, "avg_price": 75.00},
            {"fund_id": 3, "units": 200, "avg_price": 170.00},
            {"fund_id": 4, "units": 100, "avg_price": 450.00},
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

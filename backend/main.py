from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import random
from typing import List, Dict, Any
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

USER_RISK_PROFILE = None

# Mock Data for Indian Mutual Funds (in INR)
FUNDS_DATA = [
    {"id": 1, "name": "Parag Parikh Flexi Cap Fund", "nav": 82.45, "1Y_return": 24.5, "risk_level": "High", "category": "Flexi Cap"},
    {"id": 2, "name": "SBI Bluechip Fund", "nav": 94.20, "1Y_return": 16.8, "risk_level": "Medium", "category": "Large Cap"},
    {"id": 3, "name": "ICICI Prudential Technology Fund", "nav": 185.60, "1Y_return": 28.2, "risk_level": "Very High", "category": "Sectoral/Thematic"},
    {"id": 4, "name": "HDFC Balanced Advantage Fund", "nav": 480.15, "1Y_return": 18.1, "risk_level": "Medium", "category": "Hybrid"},
    {"id": 5, "name": "Nippon India Small Cap Fund", "nav": 160.30, "1Y_return": 38.4, "risk_level": "High", "category": "Small Cap"},
    {"id": 6, "name": "Axis Liquid Fund", "nav": 2750.50, "1Y_return": 7.2, "risk_level": "Low", "category": "Debt"},
]

PORTFOLIO_HOLDINGS = [
    {"fund_id": 1, "name": "Parag Parikh Flexi Cap Fund", "units": 500, "avg_price": 75.00, "invested_amount": 37500.00},
    {"fund_id": 3, "name": "ICICI Prudential Technology Fund", "units": 200, "avg_price": 170.00, "invested_amount": 34000.00},
    {"fund_id": 4, "name": "HDFC Balanced Advantage Fund", "units": 100, "avg_price": 450.00, "invested_amount": 45000.00},
]

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]]
    portfolio_context: Dict[str, Any]
    funds_context: List[Dict[str, Any]]

class InvestRequest(BaseModel):
    fund_id: int
    amount: float

class RiskProfileRequest(BaseModel):
    answers: List[int]

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
    # Dynamically calculate current values and category mapping
    holdings_details = []
    current_value = 0
    total_invested = 0
    
    # Map category and risk level to each holding
    for holding in PORTFOLIO_HOLDINGS:
        fund = next((f for f in FUNDS_DATA if f["id"] == holding["fund_id"]), None)
        if fund:
            curr_val = round(holding["units"] * fund["nav"], 2)
            current_value += curr_val
            total_invested += holding["invested_amount"]
            
            holdings_details.append({
                **holding,
                "current_value": curr_val,
                "category": fund["category"],
                "risk_level": fund["risk_level"]
            })
            
    if not total_invested:
        return {
            "total_value": 0,
            "total_invested": 0,
            "returns_pct": 0,
            "holdings": [],
            "health_score": 100,
            "category_breakdown": [],
            "health_advice": "Your portfolio is empty. Start investing to build your health score!"
        }
        
    returns_pct = round(((current_value - total_invested) / total_invested) * 100, 2)
    
    # Calculate category & risk weights
    category_weights = {}
    risk_weights = {}
    
    for h in holdings_details:
        weight = h["current_value"] / current_value
        category_weights[h["category"]] = category_weights.get(h["category"], 0.0) + weight
        risk_weights[h["risk_level"]] = risk_weights.get(h["risk_level"], 0.0) + weight
        
    # Calculate health score starting at 100
    health_score = 100
    deductions = []
    
    # 1. Single Fund Concentration (Penalty if single fund > 50% weight)
    for h in holdings_details:
        weight = h["current_value"] / current_value
        if weight > 0.50:
            penalty = 15
            health_score -= penalty
            deductions.append(f"High concentration in a single fund ({h['name']}: {round(weight*100)}%). Consider diversifying to reduce risk.")
            break # only deduct once
            
    # 2. Asset Category Concentration (Penalty if single category > 60%, except Hybrid/Flexi Cap)
    for cat, weight in category_weights.items():
        if cat not in ["Flexi Cap", "Hybrid"] and weight > 0.60:
            penalty = 15
            health_score -= penalty
            deductions.append(f"Overexposure to {cat} category ({round(weight*100)}%). Rebalance into other categories.")
            
    # 3. High Risk Exposure (Penalty if Very High Risk or Small Cap > 40%)
    high_risk_weight = 0.0
    for h in holdings_details:
        if h["risk_level"] == "Very High" or h["category"] == "Small Cap":
            high_risk_weight += h["current_value"] / current_value
            
    if high_risk_weight > 0.40:
        penalty = 15
        health_score -= penalty
        deductions.append(f"Highly volatile exposure ({round(high_risk_weight*100)}% in Small Cap / Very High Risk funds). Consider balancing with debt or liquid funds.")
        
    # 4. Low Diversification (Penalty if < 3 funds)
    if len(holdings_details) < 3:
        penalty = 10
        health_score -= penalty
        deductions.append("Portfolio has fewer than 3 funds. Greater diversification helps lower market volatility.")
        
    # Ensure score bounds
    health_score = max(0, min(100, health_score))
    
    # Generate advice
    if not deductions:
        health_advice = "Your portfolio is excellent! Asset allocation is well-diversified and balanced across risk profiles."
    else:
        health_advice = " ".join(deductions[:2]) # return top 2 actionable advices
        
    # Format category breakdown for frontend
    category_breakdown = [
        {"category": cat, "percentage": round(weight * 100, 1)}
        for cat, weight in category_weights.items()
    ]
    
    # Sort breakdown by percentage descending
    category_breakdown.sort(key=lambda x: x["percentage"], reverse=True)
    
    return {
        "total_value": round(current_value, 2),
        "total_invested": round(total_invested, 2),
        "returns_pct": returns_pct,
        "holdings": holdings_details,
        "health_score": health_score,
        "category_breakdown": category_breakdown,
        "health_advice": health_advice,
        "risk_profile": USER_RISK_PROFILE
    }

@app.post("/api/risk-profile")
async def set_risk_profile(request: RiskProfileRequest):
    global USER_RISK_PROFILE
    if len(request.answers) != 3:
        raise HTTPException(status_code=400, detail="Must provide exactly 3 answers")
    
    total_score = sum(request.answers)
    
    if total_score <= 4:
        profile = "Conservative"
        description = "You prioritize capital preservation and stable, low-volatility returns."
    elif total_score <= 7:
        profile = "Moderate"
        description = "You seek balanced growth with moderate fluctuations."
    else:
        profile = "Aggressive"
        description = "You target high growth and can tolerate significant market volatility."
        
    USER_RISK_PROFILE = {
        "profile": profile,
        "description": description,
        "score": total_score
    }
    
    return {
        "status": "success",
        "risk_profile": USER_RISK_PROFILE
    }

@app.post("/api/invest")
async def invest_in_fund(request: InvestRequest):
    fund = next((f for f in FUNDS_DATA if f["id"] == request.fund_id), None)
    if not fund:
        raise HTTPException(status_code=404, detail="Mutual Fund not found")
    
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Investment amount must be greater than zero")
        
    # Calculate units purchased based on current NAV
    units = round(request.amount / fund["nav"], 4)
    
    # Check if we already hold this fund
    holding = next((h for h in PORTFOLIO_HOLDINGS if h["fund_id"] == request.fund_id), None)
    if holding:
        # Recalculate average price and units
        new_units = holding["units"] + units
        new_invested = holding["invested_amount"] + request.amount
        avg_price = round(new_invested / new_units, 2)
        
        holding["units"] = round(new_units, 4)
        holding["avg_price"] = avg_price
        holding["invested_amount"] = round(new_invested, 2)
    else:
        # Add new holding
        PORTFOLIO_HOLDINGS.append({
            "fund_id": fund["id"],
            "name": fund["name"],
            "units": units,
            "avg_price": fund["nav"],
            "invested_amount": request.amount
        })
        
    return {
        "status": "success",
        "message": f"Successfully invested ₹{request.amount:,.2f} in {fund['name']}.",
        "added_units": units
    }

@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"response": "⚠️ **Please configure your GEMINI_API_KEY** in the `backend/.env` file to use the AI assistant. Ask your developer to provide it!"}
        
    try:
        model = genai.GenerativeModel(
            model_name='gemini-flash-latest',
            generation_config={"max_output_tokens": 2000}
        )
        
        system_prompt = f"""
        You are an expert AI Mutual Fund Advisor. The user has asked for assistance with investing in mutual funds.
        Here is the user's current portfolio: {request.portfolio_context}
        Here are the live updating mutual funds available to invest in: {request.funds_context}
        User's Risk Profile: {USER_RISK_PROFILE if USER_RISK_PROFILE else "Unrated. (Gently recommend they take the Risk Profiler Questionnaire to get compliant recommendations)"}
        
        Analyze their portfolio. They want to know which mutual funds they should invest in from the available list and why.
        Provide personalized, logical, and professional advice in a conversational tone. Keep it concise but insightful. Format with markdown if necessary.
        Use INR (₹) for currency formatting.
        
        SEBI COMPLIANCE RULE: 
        1. If the User's Risk Profile is "Conservative", you MUST advise them to avoid "High" or "Very High" risk level funds (like Nippon India Small Cap or ICICI Prudential Technology Fund). If they query or try to invest in these, warn them that it conflicts with their Conservative profile and recommend "Low" or "Medium" risk funds instead (such as Axis Liquid Fund or HDFC Balanced Advantage Fund).
        2. If the User's Risk Profile is "Aggressive", you can recommend higher risk equity funds, but suggest keeping a portion in liquid funds for hedging.
        3. If the User's Risk Profile is "Moderate", favor Large Cap, Hybrid, or Flexi Cap funds.
        4. If the User's Risk Profile is "Unrated", encourage them to complete their risk profiling questionnaire in the chat to receive compliant advice.
        
        CRITICAL RULE: If you recommend or suggest investing in one or more specific mutual funds from the available list, you MUST append a tag in the exact format: [INVEST_OPTION: fund_id, fund_name] at the very end of your message for each recommended fund (e.g. [INVEST_OPTION: 1, Parag Parikh Flexi Cap Fund]). Do not mention this tag in the conversation; just output it.
        """
        
        # Build history format for Gemini
        messages = [{"role": "user", "parts": [{"text": system_prompt}]}, {"role": "model", "parts": [{"text": "Understood. I am ready to advise."}]}]
        
        for msg in request.history:
            if msg["role"] == "bot":
                messages.append({"role": "model", "parts": [{"text": msg["content"]}]})
            else:
                messages.append({"role": "user", "parts": [{"text": msg["content"]}]})
                
        messages.append({"role": "user", "parts": [{"text": request.message}]})
        
        response = model.generate_content(messages)
        return {"response": response.text}
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {"response": f"Sorry, there was an error processing your request. Please check your API key or try again later. Error: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

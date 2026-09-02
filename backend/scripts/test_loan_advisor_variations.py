"""Test script to verify dynamic loan recommendations across different profiles."""
import json
import sys
import asyncio
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import RecommendLoansRequest, recommend_loans_endpoint

test_profiles = [
    {
        "name": "Vehicle Loan - Low Income First Time Buyer",
        "profile": {
            "intent": "Vehicle Loan",
            "monthly_income": 30000,
            "requested_loan_amount": 400000,
            "employment_type": "Salaried",
            "credit_band": "good"
        }
    },
    {
        "name": "Vehicle Loan - High Income Business Owner Fleet",
        "profile": {
            "intent": "Vehicle Loan",
            "monthly_income": 300000,
            "requested_loan_amount": 4000000,
            "employment_type": "Business Owner",
            "credit_band": "excellent"
        }
    },
    {
        "name": "Home Loan - Entry Level Salaried",
        "profile": {
            "intent": "Home Loan",
            "monthly_income": 35000,
            "requested_loan_amount": 2500000,
            "employment_type": "Salaried",
            "credit_band": "good"
        }
    },
    {
        "name": "Home Loan - High Net Worth Luxury",
        "profile": {
            "intent": "Home Loan",
            "monthly_income": 250000,
            "requested_loan_amount": 60000000,
            "employment_type": "Salaried",
            "credit_band": "excellent"
        }
    },
    {
        "name": "Personal Loan - Low Amount Quick Cash",
        "profile": {
            "intent": "Personal Loan",
            "monthly_income": 40000,
            "requested_loan_amount": 300000,
            "employment_type": "Salaried",
            "credit_band": "good"
        }
    },
    {
        "name": "Personal Loan - High Ticket Premium",
        "profile": {
            "intent": "Personal Loan",
            "monthly_income": 150000,
            "requested_loan_amount": 2500000,
            "employment_type": "Salaried",
            "credit_band": "excellent"
        }
    }
]

def main():
    print("=" * 70)
    print("TESTING DYNAMIC LOAN ADVISOR RECOMMENDATIONS")
    print("=" * 70)
    
    for test in test_profiles:
        name = test["name"]
        p = test["profile"]
        print(f"\n--- Scenario: {name} ---")
        print(f"Input: Category={p['intent']}, Income=INR {p['monthly_income']:,}, Amount=INR {p['requested_loan_amount']:,}, Emp={p['employment_type']}", flush=True)
        
        req = RecommendLoansRequest(
            intent=p["intent"],
            income=p["monthly_income"],
            loan_amount=p["requested_loan_amount"],
            employment_type=p["employment_type"],
            credit_band=p["credit_band"]
        )
        
        try:
            res = asyncio.run(recommend_loans_endpoint(req))
            loans = res.get("recommended_loans", [])
            print(f"Generated {len(loans)} recommendations:")
            for idx, l in enumerate(loans[:3]):
                print(f"  #{idx+1} [{l.get('tag', 'MATCH')}] {l.get('name')} ({l.get('bank')}) - Score: {l.get('match_score')}%")
                print(f"      Reason: {l.get('reasoning')[:100]}...")
        except Exception as e:
            print(f"Error testing backend endpoint: {e}")

if __name__ == "__main__":
    main()

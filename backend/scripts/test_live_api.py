import urllib.request
import json

url = "http://localhost:8080/api/v1/recommend-loans"

profiles = [
    {"intent": "Vehicle Loan", "income": 30000, "loan_amount": 400000, "employment_type": "Salaried"},
    {"intent": "Vehicle Loan", "income": 300000, "loan_amount": 4000000, "employment_type": "Business Owner"},
    {"intent": "Home Loan", "income": 35000, "loan_amount": 2500000, "employment_type": "Salaried"},
    {"intent": "Home Loan", "income": 250000, "loan_amount": 60000000, "employment_type": "Salaried"},
]

for p in profiles:
    req = urllib.request.Request(
        url,
        data=json.dumps(p).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            recs = data.get("recommended_loans", [])
            print(f"\nScenario: {p['intent']} | Income={p['income']} | Amount={p['loan_amount']} | Emp={p['employment_type']}", flush=True)
            for idx, r in enumerate(recs[:3]):
                print(f"  #{idx+1} [{r.get('tag', 'MATCH')}] {r.get('name')} ({r.get('bank')}) - Score: {r.get('match_score')}%", flush=True)
    except Exception as e:
        print(f"Error testing {p}: {e}", flush=True)


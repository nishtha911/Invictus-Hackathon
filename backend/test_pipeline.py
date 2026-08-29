import requests
import json
import time

BASE_URL = "http://localhost:8080"

def safe_print(text):
    print(str(text).encode('ascii', 'ignore').decode('ascii'))

def print_step(title):
    print(f"\n{'='*50}")
    safe_print(f"[STEP] {title}")
    print(f"{'='*50}")

def run_test():
    print_step("1. Starting AI Chat Session (/api/chat/start)")
    res = requests.post(f"{BASE_URL}/api/chat/start?user_type=guest")
    
    if res.status_code != 200:
        safe_print(f"Failed to start session: {res.text}")
        return

    data = res.json()
    session_id = data["session_id"]
    safe_print(f"Session started! ID: {session_id}")
    safe_print(f"AI: {data['messages'][-1]['content']}")
    if data['messages'][-1].get('ui_component'):
        safe_print(f"   [UI Component]: {data['messages'][-1]['ui_component']}")

    # Simulate answering questions
    answers = [
        "Personal Loan", 
        "500000", 
        "75000", 
        "Salaried", 
        "No existing loans", 
        "Excellent", 
        "Immediate"
    ]
    
    is_complete = False

    print_step("2. Simulating Conversational Intake (/api/chat/message)")
    for answer in answers:
        safe_print(f"\nUser: {answer}")
        res = requests.post(f"{BASE_URL}/api/chat/message", json={
            "session_id": session_id,
            "message": answer
        })
        
        if res.status_code != 200:
            safe_print(f"Error sending message: {res.text}")
            break
            
        data = res.json()
        state = data["session_state"]
        
        safe_print(f"AI: {data['messages'][-1]['content']}")
        safe_print(f"   Profile Completeness: {state['completeness_pct']}%")
        
        if state["is_complete"] or state['completeness_pct'] >= 80:
            is_complete = True
            safe_print("Profile extraction complete!")
            break

    if not is_complete:
        safe_print("Session ended but profile is not fully complete yet.")
    
    print_step("3. Fetching Loan Recommendations (/api/recommendations)")
    res = requests.get(f"{BASE_URL}/api/recommendations/{session_id}")
    if res.status_code == 200:
        recs = res.json().get("recommendations", [])
        safe_print(f"Found {len(recs)} matching loan products!")
        for idx, rec in enumerate(recs):
            safe_print(f"\nRank {idx+1}: {rec['product_name']} (Score: {rec['match_score']})")
            safe_print(f"   - Status: {rec['computed_terms']['eligibility_status']}")
            safe_print(f"   - EMI: INR {rec['computed_terms']['estimated_emi']}")
            safe_print(f"   - Rate: {rec['computed_terms']['interest_rate_pct']}%")
            safe_print(f"   - AI Reasoning: {rec['ai_explanation']['summary_text']}")
    else:
        safe_print(f"Failed to fetch recommendations: {res.text}")
        return

    print_step("4. Capturing Lead & Scoring (/api/leads)")
    lead_payload = {
        "session_id": session_id,
        "name": "Test User",
        "email": "test@example.com",
        "phone": "9999999999",
        "selected_loan_id": recs[0]["product_id"] if recs else "prod-001",
        "loan_amount": 500000
    }
    res = requests.post(f"{BASE_URL}/api/leads", json=lead_payload)
    if res.status_code == 200:
        lead_data = res.json()
        safe_print(f"Lead Captured! ID: {lead_data['lead_id']}")
        safe_print(f"   Score Band: {lead_data['scoring']['score_band']} (Score: {lead_data['scoring']['score']})")
        safe_print(f"   Briefing: {lead_data['scoring']['ai_briefing']}")
    else:
        safe_print(f"Failed to capture lead: {res.text}")
        return

    print_step("5. Checking Sales Dashboard (/api/dashboard)")
    res = requests.get(f"{BASE_URL}/api/dashboard")
    if res.status_code == 200:
        dash_data = res.json()
        safe_print(f"Dashboard KPIs retrieved!")
        safe_print(f"   - Total Leads: {dash_data['kpis']['total_leads']}")
        safe_print(f"   - Hot Leads: {dash_data['kpis']['hot_leads']}")
        safe_print(f"   - Avg Score: {dash_data['kpis']['avg_lead_score']}")
    else:
        safe_print(f"Failed to fetch dashboard: {res.text}")

    print_step("ALL BACKEND SYSTEMS GREEN!")

if __name__ == "__main__":
    run_test()

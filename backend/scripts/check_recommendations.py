#!/usr/bin/env python3
"""Quick test to see what loans Loan Advisor is actually recommending."""

import sys
sys.path.insert(0, "/backend")

import requests
import json
import time

BASE = "http://localhost:8080"

print("\n" + "="*70)
print("LOAN ADVISOR - CHECKING WHAT LOANS ARE BEING RECOMMENDED")
print("="*70)

# Test 1: Personal Loan
print("\n[TEST 1] Personal Loan for Salaried Customer")
print("-" * 70)

test1 = {
    "user_type": "guest",
    "income": 75000,
    "loan_amount": 500000,
    "intent": "Personal Loan",
    "tenure_years": 5,
    "employment_type": "Salaried",
    "existing_emi": 0,
    "credit_band": "good",
    "urgency": "immediate"
}

try:
    response = requests.post(f"{BASE}/api/recommendations", json=test1, timeout=15)
    if response.status_code == 200:
        result = response.json()
        recs = result.get("recommended_loans", [])
        
        print(f"✓ Received {len(recs)} recommendations")
        print(f"  RAG Grounded: {not result.get('rag_insufficient_information', False)}")
        print(f"  RAG Confidence: {result.get('rag_confidence', 0):.2f}")
        
        if recs:
            print(f"\n  Recommended Schemes:")
            for i, rec in enumerate(recs, 1):
                name = rec.get("scheme_name", "❌ MISSING SCHEME NAME")
                bank = rec.get("bank", "❌ MISSING BANK")
                conf = rec.get("confidence", 0)
                reason = rec.get("match_reason", "No reason provided")[:80]
                print(f"    {i}. {name}")
                print(f"       Bank: {bank}")
                print(f"       Confidence: {conf:.2f}")
                print(f"       Reason: {reason}...")
        else:
            print("  ⚠️  WARNING: No recommendations returned!")
    else:
        print(f"✗ Error {response.status_code}: {response.text[:200]}")
except Exception as e:
    print(f"✗ Connection failed: {e}")

time.sleep(1)

# Test 2: Home Loan  
print("\n[TEST 2] Home Loan for First-Time Buyer")
print("-" * 70)

test2 = {
    "user_type": "new",
    "income": 60000,
    "loan_amount": 3000000,
    "intent": "Home Loan",
    "tenure_years": 20,
    "employment_type": "Salaried",
    "existing_emi": 0,
    "credit_band": "good",
    "urgency": "exploring"
}

try:
    response = requests.post(f"{BASE}/api/recommendations", json=test2, timeout=15)
    if response.status_code == 200:
        result = response.json()
        recs = result.get("recommended_loans", [])
        
        print(f"✓ Received {len(recs)} recommendations")
        print(f"  RAG Grounded: {not result.get('rag_insufficient_information', False)}")
        
        if recs:
            print(f"\n  Recommended Home Loan Schemes:")
            for i, rec in enumerate(recs, 1):
                name = rec.get("scheme_name", "❌ MISSING NAME")
                bank = rec.get("bank", "❌ MISSING BANK")
                print(f"    {i}. {name} ({bank})")
        else:
            print("  ⚠️  No home loan recommendations!")
    else:
        print(f"✗ Error {response.status_code}")
except Exception as e:
    print(f"✗ Connection failed: {e}")

time.sleep(1)

# Test 3: Business Loan
print("\n[TEST 3] Business Loan for SME Owner")
print("-" * 70)

test3 = {
    "user_type": "existing",
    "income": 500000,
    "loan_amount": 2000000,
    "intent": "Business Loan",
    "tenure_years": 5,
    "employment_type": "Business Owner",
    "existing_emi": 0,
    "credit_band": "good",
    "urgency": "immediate"
}

try:
    response = requests.post(f"{BASE}/api/recommendations", json=test3, timeout=15)
    if response.status_code == 200:
        result = response.json()
        recs = result.get("recommended_loans", [])
        
        print(f"✓ Received {len(recs)} recommendations")
        
        if recs:
            print(f"\n  Recommended Business Loan Schemes:")
            for i, rec in enumerate(recs, 1):
                name = rec.get("scheme_name", "❌ MISSING")
                bank = rec.get("bank", "❌ MISSING")
                print(f"    {i}. {name} ({bank})")
        else:
            print("  ⚠️  No business loan recommendations!")
    else:
        print(f"✗ Error {response.status_code}")
except Exception as e:
    print(f"✗ Connection failed: {e}")

print("\n" + "="*70)
print("REAL LOANS IN RAG SCHEMA")
print("="*70)
print("""
✓ Personal Loans (4 schemes):
   - QuickCash
   - FlexiPersonal
   - PremiumPersonal
   - PersonalPlus

✓ Home Loans (4 schemes):
   - FirstHome Advantage
   - EasyHome Loan
   - FlexiMortgage
   - RoyalMortgage

✓ Education Loans (4 schemes):
   - ScholarPlus
   - FutureBuilder
   - StudyAbroad Edge
   - SkillBoost

✓ Vehicle Loans (4 schemes):
   - SmartAuto
   - EasyDrive
   - FleetPro
   - NewbieCar

✓ Business Loans (4 schemes):
   - GrowthBooster
   - ExpressBiz
   - SMEPlus
   - EnterpriseEdge
""")

print("="*70)
print("If the Advisor is recommending ANY loans NOT in the above list,")
print("it means it's HALLUCINATING or using fallback rule-based scoring.")
print("="*70 + "\n")

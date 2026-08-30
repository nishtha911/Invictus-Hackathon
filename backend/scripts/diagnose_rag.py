#!/usr/bin/env python3
"""Diagnostic: Check what's in the RAG schema."""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environ
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from db import get_conn

print("\n" + "="*70)
print("RAG SCHEMA DIAGNOSTIC")
print("="*70)

with get_conn() as conn:
    with conn.cursor() as cur:
        # Check documents in rag.documents
        print("\n[1] Documents in RAG Schema:")
        print("-" * 70)
        cur.execute("""
            SELECT id, name as doc_name, loan_category, uploaded_at as created_at
            FROM rag.documents
            ORDER BY uploaded_at DESC
            LIMIT 30;
        """)
        docs = cur.fetchall()
        
        if docs:
            print(f"Found {len(docs)} documents:\n")
            doc_dict = {}
            for row in docs:
                doc_name = row["doc_name"]
                category = row["loan_category"]
                created = row["created_at"]
                print(f"  {doc_name:40s} | Category: {category:20s}")
                
                # Count by category
                if category not in doc_dict:
                    doc_dict[category] = []
                doc_dict[category].append(doc_name)
            
            print("\n  Summary by Category:")
            for cat in sorted(doc_dict.keys()):
                print(f"    {cat}: {len(doc_dict[cat])} docs")
        else:
            print("  ❌ NO DOCUMENTS FOUND IN RAG SCHEMA!")
        
        # Check chunks
        print("\n[2] Chunks in RAG Schema:")
        print("-" * 70)
        cur.execute("""
            SELECT COUNT(*) as total_chunks,
                   COUNT(DISTINCT doc_id) as unique_docs
            FROM rag.chunks;
        """)
        cnt = cur.fetchone()
        total, unique = cnt["total_chunks"], cnt["unique_docs"]
        print(f"  Total Chunks: {total}")
        print(f"  Unique Documents: {unique}")
        
        # Show chunk distribution by document
        print("\n  Chunks by Document:")
        cur.execute("""
            SELECT doc_name, COUNT(*) as chunk_count
            FROM rag.chunks
            GROUP BY doc_name
            ORDER BY chunk_count DESC
            LIMIT 20;
        """)
        chunk_rows = cur.fetchall()
        for r in chunk_rows:
            doc_name, count = r["doc_name"], r["chunk_count"]
            print(f"    {doc_name:40s}: {count:3d} chunks")

print("\n" + "="*70)
print("EXPECTED LOANS IN RAG")
print("="*70)
print("""
Personal Loans:
  - personal_scheme_quickcash.txt (QuickCash)
  - personal_scheme_flexi.txt (FlexiPersonal)
  - personal_scheme_premium.txt (PremiumPersonal)
  - personal_scheme_plus.txt (PersonalPlus)

Home Loans:
  - home_scheme_easy_home.txt (EasyHome Loan)
  - home_scheme_first_home.txt (FirstHome Advantage)
  - home_scheme_flexi_mortgage.txt (FlexiMortgage)
  - home_scheme_royal_mortgage.txt (RoyalMortgage)

Education Loans:
  - education_scheme_scholar_plus.txt (ScholarPlus)
  - education_scheme_future_builder.txt (FutureBuilder)
  - education_scheme_study_abroad.txt (StudyAbroad Edge)
  - education_scheme_skill_boost.txt (SkillBoost)

Vehicle Loans:
  - vehicle_scheme_smart_auto.txt (SmartAuto)
  - vehicle_scheme_easy_drive.txt (EasyDrive)
  - vehicle_scheme_fleet_pro.txt (FleetPro)
  - vehicle_scheme_newbie.txt (NewbieCar)

Business Loans:
  - business_scheme_growth_booster.txt (GrowthBooster)
  - business_scheme_express.txt (ExpressBiz)
  - business_scheme_sme_plus.txt (SMEPlus)
  - business_scheme_enterprise.txt (EnterpriseEdge)
""")

print("="*70 + "\n")

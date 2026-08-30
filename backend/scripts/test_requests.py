import requests, json
base='http://localhost:8080'
req={'user_type':'new','income':60000,'loan_amount':500000,'intent':'Personal Loan','tenure_years':5,'employment_type':'Salaried','existing_emi':0,'credit_band':'good','urgency':'immediate','customer_name':'Rahul'}
res=requests.post(base+'/api/recommendations', json=req)
print('RECOMMENDATIONS STATUS', res.status_code)
try:
    print(json.dumps(res.json(), indent=2))
except Exception:
    print(res.text)

# KB query test
q={'question':'What is the minimum monthly income for ScholarPlus Education Loan?','loan_category':'education_loan','top_k':5,'session_id':'SESSION-TEST','profile':{}}
res2=requests.post(base+'/query', json=q)
print('\nKB QUERY STATUS', res2.status_code)
try:
    print(json.dumps(res2.json(), indent=2))
except Exception:
    print(res2.text)

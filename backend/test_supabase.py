import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

print(f"Connecting to {url}...")
try:
    client = create_client(url, key)
    # Check qualified_leads
    res = client.table("qualified_leads").select("*").limit(5).execute()
    print(f"qualified_leads success! Found {len(res.data)} rows.")
except Exception as e:
    print(f"Error accessing qualified_leads: {e}")

try:
    # Check customer_profiles
    res = client.table("customer_profiles").select("*").limit(5).execute()
    print(f"customer_profiles success! Found {len(res.data)} rows.")
except Exception as e:
    print(f"Error accessing customer_profiles: {e}")

const axios = require('axios');
const SUPABASE_URL = 'https://psclpghrsoxelzmebovj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY2xwZ2hyc294ZWx6bWVib3ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzg0Mjk5OSwiZXhwIjoyMTAzNDE4OTk5fQ.bX5_2_CwIqTPPNkNUUJhGtAxaS-5PWaSkEXiez1oeWg';

async function test() {
  try {
    const response = await axios.get(`${SUPABASE_URL}/rest/v1/qualified_leads`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log("Success! Fetched leads:", response.data.length);
    console.log("First lead:", response.data[0]);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

test();

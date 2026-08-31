const axios = require('axios');
const Customer = require('../models/Customer');

const SUPABASE_URL = 'https://psclpghrsoxelzmebovj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY_OVERRIDE || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY2xwZ2hyc294ZWx6bWVib3ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzg0Mjk5OSwiZXhwIjoyMTAzNDE4OTk5fQ.bX5_2_CwIqTPPNkNUUJhGtAxaS-5PWaSkEXiez1oeWg';

const syncFromSupabase = async () => {
  try {
    console.log('[Supabase Sync] Fetching qualified_leads from major project database...');
    const response = await axios.get(`${SUPABASE_URL}/rest/v1/qualified_leads`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const leads = response.data;
    if (!leads || leads.length === 0) {
      console.log('[Supabase Sync] No leads found in Supabase.');
      return;
    }

    console.log(`[Supabase Sync] Found ${leads.length} leads in Supabase. Syncing to MongoDB...`);
    
    for (const lead of leads) {
      const email = lead.email && lead.email !== 'N/A' 
        ? lead.email 
        : (lead.full_name ? `${lead.full_name.replace(/\\s+/g, '').toLowerCase()}@example.com` : `lead_${lead.id}@example.com`);

      const phone = lead.phone && lead.phone !== 'N/A'
        ? lead.phone
        : `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;

      // Map loan type
      let mappedLoanType = 'Personal Loan';
      const rawType = (lead.interested_product_id || '').toLowerCase();
      if (rawType.includes('home')) mappedLoanType = 'Home Loan';
      else if (rawType.includes('education')) mappedLoanType = 'Education Loan';
      else if (rawType.includes('business')) mappedLoanType = 'Business Loan';
      else if (rawType.includes('vehicle') || rawType.includes('auto') || rawType.includes('car')) mappedLoanType = 'Vehicle Loan';

      // Map status
      let mappedStatus = 'NEW';
      if (lead.status !== 'new') {
        mappedStatus = 'CONTACTED';
      }

      // Check if we already have this lead as a customer
      const existing = await Customer.findOne({ email });
      if (!existing) {
        try {
          await Customer.create({
            name: lead.full_name || 'Interested Borrower',
            phone: phone,
            email: email,
            preferredLanguage: 'English',
            preferredCallTime: lead.preferred_contact_time || 'Morning (9 AM - 12 PM)',
            customerStatus: mappedStatus,
            loan: {
              type: mappedLoanType,
              amount: lead.loan_amount || 500000,
              tenure: 36,
              purpose: lead.intent || 'Loan Inquiry'
            },
            financialProfile: {
              monthlyIncome: lead.monthly_income || 0,
              employmentType: lead.employment_type || 'Salaried',
              existingEMI: 0,
              creditScore: lead.lead_score || 700
            },
            notes: lead.chat_summary || lead.key_objections_or_notes
          });
        } catch (dbErr) {
          console.error(`[Supabase Sync] Failed to insert lead ${email}:`, dbErr.message);
        }
      }
    }
    console.log('[Supabase Sync] Sync complete.');
  } catch (err) {
    console.error('[Supabase Sync Error]:', err.message);
  }
};

module.exports = { syncFromSupabase };

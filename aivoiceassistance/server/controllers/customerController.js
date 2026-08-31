const Customer = require('../models/Customer');
const AuditLog = require('../models/AuditLog');

// GET /api/customers
exports.getCustomers = async (req, res) => {
  try {
    const axios = require('axios');
    const SUPABASE_URL = 'https://psclpghrsoxelzmebovj.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_KEY_OVERRIDE || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY2xwZ2hyc294ZWx6bWVib3ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzg0Mjk5OSwiZXhwIjoyMTAzNDE4OTk5fQ.bX5_2_CwIqTPPNkNUUJhGtAxaS-5PWaSkEXiez1oeWg';

    // 1. Fetch live from Supabase
    const response = await axios.get(`${SUPABASE_URL}/rest/v1/qualified_leads`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const leads = response.data || [];
    const customersToReturn = [];

    // 2. Map and Upsert into MongoDB on the fly to ensure _id exists for calls
    for (const lead of leads) {
      const email = lead.email && lead.email !== 'N/A' 
        ? lead.email 
        : (lead.full_name ? `${lead.full_name.replace(/\\s+/g, '').toLowerCase()}@example.com` : `lead_${lead.lead_id}@example.com`);

      const phone = lead.phone && lead.phone !== 'N/A' ? lead.phone : `+910000000000`;

      let mappedLoanType = 'Personal Loan';
      const rawType = (lead.interested_product_id || '').toLowerCase();
      if (rawType.includes('home')) mappedLoanType = 'Home Loan';
      else if (rawType.includes('education')) mappedLoanType = 'Education Loan';
      else if (rawType.includes('business')) mappedLoanType = 'Business Loan';
      else if (rawType.includes('vehicle') || rawType.includes('auto') || rawType.includes('car')) mappedLoanType = 'Vehicle Loan';

      let mappedStatus = 'NEW';
      if (lead.status && String(lead.status).toLowerCase() !== 'new') {
        mappedStatus = 'CONTACTED';
      }

      const updateData = {
        name: lead.full_name || 'Interested Borrower',
        phone: phone,
        preferredLanguage: 'English',
        preferredCallTime: lead.preferred_contact_time || 'Morning (9 AM - 12 PM)',
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
      };

      // Find existing to preserve status if it was changed locally
      const existing = await Customer.findOne({ phone });
      if (existing) {
        updateData.customerStatus = existing.customerStatus;
      } else {
        updateData.customerStatus = mappedStatus;
      }
      
      updateData.email = email; // explicitly set email in updateData

      try {
        const doc = await Customer.findOneAndUpdate(
          { phone },
          { $set: updateData },
          { new: true, upsert: true }
        );
        if (!customersToReturn.some(c => c._id.toString() === doc._id.toString())) {
          customersToReturn.push(doc);
        }
      } catch (dbErr) {
        console.warn(`[customerController] Skipping lead due to DB error (phone: ${phone}):`, dbErr.message);
      }
    }

    // Apply any local filters (search, status) to the Supabase result
    const { search, status } = req.query;
    let filtered = customersToReturn;
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(c => 
        (c.name && c.name.toLowerCase().includes(s)) ||
        (c.phone && c.phone.includes(s)) ||
        (c.email && c.email.toLowerCase().includes(s))
      );
    }
    if (status && status !== 'ALL') {
      filtered = filtered.filter(c => c.customerStatus === status);
    }

    // 3. Return strictly the Supabase leads
    res.json({
      success: true,
      count: filtered.length,
      total: filtered.length,
      page: 1,
      pages: 1,
      data: filtered
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/customers/:id
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/customers
exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, email, loan, financialProfile, preferredLanguage, preferredCallTime } = req.body;

    const existing = await Customer.findOne({ phone });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Customer with this phone number already exists' });
    }

    const customer = await Customer.create({
      name,
      phone,
      email,
      preferredLanguage,
      preferredCallTime,
      loan,
      financialProfile,
      customerStatus: 'NEW'
    });

    await AuditLog.create({
      action: 'CUSTOMER_CREATED',
      performedBy: req.user?.name || 'ADMIN',
      entityType: 'Customer',
      entityId: customer._id,
      details: { name: customer.name, phone: customer.phone }
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/customers/:id
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await AuditLog.create({
      action: 'CUSTOMER_UPDATED',
      performedBy: req.user?.name || 'ADMIN',
      entityType: 'Customer',
      entityId: customer._id,
      details: req.body
    });

    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/customers/:id
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await AuditLog.create({
      action: 'CUSTOMER_DELETED',
      performedBy: req.user?.name || 'ADMIN',
      entityType: 'Customer',
      entityId: customer._id
    });

    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

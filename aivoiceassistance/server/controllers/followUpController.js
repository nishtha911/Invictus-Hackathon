const FollowUp = require('../models/FollowUp');
const Customer = require('../models/Customer');
const AuditLog = require('../models/AuditLog');

// GET /api/followups
exports.getFollowUps = async (req, res) => {
  try {
    const { customerId, status, priority, page = 1, limit = 20 } = req.query;
    const query = {};

    if (customerId) query.customerId = customerId;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const total = await FollowUp.countDocuments(query);
    const followUps = await FollowUp.find(query)
      .populate('customerId', 'name phone email customerStatus loan')
      .sort({ scheduledAt: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: followUps.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: followUps
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/followups/:id
exports.getFollowUpById = async (req, res) => {
  try {
    const followUp = await FollowUp.findById(req.params.id).populate('customerId');
    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }
    res.json({ success: true, data: followUp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/followups
exports.createFollowUp = async (req, res) => {
  try {
    const { customerId, reason, scheduledAt, priority, notes } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const followUp = await FollowUp.create({
      customerId,
      reason,
      scheduledAt: new Date(scheduledAt),
      priority: priority || 'MEDIUM',
      status: 'SCHEDULED',
      notes
    });

    // Update customer next follow-up date
    customer.followUp.enabled = true;
    customer.followUp.nextFollowUpAt = new Date(scheduledAt);
    await customer.save();

    await AuditLog.create({
      action: 'FOLLOWUP_SCHEDULED',
      performedBy: req.user?.name || 'ADMIN',
      entityType: 'FollowUp',
      entityId: followUp._id,
      details: { customerId, scheduledAt, reason }
    });

    res.status(201).json({ success: true, data: followUp });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/followups/:id
exports.updateFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }

    res.json({ success: true, data: followUp });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/followups/:id
exports.deleteFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findByIdAndDelete(req.params.id);
    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }
    res.json({ success: true, message: 'Follow-up cancelled/deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

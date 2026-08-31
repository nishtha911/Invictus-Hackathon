const Customer = require('../models/Customer');
const FollowUp = require('../models/FollowUp');
const Call = require('../models/Call');

// GET /api/analytics/dashboard
exports.getDashboardMetrics = async (req, res) => {
  try {
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Parallel metric aggregations
    const [
      totalCustomers,
      dueTodayFollowUps,
      callsInitiated,
      answeredCalls,
      missedCalls,
      interestedCustomers,
      callbackRequests,
      documentsSubmitted,
      humanEscalations,
      conversions
    ] = await Promise.all([
      Customer.countDocuments({}),
      FollowUp.countDocuments({
        scheduledAt: { $gte: startOfToday, $lte: endOfToday },
        status: { $in: ['SCHEDULED', 'READY', 'CALLING'] }
      }),
      Call.countDocuments({}),
      Call.countDocuments({ status: 'COMPLETED' }),
      Call.countDocuments({ status: { $in: ['NO_ANSWER', 'BUSY', 'FAILED'] } }),
      Customer.countDocuments({ customerStatus: 'INTERESTED' }),
      Customer.countDocuments({ customerStatus: 'CALLBACK_REQUESTED' }),
      Customer.countDocuments({ customerStatus: 'DOCUMENTS_SUBMITTED' }),
      FollowUp.countDocuments({ status: 'REQUIRES_HUMAN' }),
      Customer.countDocuments({ customerStatus: 'CONVERTED' })
    ]);

    // Customer status breakdown for charts
    const statusBreakdown = await Customer.aggregate([
      { $group: { _id: '$customerStatus', count: { $sum: 1 } } }
    ]);

    // Loan type breakdown
    const loanTypeBreakdown = await Customer.aggregate([
      { $group: { _id: '$loan.type', count: { $sum: 1 }, totalAmount: { $sum: '$loan.amount' } } }
    ]);

    // Recent Call Logs
    const recentCalls = await Call.find({})
      .populate('customerId', 'name phone customerStatus loan')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          dueTodayFollowUps,
          callsInitiated,
          answeredCalls,
          missedCalls,
          interestedCustomers,
          callbackRequests,
          documentsSubmitted,
          humanEscalations,
          conversions,
          conversionRate: totalCustomers > 0 ? ((conversions / totalCustomers) * 100).toFixed(1) : 0
        },
        statusBreakdown: statusBreakdown.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        loanTypeBreakdown,
        recentCalls
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

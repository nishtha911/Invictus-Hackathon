const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: String,
      default: 'SYSTEM'
    },
    entityType: {
      type: String,
      enum: ['Customer', 'FollowUp', 'Call', 'AITool', 'Webhook'],
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);

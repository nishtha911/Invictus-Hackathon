const express = require('express');
const router = express.Router();
const aiToolController = require('../controllers/aiToolController');

router.post('/customer', aiToolController.getCustomerProfile);
router.post('/update-status', aiToolController.updateCustomerStatus);
router.post('/update-document', aiToolController.updateDocumentStatus);
router.post('/update-intent', aiToolController.updateCustomerIntent);
router.post('/schedule-followup', aiToolController.scheduleFollowUp);
router.post('/human-escalation', aiToolController.requestHumanAgent);
router.post('/call-outcome', aiToolController.updateCallOutcome);

module.exports = router;

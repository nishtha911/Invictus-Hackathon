const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

router.post('/webhook', webhookController.handleGeneralWebhook);
router.post('/call-status', webhookController.handleCallStatus);
router.post('/call-ended', webhookController.handleCallEnded);

module.exports = router;

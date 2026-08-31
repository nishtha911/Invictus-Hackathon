const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');

router.get('/', callController.getCalls);
router.get('/web-config/:customerId', callController.getWebCallConfig);
router.post('/complete-web-call', callController.completeWebCall);
router.post('/tts', callController.generateTTS);
router.post('/web-conversation', callController.processWebConversationTurn);
router.get('/:id', callController.getCallById);
router.post('/initiate', callController.initiateCall);

module.exports = router;

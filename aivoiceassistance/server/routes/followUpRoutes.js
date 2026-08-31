const express = require('express');
const router = express.Router();
const followUpController = require('../controllers/followUpController');

router.get('/', followUpController.getFollowUps);
router.get('/:id', followUpController.getFollowUpById);
router.post('/', followUpController.createFollowUp);
router.put('/:id', followUpController.updateFollowUp);
router.delete('/:id', followUpController.deleteFollowUp);

module.exports = router;

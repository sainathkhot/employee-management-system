const express = require('express');
const { protect } = require('../middleware/auth');
const organizationController = require('../controllers/organizationController');

const router = express.Router();

router.use(protect);
router.get('/tree', organizationController.getTree);

module.exports = router;

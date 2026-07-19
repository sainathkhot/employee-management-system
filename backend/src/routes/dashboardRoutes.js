const express = require('express');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.use(protect);
router.get('/stats', allowRoles('SUPER_ADMIN', 'HR_MANAGER'), dashboardController.getStats);

module.exports = router;

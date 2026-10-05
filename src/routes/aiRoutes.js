const router = require('express').Router();
const { generateFAQ, answer } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate-faq', protect, generateFAQ);
router.post('/answer', protect, answer);

module.exports = router;

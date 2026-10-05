const router = require('express').Router();
const c = require('../controllers/faqController');
const { protect } = require('../middleware/authMiddleware');

// Public
router.get('/', c.getFAQs);
router.get('/search', c.searchFAQs);        // must stay above /:id
router.get('/categories', c.getCategories); // must stay above /:id
router.get('/:id', c.getFAQById);

// Protected (owner or admin for update/delete)
router.post('/', protect, c.createFAQ);
router.put('/:id', protect, c.updateFAQ);
router.delete('/:id', protect, c.deleteFAQ);

module.exports = router;

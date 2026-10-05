const FAQ = require('../models/FAQ');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const canModify = (faq, user) =>
  user.role === 'admin' || faq.createdBy.toString() === user._id.toString();

exports.createFAQ = async (req, res, next) => {
  try {
    const { question, answer, category } = req.body;
    const faq = await FAQ.create({ question, answer, category, createdBy: req.user._id });
    res.status(201).json({ success: true, data: faq });
  } catch (err) {
    next(err);
  }
};

exports.getFAQs = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const filter = req.query.category
      ? { category: new RegExp(`^${escapeRegex(String(req.query.category))}$`, 'i') }
      : {};
    const [data, total] = await Promise.all([
      FAQ.find(filter)
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      FAQ.countDocuments(filter),
    ]);
    res.json({ success: true, count: data.length, total, page, data });
  } catch (err) {
    next(err);
  }
};

exports.searchFAQs = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      res.status(400);
      throw new Error('Query parameter "q" is required');
    }
    const terms = q.split(/\s+/).map(escapeRegex);
    const orClauses = terms.flatMap((t) => {
      const rx = new RegExp(t, 'i');
      return [{ question: rx }, { answer: rx }, { category: rx }];
    });
    const results = await FAQ.find({ $or: orClauses }).populate('createdBy', 'name').limit(50);

    // Rank by number of matching terms (simple relevance score)
    const scored = results
      .map((f) => {
        const hay = `${f.question} ${f.answer} ${f.category}`.toLowerCase();
        const score = terms.filter((t) => new RegExp(t, 'i').test(hay)).length;
        return { faq: f, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((s) => s.faq);

    res.json({ success: true, count: scored.length, data: scored });
  } catch (err) {
    next(err);
  }
};

exports.getFAQById = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id).populate('createdBy', 'name');
    if (!faq) {
      res.status(404);
      throw new Error('FAQ not found');
    }
    res.json({ success: true, data: faq });
  } catch (err) {
    next(err);
  }
};

exports.updateFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) {
      res.status(404);
      throw new Error('FAQ not found');
    }
    if (!canModify(faq, req.user)) {
      res.status(403);
      throw new Error('Only the original author or an admin can update this FAQ');
    }
    ['question', 'answer', 'category'].forEach((f) => {
      if (req.body[f] !== undefined) faq[f] = req.body[f];
    });
    await faq.save();
    res.json({ success: true, data: faq });
  } catch (err) {
    next(err);
  }
};

exports.deleteFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) {
      res.status(404);
      throw new Error('FAQ not found');
    }
    if (!canModify(faq, req.user)) {
      res.status(403);
      throw new Error('Only the original author or an admin can delete this FAQ');
    }
    await faq.deleteOne();
    res.json({ success: true, message: 'FAQ deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const cats = await FAQ.aggregate([
      { $group: { _id: '$category', totalFAQs: { $sum: 1 } } },
      { $project: { _id: 0, categoryName: '$_id', totalFAQs: 1 } },
      { $sort: { categoryName: 1 } },
    ]);
    res.json({ success: true, count: cats.length, data: cats });
  } catch (err) {
    next(err);
  }
};

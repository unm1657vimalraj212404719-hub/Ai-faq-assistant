const FAQ = require('../models/FAQ');
const ai = require('../services/aiService');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const badRequest = (res, msg) => {
  res.status(400);
  return new Error(msg);
};

const aiFailure = (res, err) => {
  if (err.status >= 400) res.status(err.status);
  else if (res.statusCode < 400) res.status(502);
  if (err instanceof SyntaxError) err.message = 'AI returned an unreadable response';
  return err;
};

// POST /api/ai/generate-faq  { topic, save?: boolean }
exports.generateFAQ = async (req, res, next) => {
  const topic = String(req.body.topic || '').trim();
  if (!topic) return next(badRequest(res, 'Topic is required'));
  try {
    const generated = await ai.generateFAQ(topic);
    let saved = null;
    if (req.body.save === true) {
      saved = await FAQ.create({
        question: generated.generatedQuestion,
        answer: generated.generatedAnswer,
        category: generated.generatedCategory,
        createdBy: req.user._id,
      });
    }
    res.json({ success: true, generated, saved });
  } catch (err) {
    next(err.name === 'ValidationError' ? err : aiFailure(res, err));
  }
};

// POST /api/ai/answer  { question }
exports.answer = async (req, res, next) => {
  const question = String(req.body.question || '').trim();
  if (!question) return next(badRequest(res, 'Question is required'));
  try {
    const terms = question.split(/\s+/).filter((t) => t.length > 3).map(escapeRegex);
    const context = terms.length
      ? await FAQ.find({
          $or: terms.flatMap((t) => [{ question: new RegExp(t, 'i') }, { answer: new RegExp(t, 'i') }]),
        }).limit(5)
      : [];
    const answer = await ai.answerQuestion(question, context);
    res.json({ success: true, answer, basedOn: context.map((f) => f._id) });
  } catch (err) {
    next(aiFailure(res, err));
  }
};

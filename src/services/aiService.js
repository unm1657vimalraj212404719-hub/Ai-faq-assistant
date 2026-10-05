const { GoogleGenAI } = require('@google/genai');

let client;
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    const e = new Error('GEMINI_API_KEY is not configured');
    e.status = 503;
    throw e;
  }
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
};

const MODEL = () => process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const parseJSON = (text) => JSON.parse(String(text || '').replace(/```json|```/g, '').trim());

exports.generateFAQ = async (topic) => {
  const prompt = `You are a customer support documentation expert.
Create ONE FAQ entry about the topic below.
Respond ONLY with JSON in this exact shape, no extra text:
{"question": "...", "answer": "...", "category": "..."}
Keep the answer clear and under 120 words; category is a short 1-3 word label.

Topic: ${topic}`;

  const response = await getClient().models.generateContent({
    model: MODEL(),
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  const data = parseJSON(response.text);
  if (!data.question || !data.answer || !data.category) {
    const e = new Error('AI returned an incomplete FAQ');
    e.status = 502;
    throw e;
  }
  return {
    topic,
    generatedQuestion: data.question,
    generatedAnswer: data.answer,
    generatedCategory: data.category,
    generatedAt: new Date(),
  };
};

exports.answerQuestion = async (question, context = []) => {
  const ctx = context.length
    ? context.map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`).join('\n')
    : 'No existing FAQs matched.';
  const prompt = `You are a helpful support assistant. Use the FAQ context if relevant; otherwise answer from general knowledge and say so briefly. Be concise.

FAQ context:
${ctx}

User question: ${question}`;

  const response = await getClient().models.generateContent({ model: MODEL(), contents: prompt });
  return response.text;
};

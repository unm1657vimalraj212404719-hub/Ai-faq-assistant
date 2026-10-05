const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const faqRoutes = require('./routes/faqRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ success: true, message: 'AI FAQ Assistant API is running' }));

app.use('/api/auth', authRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

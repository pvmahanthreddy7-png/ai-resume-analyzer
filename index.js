const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: false
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  family: 4
})
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch((err) => console.log('Error connecting:', err));

// Routes
const resumeRouter = require('./routes/resume');
const authRouter = require('./routes/auth');

app.use('/api/resume', resumeRouter);
app.use('/api/auth', authRouter);

app.get('/', (req, res) => {
  res.send('AI Resume Analyzer API is running!');
});

app.get('/debug', (req, res) => {
  const Groq = require('groq-sdk');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: 'Say hi' }],
    max_tokens: 10
  }).then(r => res.json({ success: true, response: r.choices[0].message.content }))
    .catch(e => res.json({ success: false, error: e.message }));
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
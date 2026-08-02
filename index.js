const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'https://ai-resume-frontend-bq67.vercel.app', 'https://ai-resume-frontend-chi.vercel.app'],
  credentials: true
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
  res.json({ 
    groqKey: process.env.GROQ_API_KEY ? 'Key exists: ' + process.env.GROQ_API_KEY.substring(0, 10) : 'No key found'
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors());
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
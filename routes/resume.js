const express = require('express');
const router = express.Router();
const multer = require('multer');
const Groq = require('groq-sdk');
const PDFParser = require('pdf2json');
const Resume = require('../models/Resume');
const authMiddleware = require('../middleware/auth');

// Groq setup
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'));
    }
  }
});

// Extract text from PDF
function extractTextFromPDF(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      try {
        let text = '';
        pdfData.Pages.forEach(page => {
          page.Texts.forEach(textItem => {
            textItem.R.forEach(r => {
              text += decodeURIComponent(r.T) + ' ';
            });
          });
          text += '\n';
        });
        resolve(text);
      } catch (err) {
        reject(err);
      }
    });

    pdfParser.on('pdfParser_dataError', (err) => {
      reject(new Error(err.parserError));
    });

    pdfParser.parseBuffer(buffer);
  });
}

// POST analyze resume
router.post('/analyze', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    const jobRole = req.body.jobRole || 'Software Developer';

    // Extract text
    let extractedText = '';
    try {
      extractedText = await extractTextFromPDF(req.file.buffer);
    } catch (pdfErr) {
      console.log('PDF Error:', pdfErr.message);
      return res.status(400).json({ message: 'Could not read PDF: ' + pdfErr.message });
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return res.status(400).json({ message: 'Could not extract text from PDF' });
    }

    // Send to Groq AI
    const prompt = `
    You are an expert resume analyzer. Analyze the following resume for a ${jobRole} position.
    
    Resume Text:
    ${extractedText.substring(0, 3000)}
    
    Provide analysis in this JSON format only:
    {
      "score": (number 0-100),
      "strengths": ["strength1", "strength2", "strength3"],
      "weaknesses": ["weakness1", "weakness2", "weakness3"],
      "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
      "missingSkills": ["skill1", "skill2", "skill3"],
      "experienceLevel": "Junior/Mid/Senior",
      "summary": "Brief summary"
    }
    Return ONLY the raw JSON object. No markdown, no backticks, no explanation. Just the JSON.
    `;

    const completion = await groq.chat.completions.create({
       model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000
    });

    const aiResponse = completion.choices[0].message.content;
    const cleanResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
const analysis = JSON.parse(cleanResponse);

    const resume = new Resume({
      user: req.userId,
      fileName: req.file.originalname,
      extractedText,
      analysis,
      jobRole
    });

    await resume.save();

    res.status(201).json({
      message: 'Resume analyzed successfully',
      analysis,
      resumeId: resume._id
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET my resumes
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.userId })
      .select('-extractedText')
      .sort({ createdAt: -1 });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single resume
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
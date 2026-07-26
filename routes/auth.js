const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'resume_secret_key',
      { expiresIn: '24h' }
    );

    res.json({ token, message: 'Login successful' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
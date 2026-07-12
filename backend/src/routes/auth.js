const express = require('express');
const authRouter = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {protect} = require('../middlewares/auth');

authRouter.post("/signup",async (req, res) => {
  try {
    const { name, email, password, department } = req.body;
 
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
 
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
 
    const hashedPassword = await bcrypt.hash(password, 10);
 
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      department: department || null,
      role: 'employee',
    });
 
    const token =  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });

    res.cookie("token",token);
 
    return res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Signup failed.', error: err.message });
  }
})

authRouter.post("/login",async (req, res) => {
  try {
    const { email, password } = req.body;
 
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
 
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    if (user.status === 'Inactive') {
      return res.status(403).json({ message: 'This account has been deactivated.' });
    }
 
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
 
    const token =  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
 
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed.', error: err.message });
  }
})

authRouter.get('/me', protect, async (req, res) => {
  return res.json({ user: req.user });
});

module.exports = authRouter;
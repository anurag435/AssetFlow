const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

exports.signup = async (req, res) => {
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
      role: 'employee',
    });
 
    const token =  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });

    res.cookie("token",token,{
      httpOnly: true,
      secure: true,  
      sameSite: "none",    
      maxAge: 24 * 60 * 60 * 1000,
    });
 
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
}

exports.login = async (req, res) => {
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
    res.cookie("token",token,{
      httpOnly: true,
      secure: true,      
      sameSite: "none",    
      maxAge: 24 * 60 * 60 * 1000, 
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
}

exports.getMe = async (req, res) => {
  return res.json({ user: req.user });
};

exports.logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res.json({ message: 'Logged out successfully.' });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
 
    if (user) {
      const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
      console.log(`[DEV ONLY] Password reset token for ${user.email}: ${resetToken}`);
      // TODO: email this link instead of logging it, e.g. via nodemailer
    }
 
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    return res.status(500).json({ message: 'Request failed.', error: err.message });
  }
};
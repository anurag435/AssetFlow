const express = require('express');
const authRouter = express.Router();
const { signup, login, getMe, logout, forgotPassword } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

authRouter.post("/signup",signup)
authRouter.post("/login",login)
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/logout', protect, logout);
authRouter.get('/me', protect, getMe);

module.exports = authRouter;
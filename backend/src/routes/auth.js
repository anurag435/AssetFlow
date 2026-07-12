const express = require('express');
const authRouter = express.Router();
const { signup, login, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

authRouter.post("/signup",signup)
authRouter.post("/login",login)
authRouter.get('/me', protect, getMe);

module.exports = authRouter;
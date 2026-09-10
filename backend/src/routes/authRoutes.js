const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, resetPassword, checkUsername, setUsername, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/check-username', checkUsername);
router.patch('/set-username', protect, setUsername);
router.delete('/account', protect, deleteAccount);

module.exports = router;

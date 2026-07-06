import express from 'express';
const router = express.Router();
import {
  registerUser,
  profile,
  loginUser,
  logOutUser,
} from '../controllers/authControllers.js';
router.post('/register', registerUser);

router.post('/login', loginUser);

router.post('/logout', logOutUser);

router.get('/profile', profile);

export default router;

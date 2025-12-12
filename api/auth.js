import express from 'express';
import { login } from '../routes/authController.js';

const router = express.Router();

// POST /login
router.post('/', login);

export default router;


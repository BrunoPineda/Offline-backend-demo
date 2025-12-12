import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  sync,
  syncPush
} from '../routes/syncController.js';

const router = express.Router();

// POST /sync - Sincronizar cambios
router.post('/', authenticateToken, sync);

// POST /sync/push - Enviar cambios del cliente al servidor
router.post('/push', authenticateToken, syncPush);

export default router;


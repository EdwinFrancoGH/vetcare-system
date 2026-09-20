import { Router } from 'express';
import { syncUser } from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Endpoint para sincronizar un usuario nuevo.
// Ojo: Primero pasa por verifyToken para asegurar que la petición viene de un usuario logueado en Firebase
router.post('/sync', verifyToken, syncUser);

export default router;

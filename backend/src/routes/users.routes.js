import express from 'express';
import { verifyToken, verifyAdmin } from '../middlewares/auth.middleware.js';
import { getUsers, updateUserRole, deleteUser, createUser, updateUser, updateProfile } from '../controllers/users.controller.js';

const router = express.Router();

// Todas las rutas de usuarios requieren estar autenticado
router.use(verifyToken);

// Rutas que no requieren admin (pero sí autenticación)
router.put('/profile', updateProfile);

// Todas las rutas debajo requieren ser Admin
router.use(verifyAdmin);

// Rutas
router.get('/', getUsers);
router.post('/', createUser);
router.put('/:uid', updateUser);
router.patch('/:uid/role', updateUserRole);
router.delete('/:uid', deleteUser);

export default router;

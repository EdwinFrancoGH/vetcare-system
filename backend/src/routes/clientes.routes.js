import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { getClientes, createCliente, updateCliente, deleteCliente } from '../controllers/clientes.controller.js';

const router = express.Router();

// Todas las rutas de clientes requieren estar autenticado
router.use(verifyToken);

// Rutas CRUD
router.get('/', getClientes);
router.post('/', createCliente);
router.put('/:id', updateCliente);
router.delete('/:id', deleteCliente);

export default router;

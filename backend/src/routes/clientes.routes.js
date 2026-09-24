import express from 'express';
import { verifyToken, verifyRoles } from '../middlewares/auth.middleware.js';
import { getClientes, createCliente, updateCliente, deleteCliente } from '../controllers/clientes.controller.js';

const router = express.Router();

// Todas las rutas de clientes requieren estar autenticado, y son de
// gestión de front-desk: un "Cliente" (dueño de mascota autenticado) no
// debe poder listar ni editar los datos de contacto de otros clientes.
router.use(verifyToken);
router.use(verifyRoles('Administrador', 'Recepcionista'));

// Rutas CRUD
router.get('/', getClientes);
router.post('/', createCliente);
router.put('/:id', updateCliente);
router.delete('/:id', deleteCliente);

export default router;

import { db } from '../config/firebase.js';

// Obtener todos los clientes
export const getClientes = async (req, res) => {
    try {
        const clientesSnapshot = await db.collection('clientes').get();
        const clientes = [];

        clientesSnapshot.forEach((doc) => {
            clientes.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.status(200).json(clientes);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
};

// Crear un nuevo cliente
export const createCliente = async (req, res) => {
    try {
        const { nombre, telefono, correo, direccion } = req.body;

        if (!nombre || !telefono) {
            return res.status(400).json({ error: 'El nombre y teléfono son obligatorios' });
        }

        const correoLimpio = typeof correo === 'string' ? correo.trim() : '';
        const correoNormalized = correoLimpio.toLowerCase();
        const clientesRef = db.collection('clientes');
        const clienteRef = clientesRef.doc();
        const nuevoCliente = {
            nombre,
            telefono,
            correo: correoLimpio,
            correoNormalized,
            direccion: direccion || '',
            createdAt: new Date().toISOString()
        };

        const clienteGuardado = await db.runTransaction(async (transaction) => {
            let uid = null;
            if (correoNormalized) {
                const usuarios = await transaction.get(
                    db.collection('usuarios').where('emailNormalized', '==', correoNormalized)
                );
                const usuarioVerificado = usuarios.docs.find((doc) =>
                    doc.data().emailVerified === true && doc.data().role === 'Cliente'
                );
                if (usuarioVerificado) {
                    const clienteExistente = await transaction.get(
                        db.collection('clientes').where('uid', '==', usuarioVerificado.id)
                    );
                    if (clienteExistente.empty) uid = usuarioVerificado.id;
                }
            }

            const datos = { ...nuevoCliente, ...(uid ? { uid } : {}) };
            transaction.create(clienteRef, datos);
            return datos;
        });

        res.status(201).json({
            message: 'Cliente creado exitosamente',
            cliente: { id: clienteRef.id, ...clienteGuardado }
        });
    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
};

// Actualizar un cliente existente
export const updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono, correo, direccion } = req.body;

        if (!nombre || !telefono) {
            return res.status(400).json({ error: 'El nombre y teléfono son obligatorios' });
        }

        const correoLimpio = typeof correo === 'string' ? correo.trim() : '';
        const updateData = {
            nombre,
            telefono,
            correo: correoLimpio,
            correoNormalized: correoLimpio.toLowerCase(),
            direccion: direccion || '',
            updatedAt: new Date().toISOString()
        };

        await db.collection('clientes').doc(id).update(updateData);

        res.status(200).json({
            message: 'Cliente actualizado exitosamente',
            cliente: { id, ...updateData }
        });
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
};

// Eliminar un cliente
export const deleteCliente = async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('clientes').doc(id).delete();
        res.status(200).json({ message: 'Cliente eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
};

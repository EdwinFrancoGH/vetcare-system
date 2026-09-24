import { auth, db } from '../config/firebase.js';

// Obtener todos los usuarios
export const getUsers = async (req, res) => {
    try {
        const usersSnapshot = await db.collection('usuarios').get();
        const users = [];
        
        usersSnapshot.forEach((doc) => {
            users.push({
                uid: doc.id,
                ...doc.data()
            });
        });

        res.status(200).json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
};

// Crear un nuevo usuario (Solo Admin)
export const createUser = async (req, res) => {
    try {
        const { email, password, role, name } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        if (!['Administrador', 'Recepcionista', 'Veterinario', 'Cliente'].includes(role)) {
            return res.status(400).json({ error: 'Rol inválido' });
        }

        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name || email.split('@')[0],
        });

        const newUser = {
            email,
            name: name || email.split('@')[0],
            role,
            createdAt: new Date().toISOString()
        };

        await db.collection('usuarios').doc(userRecord.uid).set(newUser);

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            user: { uid: userRecord.uid, ...newUser }
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ error: 'Error al crear usuario', details: error.message });
    }
};

// Actualizar el rol de un usuario
export const updateUserRole = async (req, res) => {
    try {
        const { uid } = req.params;
        const { role } = req.body;

        if (!role || !['Administrador', 'Recepcionista', 'Veterinario', 'Cliente'].includes(role)) {
            return res.status(400).json({ error: 'Rol inválido o no proporcionado' });
        }

        if (req.user.uid === uid) {
            return res.status(403).json({ error: 'No puedes cambiar tu propio rol por razones de seguridad' });
        }

        await db.collection('usuarios').doc(uid).update({ role });

        res.status(200).json({ message: 'Rol de usuario actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar rol de usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
};

// Eliminar un usuario
export const deleteUser = async (req, res) => {
    try {
        const { uid } = req.params;

        if (req.user.uid === uid) {
            return res.status(403).json({ error: 'No puedes eliminar tu propia cuenta' });
        }

        await auth.deleteUser(uid);

        await db.collection('usuarios').doc(uid).delete();

        res.status(200).json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
};

// Actualizar un usuario existente
export const updateUser = async (req, res) => {
    try {
        const { uid } = req.params;
        const { email, name, role, password } = req.body;

        if (!email || !name || !role) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        if (!['Administrador', 'Recepcionista', 'Veterinario', 'Cliente'].includes(role)) {
            return res.status(400).json({ error: 'Rol inválido' });
        }

        if (req.user.uid === uid && role !== 'Administrador') {
            return res.status(403).json({ error: 'No puedes quitarte el rol de Administrador a ti mismo' });
        }

        const updateDataAuth = {
            email,
            displayName: name
        };
        
        if (password && password.length >= 6) {
            updateDataAuth.password = password;
        }

        await auth.updateUser(uid, updateDataAuth);

        const updateDataFirestore = {
            email,
            name,
            role,
            updatedAt: new Date().toISOString()
        };

        await db.collection('usuarios').doc(uid).update(updateDataFirestore);

        res.status(200).json({
            message: 'Usuario actualizado exitosamente',
            user: { uid, ...updateDataFirestore }
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ error: 'Error al actualizar usuario', details: error.message });
    }
};

// Actualizar perfil propio (No requiere ser admin, pero no puede cambiar rol)
// Acepta name/password (como antes) y, opcionalmente, photoURL: una foto de
// perfil ya redimensionada y codificada en base64 por el frontend
// (ver frontend/src/utils/image.js). Se guarda directo en el documento de
// Firestore del usuario porque el proyecto no usa Firebase Storage.
export const updateProfile = async (req, res) => {
    try {
        const uid = req.user.uid;
        const { name, password, photoURL } = req.body;

        if (!name && !password && photoURL === undefined) {
            return res.status(400).json({ error: 'No hay datos para actualizar' });
        }

        // Límite de seguridad extra además del límite de Express: una
        // imagen en base64 nunca debería superar ~1.5MB (Firestore limita
        // cada documento a 1MiB en total).
        if (photoURL && photoURL.length > 1_500_000) {
            return res.status(400).json({ error: 'La imagen es demasiado grande.' });
        }

        // 1. Actualizar en Firebase Auth (solo si cambia nombre o contraseña)
        if (name || (password && password.length >= 6)) {
            const updateDataAuth = {};

            if (name) {
                updateDataAuth.displayName = name;
            }

            if (password && password.length >= 6) {
                updateDataAuth.password = password;
            }

            await auth.updateUser(uid, updateDataAuth);
        }

        // 2. Actualizar en Firestore
        const updateDataFirestore = {
            updatedAt: new Date().toISOString()
        };

        if (name) {
            updateDataFirestore.name = name;
        }

        if (photoURL !== undefined) {
            updateDataFirestore.photoURL = photoURL;
        }

        await db.collection('usuarios').doc(uid).update(updateDataFirestore);

        res.status(200).json({
            message: 'Perfil actualizado exitosamente',
            user: updateDataFirestore
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error al actualizar perfil', details: error.message });
    }
};

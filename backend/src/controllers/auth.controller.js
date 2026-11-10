import { db } from '../config/firebase.js';

export const syncUser = async (req, res) => {
    try {
        // En este punto, req.user viene del middleware verifyToken
        const { uid, email } = req.user;
        const { name } = req.body; // El frontend puede enviar datos extras en el body
        const emailVerified = req.user.email_verified === true;

        // Referencia al documento del usuario en la colección 'usuarios'
        const userRef = db.collection('usuarios').doc(uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            // Actualizamos emailVerified en Firestore si cambió tras la verificación
            const updates = {
                emailVerified,
                updatedAt: new Date().toISOString()
            };

            if (name && !userDoc.data().name) {
                updates.name = name;
            }

            await userRef.update(updates);

            return res.status(200).json({ 
                message: 'El usuario ya existe en Firestore',
                user: { ...userDoc.data(), ...updates }
            });
        }

        // Si es la primera vez (registro), lo creamos con el rol por defecto.
        // Cualquiera que se auto-registre desde /register entra como
        // "Cliente" (dueño de mascota). Los roles de staff (Administrador,
        // Recepcionista, Veterinario) solo los puede asignar un
        // Administrador ya existente, desde /usuarios (ver
        // users.controller.js -> createUser / updateUserRole).
        const newUserData = {
            uid,
            email,
            name: name || '',
            role: 'Cliente', // Rol por defecto
            emailVerified,
            createdAt: new Date().toISOString(),
            status: 'Active'
        };

        await userRef.set(newUserData);

        return res.status(201).json({ 
            message: 'Usuario sincronizado correctamente en Firestore',
            user: newUserData
        });

    } catch (error) {
        console.error('Error sincronizando usuario:', error);
        return res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
};

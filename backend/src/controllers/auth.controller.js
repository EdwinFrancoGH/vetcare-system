import { db } from '../config/firebase.js';

export const syncUser = async (req, res) => {
    try {
        // En este punto, req.user viene del middleware verifyToken
        const { uid, email } = req.user;
        const { name } = req.body; // El frontend puede enviar datos extras en el body

        // Referencia al documento del usuario en la colección 'usuarios'
        const userRef = db.collection('usuarios').doc(uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            return res.status(200).json({ 
                message: 'El usuario ya existe en Firestore',
                user: userDoc.data()
            });
        }

        // Si es la primera vez (registro), lo creamos con el rol por defecto
        const newUserData = {
            uid,
            email,
            name: name || '',
            role: 'Receptionist', // Rol por defecto
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

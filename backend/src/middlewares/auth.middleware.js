import { auth, db } from '../config/firebase.js';

export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'No autorizado', 
                message: 'Token no proporcionado o formato inválido' 
            });
        }

        const token = authHeader.split('Bearer ')[1];
        
        // Verifica el token con Firebase Admin
        const decodedToken = await auth.verifyIdToken(token);
        
        // Agrega la info del usuario a la request para que los controladores la puedan usar
        req.user = decodedToken;
        
        next();
    } catch (error) {
        console.error('Error verificando token:', error);
        return res.status(401).json({ 
            error: 'No autorizado', 
            message: 'Token inválido o expirado' 
        });
    }
};

export const verifyAdmin = async (req, res, next) => {
    try {
        // Asume que verifyToken ya se ejecutó y req.user existe
        if (!req.user || !req.user.uid) {
            return res.status(401).json({ error: 'No autorizado', message: 'Usuario no autenticado' });
        }

        const userDoc = await db.collection('usuarios').doc(req.user.uid).get();
        
        if (!userDoc.exists || userDoc.data().role !== 'Administrador') {
            return res.status(403).json({ 
                error: 'Prohibido', 
                message: 'No tienes permisos de administrador para realizar esta acción' 
            });
        }

        next();
    } catch (error) {
        console.error('Error verificando rol de administrador:', error);
        return res.status(500).json({ 
            error: 'Error del servidor', 
            message: 'No se pudo verificar el rol del usuario' 
        });
    }
};

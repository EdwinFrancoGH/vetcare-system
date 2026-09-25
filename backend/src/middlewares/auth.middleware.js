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

// Middleware genérico de autorización por rol. Se usa después de
// verifyToken, ej: verifyRoles('Administrador', 'Recepcionista').
// A diferencia de verifyAdmin (fijo a un solo rol), esta acepta una
// lista, para módulos que varios roles de staff pueden usar pero que
// un "Cliente" no debe ver (clientes, ventas, inventario, reportes,
// mascotas/historiales/vacunas de TODA la clínica, etc.).
export const verifyRoles = (...rolesPermitidos) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.uid) {
                return res.status(401).json({ error: 'No autorizado', message: 'Usuario no autenticado' });
            }

            const userDoc = await db.collection('usuarios').doc(req.user.uid).get();

            if (!userDoc.exists || !rolesPermitidos.includes(userDoc.data().role)) {
                return res.status(403).json({
                    error: 'Prohibido',
                    message: 'No tienes permisos para acceder a este recurso'
                });
            }

            req.userRole = userDoc.data().role;
            next();
        } catch (error) {
            console.error('Error verificando rol del usuario:', error);
            return res.status(500).json({
                error: 'Error del servidor',
                message: 'No se pudo verificar el rol del usuario'
            });
        }
    };
};

// Carga el rol del usuario (cualquier rol, incluido "Cliente") en
// req.userRole SIN restringir el acceso. Se usa en módulos que comparten
// personal y clientes (mascotas, citas), donde el controlador decide qué
// datos devolver según el rol: el personal ve todo, un Cliente solo lo suyo.
export const cargarRol = async (req, res, next) => {
    try {
        if (!req.user || !req.user.uid) {
            return res.status(401).json({ error: 'No autorizado', message: 'Usuario no autenticado' });
        }

        const userDoc = await db.collection('usuarios').doc(req.user.uid).get();

        if (!userDoc.exists) {
            return res.status(403).json({
                error: 'Prohibido',
                message: 'Tu usuario no está registrado en el sistema'
            });
        }

        req.userRole = userDoc.data().role;
        req.userData = userDoc.data();
        next();
    } catch (error) {
        console.error('Error cargando rol del usuario:', error);
        return res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudo verificar el rol del usuario'
        });
    }
};

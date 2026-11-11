import { db } from '../config/firebase.js';

const ROLES_VALIDOS = ['Administrador', 'Recepcionista', 'Veterinario', 'Cliente'];

export const syncUser = async (req, res) => {
    try {
        const { uid } = req.user;
        const email = typeof req.user.email === 'string' ? req.user.email.trim() : '';
        const emailNormalized = email.toLowerCase();
        const nombreSolicitado = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
        const name = nombreSolicitado || req.user.name || '';
        const userRef = db.collection('usuarios').doc(uid);
        const emailVerificado = req.user.email_verified === true;

        const resultado = await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const existente = userDoc.exists ? userDoc.data() : {};
            const rolExistente = ROLES_VALIDOS.includes(existente.role) ? existente.role : 'Cliente';
            let clientesCoincidentes = [];

            // Solo un correo verificado puede vincular una ficha de cliente
            // creada previamente por recepción. Nunca se cambia un UID ya
            // asociado a otra cuenta.
            if (emailVerificado && emailNormalized && rolExistente === 'Cliente') {
                const clientesRef = db.collection('clientes');
                const vinculados = await transaction.get(clientesRef.where('uid', '==', uid));
                clientesCoincidentes = vinculados.docs;

                if (clientesCoincidentes.length === 0) {
                    const porCorreoNormalizado = await transaction.get(
                        clientesRef.where('correoNormalized', '==', emailNormalized)
                    );
                    clientesCoincidentes = porCorreoNormalizado.docs;

                    if (clientesCoincidentes.length === 0) {
                        const porCorreoLegacy = await transaction.get(
                            clientesRef.where('correo', '==', email)
                        );
                        clientesCoincidentes = porCorreoLegacy.docs;
                    }
                }
            }

            const datosUsuario = {
                uid,
                email,
                emailNormalized,
                emailVerified: emailVerificado,
                name: name || existente.name || '',
                role: userDoc.exists ? rolExistente : 'Cliente',
                status: existente.status || 'Active',
                createdAt: existente.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            let clienteVinculado = null;
            if (clientesCoincidentes.length === 1) {
                const clienteDoc = clientesCoincidentes[0];
                const cliente = clienteDoc.data();
                if (!cliente.uid || cliente.uid === uid) {
                    transaction.update(clienteDoc.ref, {
                        uid,
                        correoNormalized: emailNormalized,
                        updatedAt: new Date().toISOString()
                    });
                    clienteVinculado = clienteDoc.id;
                }
            }

            transaction.set(userRef, datosUsuario, { merge: true });
            return { user: datosUsuario, clienteId: clienteVinculado };
        });

        return res.status(200).json({
            message: 'Usuario sincronizado correctamente en Firestore',
            user: resultado.user,
            ...(resultado.clienteId ? { clienteId: resultado.clienteId } : {})
        });
    } catch (error) {
        console.error('Error sincronizando usuario:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

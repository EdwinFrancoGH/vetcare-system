import { GoogleAuthProvider, signInWithPopup, type UserCredential } from 'firebase/auth';

import { auth } from '@/config/firebase';

// Versión WEB del login con Google: en el navegador se usa la ventana
// emergente de Firebase directamente (no hace falta la página puente).
// Requiere que "localhost" esté en Authentication > Configuración >
// Dominios autorizados (viene agregado por defecto).

export class GoogleLoginCanceladoError extends Error {
  constructor() {
    super('Inicio de sesión con Google cancelado.');
    this.name = 'GoogleLoginCanceladoError';
  }
}

export async function iniciarSesionConGoogle(): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    return await signInWithPopup(auth, provider);
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      throw new GoogleLoginCanceladoError();
    }
    if (error?.code === 'auth/popup-blocked') {
      throw new Error('El navegador bloqueó la ventana de Google. Permite las ventanas emergentes e intenta de nuevo.');
    }
    throw error;
  }
}

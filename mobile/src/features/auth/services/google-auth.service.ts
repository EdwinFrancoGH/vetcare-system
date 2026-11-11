import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential, type UserCredential } from 'firebase/auth';

import { auth } from '@/config/firebase';

// ============================================================
// LOGIN CON GOOGLE PARA EXPO GO
// ============================================================
//
// Expo Go no permite el login nativo de Google, por eso se usa este flujo:
//
// 1. La app abre la pantalla de Google (OAuth) en el navegador del sistema.
// 2. Google devuelve el id_token a una página HTTPS de la web en Vercel
//    (frontend/public/auth/google-mobile.html).
// 3. Esa página reenvía el id_token de regreso a la app (exp://...).
// 4. La app inicia sesión en Firebase con signInWithCredential.
//
// Variables en mobile/.env:
//   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID   -> "ID de cliente web" de Firebase
//   EXPO_PUBLIC_GOOGLE_REDIRECT_URL    -> (opcional) página puente en la web

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const REDIRECT_POR_DEFECTO = 'https://vetcare-system.vercel.app/auth/google-mobile.html';

export class GoogleLoginCanceladoError extends Error {
  constructor() {
    super('Inicio de sesión con Google cancelado.');
    this.name = 'GoogleLoginCanceladoError';
  }
}

const generarNonce = () =>
  Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join('');

// Lee el contenido (payload) de un JWT sin validarlo.
// La validación real del token la hace Firebase en signInWithCredential.
const leerPayloadJwt = (token: string): Record<string, unknown> => {
  const partes = token.split('.');
  if (partes.length !== 3) throw new Error('Google devolvió un token inválido.');

  const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
  const relleno = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return JSON.parse(atob(relleno));
};

const leerParametros = (url: string) => {
  const parametros = new URLSearchParams();
  const [, query = ''] = url.split('?');
  const [soloQuery, fragmento = ''] = query.split('#');
  new URLSearchParams(soloQuery).forEach((valor, clave) => parametros.set(clave, valor));
  new URLSearchParams(fragmento).forEach((valor, clave) => parametros.set(clave, valor));
  return parametros;
};

export async function iniciarSesionConGoogle(): Promise<UserCredential> {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error(
      'Falta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID en mobile/.env. Copia el "ID de cliente web" desde Firebase > Authentication > Google.'
    );
  }

  const redirectUri = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URL?.trim() || REDIRECT_POR_DEFECTO;

  // URL de regreso a la app. En Expo Go se ve como exp://192.168.x.x:8081/--/google-auth
  const urlRegreso = Linking.createURL('google-auth');
  const nonce = generarNonce();

  const parametros = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce,
    state: urlRegreso,
    prompt: 'select_account',
  });

  const resultado = await WebBrowser.openAuthSessionAsync(
    `${GOOGLE_AUTH_URL}?${parametros.toString()}`,
    urlRegreso
  );

  if (resultado.type !== 'success') {
    throw new GoogleLoginCanceladoError();
  }

  const respuesta = leerParametros(resultado.url);
  const errorGoogle = respuesta.get('error');
  if (errorGoogle) {
    throw new Error(
      errorGoogle === 'access_denied'
        ? 'Cancelaste el permiso de Google.'
        : `Google respondió con un error: ${errorGoogle}`
    );
  }

  const idToken = respuesta.get('id_token');
  if (!idToken) throw new Error('Google no devolvió el token de acceso.');

  // Protección: el token debe ser el de ESTA solicitud.
  if (leerPayloadJwt(idToken).nonce !== nonce) {
    throw new Error('La respuesta de Google no coincide con la solicitud. Intenta de nuevo.');
  }

  const credencial = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credencial);
}

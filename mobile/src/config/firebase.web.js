import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Versión WEB de la configuración de Firebase (Expo la usa al ejecutar
// "npx expo start" y presionar "w"). En web no existe
// getReactNativePersistence: getAuth ya guarda la sesión en el navegador.
// En Android/iOS se sigue usando src/config/firebase.js.
const firebaseConfig = {
  apiKey: "AIzaSyCnPt84vsn69D21kwViS-8NlFpqpP42lMY",
  authDomain: "vetcare-35909.firebaseapp.com",
  projectId: "vetcare-35909",
  storageBucket: "vetcare-35909.firebasestorage.app",
  messagingSenderId: "966139414695",
  appId: "1:966139414695:web:e992917523aff84881b382"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;

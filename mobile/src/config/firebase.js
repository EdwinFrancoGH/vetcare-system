import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCnPt84vsn69D21kwViS-8NlFpqpP42lMY",
  authDomain: "vetcare-35909.firebaseapp.com",
  projectId: "vetcare-35909",
  storageBucket: "vetcare-35909.firebasestorage.app",
  messagingSenderId: "966139414695",
  appId: "1:966139414695:web:e992917523aff84881b382"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export default app;

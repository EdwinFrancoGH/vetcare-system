import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

function SessionRouter() {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => onAuthStateChanged(auth, (user) => {
    const publicRoute = pathname === '/' || pathname === '/registro' || pathname === '/recuperar';
    if (!user && !publicRoute) router.replace('/');
  }), [pathname, router]);
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      <AnimatedSplashOverlay />
      <SessionRouter />

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="registro" />
        <Stack.Screen name="recuperar" />
        <Stack.Screen name="home" />
        <Stack.Screen name="explore" />
        <Stack.Screen name="cambiar-contrasena" />
        <Stack.Screen name="notificaciones" />

        {/* Módulo de Mascotas */}
        <Stack.Screen name="mascotas" />
        <Stack.Screen name="agregar-mascota" />
        <Stack.Screen name="detalle-mascota" />

        {/* Módulo de Citas */}
        <Stack.Screen name="citas" />
        <Stack.Screen name="agendar-cita" />
        <Stack.Screen name="detalle-cita" />
      </Stack>
    </ThemeProvider>
  );
}

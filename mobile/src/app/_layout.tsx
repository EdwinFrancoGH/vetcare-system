import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      <AnimatedSplashOverlay />

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="explore" />

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
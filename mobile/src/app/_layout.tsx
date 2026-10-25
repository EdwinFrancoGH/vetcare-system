import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
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
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="register" />
          <Stack.Screen name="home" />
          <Stack.Screen name="explore" />
          <Stack.Screen name="tienda" />

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
    </SafeAreaProvider>
  );
}

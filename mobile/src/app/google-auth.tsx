import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

// Pantalla de paso para el regreso desde Google (exp://.../--/google-auth).
// Expo Router abre esta ruta al recibir el enlace; la pantalla de login es la
// que termina el proceso, así que aquí solo regresamos a ella.
export default function GoogleAuthRedirectScreen() {
  const router = useRouter();

  useEffect(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

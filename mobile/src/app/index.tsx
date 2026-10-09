import { useState } from 'react';
import { useRouter } from 'expo-router';

import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { API_URL } from '@/config/api';

import { Colors } from '@/constants/theme';

const colors = Colors.light;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (!email.includes('@')) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    try {
      setLoading(true);

      console.log('================================');
      console.log('1. INICIANDO LOGIN');
      console.log('================================');

      console.log('Correo:', email.trim());

      // ==========================================
      // 1. AUTENTICACIÓN CON FIREBASE
      // ==========================================

      console.log('2. Intentando autenticar con Firebase...');

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      console.log('3. Firebase respondió correctamente');
      console.log('Usuario:', userCredential.user.email);
      console.log('UID:', userCredential.user.uid);

      // ==========================================
      // 2. OBTENER TOKEN DE FIREBASE
      // ==========================================

      console.log('4. Obteniendo token de Firebase...');

      const token = await userCredential.user.getIdToken();

      console.log('5. Token obtenido correctamente');

      // ==========================================
      // 3. CONECTAR CON BACKEND
      // ==========================================

      const url = `${API_URL}/api/auth/sync`;

      console.log('6. URL del backend:', url);
      console.log('7. Enviando petición al backend...');

      const response = await fetch(url, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          name: userCredential.user.displayName || '',
        }),
      });

      console.log(
        '8. Backend respondió con status:',
        response.status
      );

      // ==========================================
      // 4. LEER RESPUESTA DEL BACKEND
      // ==========================================

      const responseText = await response.text();

      console.log(
        '9. Respuesta cruda del backend:',
        responseText
      );

      let data: any = {};

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `El servidor respondió algo que no es JSON. Status: ${response.status}`
        );
      }

      console.log(
        '10. Respuesta JSON del backend:',
        data
      );

      // ==========================================
      // 5. VALIDAR RESPUESTA
      // ==========================================

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          'No se pudo sincronizar el usuario.'
        );
      }

      console.log('================================');
      console.log('11. LOGIN COMPLETADO CORRECTAMENTE');
      console.log('================================');

      console.log(
        'Usuario sincronizado correctamente'
      );
      setError('');

      router.replace('/home');

      // ==========================================
      // 6. SIGUIENTE PASO
      // ==========================================
      //
      // Aquí posteriormente navegaremos al Home.
      //
      // Por ahora dejamos el usuario en esta pantalla
      // para comprobar completamente la autenticación.
      //

      setError('');

    } catch (error: any) {
      console.error('================================');
      console.error('ERROR DURANTE LOGIN');
      console.error('================================');

      console.error('Error completo:', error);
      console.error('Código:', error?.code);
      console.error('Mensaje:', error?.message);

      // ==========================================
      // ERRORES DE FIREBASE AUTHENTICATION
      // ==========================================

      if (error?.code?.startsWith('auth/')) {
        switch (error.code) {
          case 'auth/invalid-credential':
            setError(
              'Correo o contraseña incorrectos.'
            );
            break;

          case 'auth/user-not-found':
            setError(
              'No existe una cuenta con este correo.'
            );
            break;

          case 'auth/wrong-password':
            setError(
              'La contraseña es incorrecta.'
            );
            break;

          case 'auth/invalid-email':
            setError(
              'Ingresa un correo electrónico válido.'
            );
            break;

          case 'auth/too-many-requests':
            setError(
              'Demasiados intentos. Intenta nuevamente más tarde.'
            );
            break;

          case 'auth/network-request-failed':
            setError(
              'No se pudo conectar con Firebase. Verifica la conexión del emulador.'
            );
            break;

          default:
            setError(
              `Error de Firebase: ${error.code}`
            );
            break;
        }

      } else {

        // ==========================================
        // ERROR DEL BACKEND / RED
        // ==========================================

        setError(
          error?.message ||
          'No se pudo conectar con el servidor.'
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ==========================================
              LOGO Y ENCABEZADO
              ========================================== */}

          <View style={styles.header}>

            <View style={styles.logoCircle}>

              <Image
                source={require(
                  '../../assets/images/logo-vetcare.png'
                )}

                style={[
                  styles.logo,
                  {
                    transform: [
                      {
                        scaleX: -1,
                      },
                    ],
                  },
                ]}

                resizeMode="contain"
              />

            </View>

            <Text style={styles.title}>
              VetCare
            </Text>

            <Text style={styles.subtitle}>
              Cuida a quienes amas
            </Text>

          </View>

          {/* ==========================================
              FORMULARIO
              ========================================== */}

          <View style={styles.formContainer}>

            <Text style={styles.heading}>
              Iniciar sesión
            </Text>

            {/* CORREO */}

            <Text style={styles.label}>
              Correo electrónico
            </Text>

            <View style={styles.inputContainer}>

              <Text style={styles.inputIcon}>
                ✉
              </Text>

              <TextInput
                style={styles.input}
                placeholder="ejemplo@vetcare.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

            </View>

            {/* CONTRASEÑA */}

            <Text style={styles.label}>
              Contraseña
            </Text>

            <View style={styles.inputContainer}>

              <Text style={styles.inputIcon}>
                ▣
              </Text>

              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />

              <Pressable
                onPress={() =>
                  setShowPassword(!showPassword)
                }
                style={styles.eyeButton}
              >

                <Text style={styles.eyeText}>
                  {showPassword ? '◉' : '◌'}
                </Text>

              </Pressable>

            </View>

            {/* RECUPERAR CONTRASEÑA */}

            <Pressable
              onPress={() =>
                console.log(
                  'Recuperar contraseña'
                )
              }
              style={styles.forgotButton}
            >

              <Text style={styles.forgotText}>
                ¿Olvidaste tu contraseña?
              </Text>

            </Pressable>

            {/* ERROR */}

            {error ? (
              <View style={styles.errorContainer}>

                <Text style={styles.error}>
                  {error}
                </Text>

              </View>
            ) : null}

            {/* LOGIN */}

            <Pressable
              onPress={handleLogin}
              disabled={loading}

              style={({ pressed }) => [
                styles.loginButton,
                pressed &&
                  styles.loginButtonPressed,
                loading &&
                  styles.loginButtonDisabled,
              ]}
            >

              <Text style={styles.loginButtonText}>
                {loading
                  ? 'Ingresando...'
                  : 'Ingresar'}
              </Text>

            </Pressable>

            {/* REGISTRO */}

            <View
              style={styles.registerContainer}
            >

              <Text style={styles.registerText}>
                ¿No tienes cuenta?
              </Text>

              <Pressable
                onPress={() =>
                  console.log(
                    'Ir a registro'
                  )
                }
              >

                <Text style={styles.registerLink}>
                  {' '}Regístrate
                </Text>

              </Pressable>

            </View>

          </View>

        </ScrollView>

      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 40,
  },

  /* =========================
     ENCABEZADO
     ========================= */

  header: {
    alignItems: 'center',
    marginBottom: 28,
  },

  logoCircle: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  logo: {
    width: 76,
    height: 76,
  },

  title: {
    fontFamily: 'serif',
    fontSize: 42,
    fontWeight: '400',
    color: colors.primary,
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 17,
    color: '#4B5563',
    textAlign: 'center',
  },

  /* =========================
     FORMULARIO
     ========================= */

  formContainer: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
  },

  heading: {
    fontSize: 27,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 26,
    textAlign: 'center',
  },

  label: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 9,
  },

  inputContainer: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
  },

  inputIcon: {
    width: 52,
    textAlign: 'center',
    fontSize: 21,
    color: '#9CA3AF',
  },

  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 2,
    fontSize: 17,
    color: colors.text,
  },

  eyeButton: {
    width: 52,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  eyeText: {
    fontSize: 22,
    color: '#9CA3AF',
  },

  /* =========================
     RECUPERAR CONTRASEÑA
     ========================= */

  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 0,
    marginBottom: 24,
  },

  forgotText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },

  /* =========================
     ERROR
     ========================= */

  errorContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  error: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 19,
  },

  /* =========================
     BOTÓN LOGIN
     ========================= */

  loginButton: {
    height: 62,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginButtonPressed: {
    opacity: 0.8,
  },

  loginButtonDisabled: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  /* =========================
     REGISTRO
     ========================= */

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 38,
  },

  registerText: {
    color: '#6B7280',
    fontSize: 16,
  },

  registerLink: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },

});
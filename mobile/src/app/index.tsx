import { useState } from 'react';
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

import { Colors } from '@/constants/theme';

const colors = Colors.light;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (!email.includes('@')) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    // La conexión con la API se agregará posteriormente.
    console.log('Login:', { email, password });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* LOGO Y ENCABEZADO */}
          <View style={styles.header}>

            {/* CÍRCULO DEL LOGO */}
            <View style={styles.logoCircle}>
              <Image
                source={require('../../assets/images/logo-vetcare.png')}
                style={[
                  styles.logo,
                  { transform: [{ scaleX: -1 }] },
                ]}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>VetCare</Text>

            <Text style={styles.subtitle}>
              Cuida a quienes amas
            </Text>
          </View>

          {/* FORMULARIO */}
          <View style={styles.formContainer}>

            <Text style={styles.heading}>
              Iniciar sesión
            </Text>

            {/* CORREO */}
            <Text style={styles.label}>
              Correo electrónico
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>✉</Text>

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
              <Text style={styles.inputIcon}>▣</Text>

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
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeText}>
                  {showPassword ? '◉' : '◌'}
                </Text>
              </Pressable>
            </View>

            {/* RECUPERAR CONTRASEÑA */}
            <Pressable
              onPress={() => console.log('Recuperar contraseña')}
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText}>
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>

            {/* ERROR */}
            {error ? (
              <Text style={styles.error}>
                {error}
              </Text>
            ) : null}

            {/* LOGIN */}
            <Pressable
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.loginButtonPressed,
              ]}
            >
              <Text style={styles.loginButtonText}>
                Ingresar
              </Text>
            </Pressable>

            {/* REGISTRO */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                ¿No tienes cuenta?
              </Text>

              <Pressable
                onPress={() => console.log('Ir a registro')}
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

  error: {
    color: colors.error,
    fontSize: 13,
    marginBottom: 12,
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
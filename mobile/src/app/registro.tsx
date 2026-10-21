import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { API_URL } from '@/config/api';

export default function RegistroScreen() {
  const router = useRouter();
  const [nombre, setNombre] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false);
  const registrar = async () => {
    if (loading) return;
    if (!nombre.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Revisa tus datos', 'Ingresa tu nombre y un correo válido.'); return;
    }
    if (password.length < 6) { Alert.alert('Contraseña inválida', 'Usa al menos 6 caracteres.'); return; }
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: nombre.trim() });
      const token = await credential.user.getIdToken();
      const response = await fetch(`${API_URL}/api/auth/sync`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: nombre.trim() }),
      });
      if (!response.ok) {
        await signOut(auth);
        throw new Error('La cuenta se creó, pero no pudimos completar la sincronización. Inicia sesión para reintentar.');
      }
      router.replace('/home');
    } catch (error: any) {
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
        'auth/invalid-email': 'Ingresa un correo válido.',
        'auth/weak-password': 'La contraseña es demasiado débil.',
        'auth/network-request-failed': 'No se pudo conectar. Revisa tu conexión.',
      };
      Alert.alert('No se pudo crear la cuenta', messages[error?.code] || error?.message || 'Intenta nuevamente.');
    } finally { setLoading(false); }
  };
  return <SafeAreaView style={styles.screen}><View style={styles.form}>
    <Text style={styles.title}>Crear cuenta</Text><Text style={styles.subtitle}>Regístrate en VetCare</Text>
    <TextInput style={styles.input} placeholder="Nombre completo" value={nombre} onChangeText={setNombre} autoCapitalize="words" />
    <TextInput style={styles.input} placeholder="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
    <TextInput style={styles.input} placeholder="Contraseña (mínimo 6 caracteres)" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
    <Pressable style={[styles.button, loading && styles.disabled]} onPress={registrar} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Crear cuenta</Text>}</Pressable>
    <Pressable onPress={() => router.replace('/')}><Text style={styles.link}>Ya tengo una cuenta</Text></Pressable>
  </View></SafeAreaView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, justifyContent: 'center', backgroundColor: '#F5F6F8', padding: 24 }, form: { gap: 14, width: '100%', maxWidth: 430, alignSelf: 'center' }, title: { fontSize: 28, fontWeight: '700', color: '#1F2937', textAlign: 'center' }, subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 12 }, input: { backgroundColor: '#fff', borderColor: '#D1D5DB', borderWidth: 1, borderRadius: 12, padding: 15, fontSize: 16 }, button: { backgroundColor: '#6D28D9', borderRadius: 12, padding: 16, alignItems: 'center' }, disabled: { opacity: 0.6 }, buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 }, link: { textAlign: 'center', color: '#6D28D9', fontWeight: '600', padding: 10 } });

import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/config/firebase';

export default function RecuperarScreen() {
  const router = useRouter(); const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false);
  const enviar = async () => {
    if (loading) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { Alert.alert('Correo inválido', 'Ingresa un correo electrónico válido.'); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Revisa tu correo', 'Si existe una cuenta asociada, recibirás instrucciones para restablecer la contraseña.');
    } catch (error: any) {
      const message = error?.code === 'auth/too-many-requests' ? 'Se hicieron demasiadas solicitudes. Intenta más tarde.' : error?.code === 'auth/network-request-failed' ? 'No se pudo conectar. Revisa tu conexión.' : 'No se pudo enviar el correo. Revisa la dirección e inténtalo de nuevo.';
      Alert.alert('No se pudo enviar', message);
    } finally { setLoading(false); }
  };
  return <SafeAreaView style={styles.screen}><View style={styles.form}>
    <Text style={styles.title}>Recuperar contraseña</Text><Text style={styles.subtitle}>Te enviaremos instrucciones al correo asociado a tu cuenta.</Text>
    <TextInput style={styles.input} placeholder="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
    <Pressable style={[styles.button, loading && styles.disabled]} onPress={enviar} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar instrucciones</Text>}</Pressable>
    <Pressable onPress={() => router.replace('/')}><Text style={styles.link}>Volver al inicio de sesión</Text></Pressable>
  </View></SafeAreaView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, justifyContent: 'center', backgroundColor: '#F5F6F8', padding: 24 }, form: { gap: 15, width: '100%', maxWidth: 430, alignSelf: 'center' }, title: { fontSize: 26, fontWeight: '700', color: '#1F2937', textAlign: 'center' }, subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 }, input: { backgroundColor: '#fff', borderColor: '#D1D5DB', borderWidth: 1, borderRadius: 12, padding: 15, fontSize: 16 }, button: { backgroundColor: '#6D28D9', borderRadius: 12, padding: 16, alignItems: 'center' }, disabled: { opacity: 0.6 }, buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 }, link: { textAlign: 'center', color: '#6D28D9', fontWeight: '600', padding: 10 } });

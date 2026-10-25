import { useState } from 'react';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VetCareBackground } from '@/components/vetcare-background';
import { Colors } from '@/constants/theme';
import { API_URL } from '@/config/api';
import { auth } from '@/config/firebase';

const blue = Colors.light.primary;

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const registrar = async () => {
    setError('');
    const correo = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { setError('Ingresa un correo electrónico válido.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
    try {
      setCargando(true);
      const credential = await createUserWithEmailAndPassword(auth, correo, password);
      const token = await credential.user.getIdToken();
      const response = await fetch(`${API_URL}/api/auth/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: correo.split('@')[0] }),
      });
      const raw = await response.text();
      let data: any = {};
      try { data = JSON.parse(raw); } catch { throw new Error('El servidor no respondió correctamente.'); }
      if (!response.ok) throw new Error(data.message || data.error || 'No se pudo completar el registro.');
      router.replace('/home');
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/email-already-in-use') setError('Este correo ya está registrado.');
      else if (code === 'auth/weak-password') setError('La contraseña es muy débil. Usa al menos 6 caracteres.');
      else if (code === 'auth/invalid-email') setError('Ingresa un correo electrónico válido.');
      else setError(err?.message || 'Ocurrió un error. Inténtalo de nuevo.');
    } finally { setCargando(false); }
  };

  return <VetCareBackground><SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.back} onPress={() => router.replace('/')} accessibilityLabel="Volver al inicio de sesión"><Ionicons name="arrow-back" size={21} color="#1F2937" /></Pressable>
        <View style={styles.card}>
          <View style={styles.brand}><View style={styles.logoCircle}><Ionicons name="paw" size={34} color={blue} /></View><Text style={styles.brandTitle}>VetCare</Text><Text style={styles.brandSubtitle}>Sistema de Gestión Veterinaria</Text></View>
          <Text style={styles.title}>Crear cuenta</Text><Text style={styles.description}>Regístrate para cuidar a quienes amas.</Text>
          <Text style={styles.label}>Correo electrónico</Text>
          <View style={styles.inputContainer}><Ionicons name="mail-outline" size={19} color="#94A3B8" /><TextInput style={styles.input} value={email} onChangeText={(value) => { setEmail(value); setError(''); }} placeholder="ejemplo@vetcare.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} /></View>
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputContainer}><Ionicons name="lock-closed-outline" size={19} color="#94A3B8" /><TextInput style={styles.input} value={password} onChangeText={(value) => { setPassword(value); setError(''); }} placeholder="Mínimo 6 caracteres" placeholderTextColor="#9CA3AF" secureTextEntry autoCapitalize="none" /></View>
          <Text style={styles.label}>Confirmar contraseña</Text>
          <View style={styles.inputContainer}><Ionicons name="lock-closed-outline" size={19} color="#94A3B8" /><TextInput style={styles.input} value={confirmPassword} onChangeText={(value) => { setConfirmPassword(value); setError(''); }} placeholder="Repite tu contraseña" placeholderTextColor="#9CA3AF" secureTextEntry autoCapitalize="none" onSubmitEditing={registrar} /></View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={[styles.primaryButton, cargando && styles.disabled]} onPress={registrar} disabled={cargando}>{cargando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Registrarse</Text>}</Pressable>
          <View style={styles.footer}><Text style={styles.footerText}>¿Ya tienes una cuenta?</Text><Pressable onPress={() => router.replace('/')}><Text style={styles.textLink}> Inicia sesión</Text></Pressable></View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView></VetCareBackground>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' }, flex: { flex: 1 }, content: { flexGrow: 1, justifyContent: 'center', padding: 18 },
  back: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12, elevation: 2 },
  card: { width: '100%', maxWidth: 460, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 24, padding: 24, elevation: 5 },
  brand: { alignItems: 'center', marginBottom: 18 }, logoCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.light.backgroundSelected, alignItems: 'center', justifyContent: 'center' }, brandTitle: { color: blue, fontSize: 32, fontWeight: '800', marginTop: 7 }, brandSubtitle: { color: '#64748B', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  title: { color: '#111827', fontSize: 22, fontWeight: '800', textAlign: 'center', textTransform: 'capitalize' }, description: { color: '#64748B', fontSize: 14, textAlign: 'center', marginTop: 5, marginBottom: 12 }, label: { color: '#374151', fontSize: 14, fontWeight: '700', marginTop: 12, marginBottom: 7 },
  inputContainer: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 13, backgroundColor: '#FFFFFF', paddingHorizontal: 13 }, input: { flex: 1, color: '#1F2937', fontSize: 14, paddingVertical: 10 }, error: { color: '#DC2626', fontSize: 13, marginTop: 9 },
  primaryButton: { minHeight: 52, borderRadius: 13, backgroundColor: blue, alignItems: 'center', justifyContent: 'center', marginTop: 18 }, primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }, disabled: { opacity: 0.6 }, footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 }, footerText: { color: '#64748B', fontSize: 14 }, textLink: { color: blue, fontSize: 14, fontWeight: '700' },
});

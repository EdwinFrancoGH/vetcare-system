import { useState } from 'react';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VetCareBackground } from '@/components/vetcare-background';
import { Colors } from '@/constants/theme';
import { auth } from '@/config/firebase';

const blue = Colors.light.primary;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const enviarEnlace = async () => {
    setError('');
    const correo = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    try {
      setCargando(true);
      await sendPasswordResetEmail(auth, correo);
      setEnviado(true);
    } catch (err: any) {
      setError(err?.code === 'auth/user-not-found' ? 'No existe una cuenta con ese correo.' : 'Ocurrió un error al enviar el enlace. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return <VetCareBackground><SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.back} onPress={() => router.replace('/')} accessibilityLabel="Volver al inicio de sesión"><Ionicons name="arrow-back" size={21} color="#1F2937" /></Pressable>
        <View style={styles.card}>
          <View style={styles.brand}><View style={styles.logoCircle}><Ionicons name="paw" size={34} color={blue} /></View><Text style={styles.brandTitle}>VetCare</Text><Text style={styles.brandSubtitle}>Sistema de Gestión Veterinaria</Text></View>
          {enviado ? <View style={styles.success}><View style={styles.successIcon}><Ionicons name="mail-open-outline" size={32} color="#16A34A" /></View><Text style={styles.title}>¡Correo enviado!</Text><Text style={styles.description}>Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.</Text><Text style={styles.email}>{email.trim()}</Text><Pressable style={styles.primaryButton} onPress={() => router.replace('/')}><Text style={styles.primaryText}>Volver al inicio de sesión</Text></Pressable></View> : <>
            <Text style={styles.title}>Recuperar contraseña</Text><Text style={styles.description}>Te enviaremos un enlace para restablecerla.</Text>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputContainer}><Ionicons name="mail-outline" size={19} color="#94A3B8" /><TextInput style={styles.input} value={email} onChangeText={(value) => { setEmail(value); setError(''); }} placeholder="ejemplo@vetcare.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} returnKeyType="send" onSubmitEditing={enviarEnlace} /></View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable style={[styles.primaryButton, cargando && styles.disabled]} onPress={enviarEnlace} disabled={cargando}>{cargando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Enviar enlace</Text>}</Pressable>
            <Pressable style={styles.textLinkButton} onPress={() => router.replace('/')}><Text style={styles.textLink}>Volver al inicio de sesión</Text></Pressable>
          </>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView></VetCareBackground>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' }, flex: { flex: 1 }, content: { flexGrow: 1, justifyContent: 'center', padding: 18 },
  back: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12, elevation: 2 },
  card: { width: '100%', maxWidth: 460, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 24, padding: 24, elevation: 5 },
  brand: { alignItems: 'center', marginBottom: 22 }, logoCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.light.backgroundSelected, alignItems: 'center', justifyContent: 'center' }, brandTitle: { color: blue, fontSize: 34, fontWeight: '800', marginTop: 8 }, brandSubtitle: { color: '#64748B', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  title: { color: '#111827', fontSize: 22, fontWeight: '800', textAlign: 'center', textTransform: 'capitalize' }, description: { color: '#64748B', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 7, marginBottom: 22 }, label: { color: '#374151', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  inputContainer: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 14, backgroundColor: '#FFFFFF', paddingHorizontal: 14 }, input: { flex: 1, color: '#1F2937', fontSize: 15, paddingVertical: 12 }, error: { color: '#DC2626', fontSize: 13, marginTop: 9 },
  primaryButton: { minHeight: 52, borderRadius: 13, backgroundColor: blue, alignItems: 'center', justifyContent: 'center', marginTop: 18, paddingHorizontal: 14 }, primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center' }, disabled: { opacity: 0.6 }, textLinkButton: { alignItems: 'center', paddingVertical: 16 }, textLink: { color: blue, fontSize: 14, fontWeight: '700' },
  success: { alignItems: 'center' }, successIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, email: { color: '#1E40AF', fontSize: 14, fontWeight: '700' },
});

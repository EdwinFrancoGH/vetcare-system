import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail, updatePassword } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth } from '@/config/firebase';

export default function CambiarContrasenaScreen() {
  const router = useRouter();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [cargando, setCargando] = useState(false);
  const user = auth.currentUser;
  const email = user?.email;
  const tieneContrasena = user?.providerData.some((provider) => provider.providerId === 'password');

  const guardar = async () => {
    if (!user || !email || cargando) return;
    if (!tieneContrasena) {
      setCargando(true);
      try { await sendPasswordResetEmail(auth, email); Alert.alert('Correo enviado', `Sigue el enlace enviado a ${email}.`); }
      catch (error: any) { Alert.alert('No se pudo enviar', error?.message || 'Intenta nuevamente.'); }
      finally { setCargando(false); }
      return;
    }
    if (nueva.length < 6) return Alert.alert('Contraseña inválida', 'Usa al menos 6 caracteres.');
    if (nueva !== confirmacion) return Alert.alert('No coincide', 'La confirmación debe ser igual a la nueva contraseña.');
    setCargando(true);
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(email, actual));
      await updatePassword(user, nueva);
      Alert.alert('Contraseña actualizada', 'Tu contraseña quedó cambiada.', [{ text: 'Aceptar', onPress: () => router.back() }]);
    } catch (error: any) {
      const message = error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential'
        ? 'La contraseña actual no es correcta.'
        : error?.code === 'auth/too-many-requests' ? 'Demasiados intentos. Intenta más tarde.'
        : error?.message || 'No se pudo cambiar la contraseña.';
      Alert.alert('No se pudo cambiar', message);
    } finally { setCargando(false); }
  };

  const input = (value: string, onChangeText: (text: string) => void, label: string) => <TextInput value={value} onChangeText={onChangeText} placeholder={label} secureTextEntry autoCapitalize="none" style={styles.input} />;
  return <SafeAreaView style={styles.safe}><View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.title}>Cambiar contraseña</Text></View><View style={styles.body}><Text style={styles.hint}>{tieneContrasena ? 'Confirma tu contraseña actual para proteger tu cuenta.' : `Esta cuenta inicia sesión con otro proveedor. Puedes solicitar un enlace para ${email || 'tu correo'}.`}</Text>{tieneContrasena && <>{input(actual, setActual, 'Contraseña actual')}{input(nueva, setNueva, 'Nueva contraseña')}{input(confirmacion, setConfirmacion, 'Confirmar nueva contraseña')}</>}<Pressable style={styles.button} disabled={cargando} onPress={guardar}>{cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{tieneContrasena ? 'Actualizar contraseña' : 'Enviar enlace de recuperación'}</Text>}</Pressable></View></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F6F5FA' }, header: { height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 20 }, back: { fontSize: 34, color: '#6841C7' }, title: { fontSize: 19, fontWeight: '700', color: '#27223A' }, body: { padding: 22, gap: 14 }, hint: { color: '#625C70', lineHeight: 21, marginBottom: 6 }, input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#ECEAF1', padding: 14, fontSize: 15 }, button: { backgroundColor: '#6841C7', borderRadius: 12, minHeight: 50, alignItems: 'center', justifyContent: 'center', padding: 12 }, buttonText: { color: '#fff', fontWeight: '700' } });

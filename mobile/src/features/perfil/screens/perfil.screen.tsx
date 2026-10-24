import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { auth } from '@/config/firebase';
import { API_URL } from '@/config/api';
import { Colors } from '@/constants/theme';

const colors = Colors.light;

type Perfil = {
  name?: string;
  email?: string;
  role?: string;
  telefono?: string;
  phone?: string;
  direccion?: string;
  address?: string;
  photoURL?: string;
  createdAt?: string;
};

export default function PerfilScreen() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [contrasena, setContrasena] = useState('');

  const cargarPerfil = useCallback(async () => {
    const usuario = auth.currentUser;
    if (!usuario) {
      setError('No hay una sesión activa.');
      setCargando(false);
      return;
    }

    try {
      setError('');
      const token = await usuario.getIdToken();
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'No se pudo cargar el perfil.');

      const datosPerfil = data.user || {};
      setPerfil({ ...datosPerfil, email: usuario.email || datosPerfil.email });
      setNombre(datosPerfil.name || usuario.displayName || '');
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar el perfil.');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargarPerfil(); }, [cargarPerfil]));

  const abrirEdicion = () => {
    setNombre(perfil.name || auth.currentUser?.displayName || '');
    setContrasena('');
    setModalVisible(true);
  };

  const guardarPerfil = async () => {
    const usuario = auth.currentUser;
    if (!usuario) return;
    if (!nombre.trim()) {
      Alert.alert('Falta el nombre', 'Escribe tu nombre para guardar el perfil.');
      return;
    }
    if (contrasena && contrasena.length < 6) {
      Alert.alert('Contraseña no válida', 'Debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setGuardando(true);
      const token = await usuario.getIdToken();
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nombre.trim(), ...(contrasena ? { password: contrasena } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'No se pudo actualizar el perfil.');

      await usuario.reload();
      setContrasena('');
      setModalVisible(false);
      await cargarPerfil();
      Alert.alert('Perfil actualizado', 'Tus cambios se guardaron correctamente.');
    } catch (err: any) {
      Alert.alert('No se pudo guardar', err?.message || 'Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const seleccionarFoto = async () => {
    const usuario = auth.currentUser;
    if (!usuario) return;

    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso requerido', 'Permite el acceso a tus fotos para elegir una imagen de perfil.');
        return;
      }

      const seleccion = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (seleccion.canceled || !seleccion.assets[0]) return;

      setSubiendoFoto(true);
      const imagen = await ImageManipulator.manipulateAsync(
        seleccion.assets[0].uri,
        [{ resize: { width: 320 } }],
        { compress: 0.78, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      if (!imagen.base64) throw new Error('No se pudo procesar la foto seleccionada.');

      const photoURL = `data:image/jpeg;base64,${imagen.base64}`;
      if (photoURL.length > 1_400_000) {
        throw new Error('La foto sigue siendo muy pesada. Selecciona otra imagen.');
      }

      const token = await usuario.getIdToken();
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoURL }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'No se pudo guardar la foto.');

      setPerfil((actual) => ({ ...actual, photoURL }));
      Alert.alert('Foto actualizada', 'Tu foto de perfil se guardó correctamente.');
    } catch (err: any) {
      Alert.alert('No se pudo actualizar la foto', err?.message || 'Inténtalo de nuevo.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const cerrarSesion = () => {
    Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: async () => {
        await signOut(auth);
        router.replace('/');
      } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headingRow}>
            <Pressable style={styles.backButton} onPress={() => router.replace('/home')} accessibilityLabel="Volver al inicio">
              <Ionicons name="arrow-back" size={22} color={colors.primary} />
            </Pressable>
            <Text style={styles.pageTitle}>Mi perfil</Text>
            <View style={styles.headingSpacer} />
          </View>

          {cargando ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={cargarPerfil}><Text style={styles.retryText}>Volver a intentar</Text></Pressable>
            </View>
          ) : (
            <>
              <View style={styles.identity}>
                <Pressable style={styles.avatar} onPress={seleccionarFoto} disabled={subiendoFoto} accessibilityLabel="Seleccionar foto de perfil">
                  {perfil.photoURL ? (
                    <Image source={{ uri: perfil.photoURL }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={42} color={colors.primary} />
                  )}
                  <View style={styles.cameraBadge}>
                    {subiendoFoto ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="camera" size={16} color="#FFFFFF" />}
                  </View>
                </Pressable>
                <Text style={styles.name}>{perfil.name || auth.currentUser?.displayName || 'Usuario VetCare'}</Text>
                {perfil.role ? <Text style={styles.role}>{perfil.role}</Text> : null}
              </View>

              <View style={styles.detailsCard}>
                <InfoRow label="Nombre" value={perfil.name || auth.currentUser?.displayName || 'Sin registrar'} />
                <InfoRow label="Correo electrónico" value={perfil.email || 'Sin registrar'} />
                {(perfil.telefono || perfil.phone) ? <InfoRow label="Teléfono" value={perfil.telefono || perfil.phone || ''} /> : null}
                {(perfil.direccion || perfil.address) ? <InfoRow label="Dirección" value={perfil.direccion || perfil.address || ''} last /> : null}
                {!perfil.telefono && !perfil.phone && !perfil.direccion && !perfil.address ? <Text style={styles.note}>Puedes completar tu información de contacto cuando esté disponible en tu cuenta.</Text> : null}
              </View>

              <Pressable style={styles.actionCard} onPress={abrirEdicion}>
                <View style={styles.actionIcon}><Ionicons name="lock-closed-outline" size={20} color={colors.primary} /></View>
                <Text style={styles.actionText}>Editar perfil y contraseña</Text>
                <Ionicons name="chevron-forward" size={21} color="#9CA3AF" />
              </Pressable>

              <Pressable style={styles.actionCard} onPress={() => Alert.alert('Notificaciones', 'Puedes administrar los permisos desde los ajustes de tu dispositivo.')}>
                <View style={styles.actionIcon}><Ionicons name="notifications-outline" size={20} color={colors.primary} /></View>
                <Text style={styles.actionText}>Notificaciones</Text>
                <Ionicons name="chevron-forward" size={21} color="#9CA3AF" />
              </Pressable>

              <Pressable style={styles.logoutButton} onPress={cerrarSesion}>
                <Text style={styles.logoutText}>Cerrar sesión</Text>
              </Pressable>
            </>
          )}
        </ScrollView>

        <View style={styles.bottomNav}>
          <NavItem icon="home-outline" label="Inicio" onPress={() => router.replace('/home')} />
          <NavItem icon="paw-outline" label="Mascotas" onPress={() => router.push('/mascotas')} />
          <NavItem icon="calendar-outline" label="Citas" onPress={() => router.push('/citas')} />
          <NavItem icon="person" label="Perfil" active onPress={() => router.replace('/explore')} />
        </View>

        <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Editar perfil</Text>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput value={nombre} onChangeText={setNombre} style={styles.input} autoCapitalize="words" />
              <Text style={styles.inputLabel}>Nueva contraseña (opcional)</Text>
              <TextInput value={contrasena} onChangeText={setContrasena} style={styles.input} secureTextEntry placeholder="Mínimo 6 caracteres" />
              <View style={styles.modalButtons}>
                <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
                <Pressable style={styles.saveButton} onPress={guardarPerfil} disabled={guardando}>
                  {guardando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Guardar</Text>}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function NavItem({ icon, label, active = false, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.navItem} onPress={onPress}>
      <Ionicons name={icon} size={21} color={active ? colors.primary : '#9CA3AF'} />
      <Text style={active ? styles.navTextActive : styles.navText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F6F8' },
  screen: { flex: 1, backgroundColor: '#F5F6F8' },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  headingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 20 },
  backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  pageTitle: { flex: 1, marginLeft: 12, color: '#1F2937', fontSize: 22, fontWeight: '700' },
  headingSpacer: { width: 42 },
  loader: { marginTop: 60 },
  errorCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18, alignItems: 'center' },
  errorText: { color: '#B91C1C', fontSize: 14, textAlign: 'center' },
  retryText: { color: colors.primary, fontWeight: '700', marginTop: 12 },
  identity: { alignItems: 'center', marginTop: 6, marginBottom: 22 },
  avatar: { width: 104, height: 104, borderRadius: 52, borderWidth: 2, borderColor: colors.primary, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', overflow: 'visible', position: 'relative' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 50 },
  cameraBadge: { position: 'absolute', right: -4, bottom: -2, width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  name: { color: '#1F2937', fontSize: 21, fontWeight: '700', marginTop: 10 },
  role: { color: '#6B7280', fontSize: 14, marginTop: 3 },
  detailsCard: { backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 2, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  infoRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 14 },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { color: '#4B5563', fontSize: 14, flexShrink: 0 },
  infoValue: { color: '#1F2937', fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  note: { color: '#6B7280', fontSize: 12, lineHeight: 18, paddingVertical: 14 },
  actionCard: { minHeight: 62, backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 1 },
  actionIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  actionText: { flex: 1, color: '#1F2937', fontSize: 15, fontWeight: '600' },
  logoutButton: { minHeight: 52, borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FEE2E2', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 6, marginBottom: 12 },
  logoutText: { color: '#DC2626', fontSize: 16, fontWeight: '600' },
  bottomNav: { height: 68, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 4 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navText: { color: '#6B7280', fontSize: 10, marginTop: 3 },
  navTextActive: { color: colors.primary, fontSize: 10, fontWeight: '600', marginTop: 3 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(17,24,39,0.45)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 22 },
  modalTitle: { color: '#1F2937', fontSize: 22, fontWeight: '700', marginBottom: 18, textAlign: 'center' },
  inputLabel: { color: '#374151', fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  input: { height: 48, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 12, fontSize: 16, color: '#1F2937', backgroundColor: '#FFFFFF' },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 22 },
  cancelButton: { flex: 1, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D1D5DB' },
  cancelText: { color: '#4B5563', fontWeight: '600' },
  saveButton: { flex: 1, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
});

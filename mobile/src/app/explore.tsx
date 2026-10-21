import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { API_URL } from '@/config/api';
import { useGalleryImage } from '@/hooks/use-gallery-image';
import { cleanupPickedImage, type PickedImage } from '@/hooks/use-gallery-image';
import { uploadUserImage } from '@/services/image-storage';

type ContactPet = { telefono?: string; direccion?: string };

export default function PerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;
  const [nombre, setNombre] = useState(user?.displayName || '');
  const [fotoUrl, setFotoUrl] = useState(user?.photoURL || '');
  const [fotoTemporal, setFotoTemporal] = useState<PickedImage | null>(null);
  const [telefono, setTelefono] = useState(user?.phoneNumber || '');
  const [direccion, setDireccion] = useState('');
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [errorPerfil, setErrorPerfil] = useState('');
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const fotoTemporalRef = useRef<PickedImage | null>(null);
  const { pickImage, pickingImage } = useGalleryImage();

  useEffect(() => { fotoTemporalRef.current = fotoTemporal; }, [fotoTemporal]);
  useEffect(() => () => { void cleanupPickedImage(fotoTemporalRef.current); }, []);

  const cargarContacto = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setCargandoPerfil(true);
    setErrorPerfil('');
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${API_URL}/api/mascotas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'No se pudieron cargar los datos de contacto.');
      const mascota = (result.data || result.mascotas || [])[0] as ContactPet | undefined;
      setTelefono(currentUser.phoneNumber || mascota?.telefono || '');
      setDireccion(mascota?.direccion || '');
    } catch (error: any) {
      setErrorPerfil(error?.message || 'No se pudo cargar la información de contacto.');
    } finally {
      setCargandoPerfil(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void cargarContacto(); }, [cargarContacto]));

  const seleccionarFoto = async () => {
    const image = await pickImage();
    if (!image) return;
    const previous = fotoTemporal;
    setFotoTemporal(image);
    void cleanupPickedImage(previous);
  };

  const guardarFoto = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !fotoTemporal || subiendoFoto) return;
    setSubiendoFoto(true);
    try {
      const { url } = await uploadUserImage(fotoTemporal, `users/${currentUser.uid}/profile`);
      await updateProfile(currentUser, { photoURL: url });
      setFotoUrl(url);
      const selected = fotoTemporal;
      setFotoTemporal(null);
      await cleanupPickedImage(selected);
      Alert.alert('Fotografía actualizada', 'La nueva imagen se subió y se vinculó a tu perfil.');
    } catch (error: any) {
      Alert.alert('No se pudo actualizar la fotografía', error?.message || 'La foto anterior se conserva. Revisa Storage y sus reglas.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardarNombre = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !nombre.trim() || guardandoNombre) return;
    setGuardandoNombre(true);
    try {
      await updateProfile(currentUser, { displayName: nombre.trim() });
      Alert.alert('Perfil actualizado', 'El nombre quedó guardado.');
    } catch (error: any) {
      Alert.alert('No se pudo guardar el nombre', error?.message || 'Intenta nuevamente.');
    } finally {
      setGuardandoNombre(false);
    }
  };

  const cerrarSesion = async () => {
    if (cerrandoSesion) return;
    setCerrandoSesion(true);
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error: any) {
      Alert.alert('No se pudo cerrar sesión', error?.message || 'Intenta nuevamente.');
    } finally {
      setCerrandoSesion(false);
    }
  };

  const volver = () => router.canGoBack() ? router.back() : router.replace('/home');
  const valorContacto = (value: string) => cargandoPerfil ? 'Cargando…' : value || 'No registrado';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={volver} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Regresar">
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing}>
              {fotoTemporal || fotoUrl
                ? <Image source={{ uri: fotoTemporal?.uri || fotoUrl }} style={styles.avatar} />
                : <View style={styles.avatarFallback}><Ionicons name="person" size={48} color="#7952D6" /></View>}
            </View>
            <Pressable style={styles.cameraButton} onPress={seleccionarFoto} disabled={pickingImage || subiendoFoto} accessibilityRole="button" accessibilityLabel="Seleccionar fotografía de perfil">
              {pickingImage ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="camera" size={18} color="#fff" />}
            </Pressable>
          </View>
          <Text style={styles.displayName}>{nombre || user?.displayName || 'Completa tu nombre'}</Text>
          {fotoTemporal ? (
            <View style={styles.photoActions}>
              <Text style={styles.photoHint}>Confirma para guardar esta fotografía.</Text>
              <Pressable onPress={guardarFoto} disabled={subiendoFoto} style={[styles.photoSave, subiendoFoto && styles.disabled]}>
                {subiendoFoto ? <ActivityIndicator color="#fff" /> : <Text style={styles.photoSaveText}>Guardar fotografía</Text>}
              </Pressable>
            </View>
          ) : null}

          <View style={styles.cards}>
            <InfoCard icon="person-outline" label="Nombre">
              <TextInput value={nombre} onChangeText={setNombre} placeholder="Nombre completo" placeholderTextColor="#9CA3AF" style={styles.nameInput} autoCapitalize="words" returnKeyType="done" />
              {nombre.trim() !== (user?.displayName || '') ? (
                <Pressable onPress={guardarNombre} disabled={guardandoNombre} style={styles.inlineSave}>
                  {guardandoNombre ? <ActivityIndicator color="#6841C7" size="small" /> : <Text style={styles.inlineSaveText}>Guardar nombre</Text>}
                </Pressable>
              ) : null}
            </InfoCard>
            <InfoCard icon="mail-outline" label="Correo electrónico"><Text style={styles.cardValue}>{user?.email || 'No disponible'}</Text></InfoCard>
            <InfoCard icon="call-outline" label="Teléfono"><Text style={styles.cardValue}>{valorContacto(telefono)}</Text></InfoCard>
            <InfoCard icon="location-outline" label="Dirección"><Text style={styles.cardValue}>{valorContacto(direccion)}</Text></InfoCard>
          </View>
          {errorPerfil ? <Text style={styles.errorText}>{errorPerfil}</Text> : null}

          <View style={styles.links}>
            <ProfileLink icon="lock-closed-outline" label="Cambiar contraseña" onPress={() => router.push('/cambiar-contrasena')} />
            <ProfileLink icon="notifications-outline" label="Notificaciones" onPress={() => router.push('/notificaciones')} />
          </View>

          <Pressable onPress={cerrarSesion} disabled={cerrandoSesion} style={[styles.logoutButton, cerrandoSesion && styles.disabled]}>
            {cerrandoSesion ? <ActivityIndicator color="#B42332" /> : <><Ionicons name="log-out-outline" size={20} color="#B42332" /><Text style={styles.logoutText}>Cerrar sesión</Text></>}
          </Pressable>
        </ScrollView>

        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <NavItem icon="home-outline" label="Inicio" onPress={() => router.replace('/home')} />
          <NavItem icon="paw-outline" label="Mascotas" onPress={() => router.replace('/mascotas')} />
          <NavItem icon="calendar-outline" label="Citas" onPress={() => router.replace('/citas')} />
          <NavItem icon="person" label="Perfil" active onPress={() => {}} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function InfoCard({ icon, label, children }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; children: React.ReactNode }) {
  return <View style={styles.infoCard}><View style={styles.infoIcon}><Ionicons name={icon} size={20} color="#6841C7" /></View><View style={styles.infoCopy}><Text style={styles.cardLabel}>{label}</Text>{children}</View></View>;
}

function ProfileLink({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.profileLink}><View style={styles.linkIcon}><Ionicons name={icon} size={20} color="#6841C7" /></View><Text style={styles.linkText}>{label}</Text><Ionicons name="chevron-forward" size={19} color="#9CA3AF" /></Pressable>;
}

function NavItem({ icon, label, active, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; active?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.navItem}><Ionicons name={icon} size={21} color={active ? '#6841C7' : '#77718A'} /><Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F5FA' }, screen: { flex: 1 },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, backgroundColor: '#F6F5FA' },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#6841C7', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', marginRight: 38, fontSize: 19, fontWeight: '700', color: '#27223A' }, headerSpacer: { width: 0 },
  content: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 26, alignItems: 'center' },
  avatarWrap: { width: 112, height: 112, marginBottom: 12 }, avatarRing: { width: 104, height: 104, borderRadius: 52, borderWidth: 3, borderColor: '#7551CF', padding: 4, backgroundColor: '#fff' },
  avatar: { width: '100%', height: '100%', borderRadius: 48 }, avatarFallback: { flex: 1, borderRadius: 48, backgroundColor: '#EEE9FA', alignItems: 'center', justifyContent: 'center' },
  cameraButton: { position: 'absolute', right: 3, bottom: 3, width: 34, height: 34, borderRadius: 17, backgroundColor: '#6841C7', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F6F5FA' },
  displayName: { fontSize: 21, fontWeight: '700', color: '#28243A', marginBottom: 19 }, photoActions: { alignItems: 'center', marginTop: -10, marginBottom: 16, gap: 8 }, photoHint: { color: '#6B647D', fontSize: 13 }, photoSave: { backgroundColor: '#6841C7', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, minWidth: 170, alignItems: 'center' }, photoSaveText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cards: { width: '100%', gap: 10 }, infoCard: { minHeight: 68, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff', borderRadius: 15, borderWidth: 1, borderColor: '#ECEAF1', flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#21133D', shadowOpacity: 0.035, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 }, infoIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F0ECFA', alignItems: 'center', justifyContent: 'center' }, infoCopy: { flex: 1 }, cardLabel: { fontSize: 12, color: '#827B90', marginBottom: 3 }, cardValue: { fontSize: 15, fontWeight: '600', color: '#302B40' }, nameInput: { padding: 0, fontSize: 15, fontWeight: '600', color: '#302B40' }, inlineSave: { alignSelf: 'flex-start', marginTop: 5 }, inlineSaveText: { color: '#6841C7', fontSize: 12, fontWeight: '700' },
  errorText: { width: '100%', marginTop: 10, color: '#B42332', fontSize: 13 }, links: { width: '100%', gap: 9, marginTop: 19 }, profileLink: { minHeight: 56, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#ECEAF1', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 }, linkIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#F0ECFA', alignItems: 'center', justifyContent: 'center' }, linkText: { flex: 1, color: '#302B40', fontSize: 15, fontWeight: '600' },
  logoutButton: { width: '100%', minHeight: 50, marginTop: 20, borderRadius: 13, borderWidth: 1, borderColor: '#E89AA1', backgroundColor: '#FFF0F1', flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' }, logoutText: { color: '#B42332', fontSize: 15, fontWeight: '700' }, disabled: { opacity: 0.65 },
  bottomNav: { minHeight: 66, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EAE8F0', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 7 }, navItem: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 3 }, navLabel: { fontSize: 11, color: '#77718A' }, navLabelActive: { color: '#6841C7', fontWeight: '700' },
});

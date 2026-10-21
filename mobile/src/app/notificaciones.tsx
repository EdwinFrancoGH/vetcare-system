import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function NotificacionesScreen() {
  const router = useRouter();
  return <SafeAreaView style={styles.safe}><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={22} color="#fff" /></Pressable><Text style={styles.title}>Notificaciones</Text></View><View style={styles.body}><View style={styles.icon}><Ionicons name="notifications-outline" size={34} color="#6841C7" /></View><Text style={styles.heading}>Notificaciones no disponibles</Text><Text style={styles.copy}>La aplicación todavía no tiene notificaciones push configuradas. No hay preferencias que puedas cambiar en este momento.</Text></View></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F6F5FA' }, header: { height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 14 }, back: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#6841C7', alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 19, fontWeight: '700', color: '#27223A' }, body: { margin: 22, padding: 24, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', gap: 14 }, icon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F0ECFA', alignItems: 'center', justifyContent: 'center' }, heading: { color: '#302B40', fontWeight: '700', fontSize: 18 }, copy: { textAlign: 'center', color: '#625C70', lineHeight: 22 } });

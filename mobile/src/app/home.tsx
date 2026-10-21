import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { auth } from '@/config/firebase';
import { API_URL } from '@/config/api';

type Pet = { id: string; nombre: string };
type Appointment = { id: string; mascotaId: string; fecha: string; hora: string; veterinario?: string; motivo?: string; estado?: string };
type Reminder = { nombre: string; fecha: string; mascota: string };

function nowClinicKey() {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/El_Salvador', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const v = (type: string) => p.find((x) => x.type === type)?.value || '';
  return `${v('year')}-${v('month')}-${v('day')} ${v('hour')}:${v('minute')}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pets, setPets] = useState<Pet[]>([]); const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const user = auth.currentUser;
      if (!user) throw new Error('Tu sesión no está activa.');
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const petsResponse = await fetch(`${API_URL}/api/mascotas`, { headers });
      const petsData = await petsResponse.json();
      if (!petsResponse.ok) throw new Error(petsData.message || 'No se pudieron cargar tus mascotas.');
      const petList: Pet[] = (petsData.data || petsData.mascotas || []).map((pet: any) => ({ ...pet, id: String(pet.id ?? pet._id ?? '') })).filter((pet: Pet) => pet.id);
      setPets(petList);
      const [appointmentsByPet, remindersByPet] = await Promise.all([
        Promise.all(petList.map(async (pet) => {
          const response = await fetch(`${API_URL}/api/citas/mascota/${encodeURIComponent(pet.id)}`, { headers });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'No se pudieron cargar tus citas.');
          return (data.data || data.citas || []).map((item: any) => ({ ...item, id: String(item.id ?? item._id ?? item.citaId ?? ''), mascotaId: pet.id }));
        })),
        Promise.all(petList.map(async (pet) => {
          const response = await fetch(`${API_URL}/api/vacunas/mascota/${encodeURIComponent(pet.id)}`, { headers });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'No se pudieron cargar los recordatorios de salud.');
          return (data.data || []).filter((vaccine: any) => vaccine.proximaFecha).map((vaccine: any) => ({ nombre: vaccine.nombre || 'Vacuna', fecha: vaccine.proximaFecha, mascota: pet.nombre }));
        })),
      ]);
      const now = nowClinicKey();
      const upcoming = appointmentsByPet.flat().filter((item: Appointment) => !['cancelada', 'completada'].includes((item.estado || '').toLowerCase()) && `${item.fecha} ${item.hora}` >= now).sort((a: Appointment, b: Appointment) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
      setAppointments(upcoming);
      setReminders(remindersByPet.flat().filter((item: Reminder) => item.fecha >= now.slice(0, 10)).sort((a: Reminder, b: Reminder) => a.fecha.localeCompare(b.fecha)));
    } catch (err: any) { setError(err?.message || 'No se pudo actualizar el inicio.'); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { loadDashboard(); }, [loadDashboard]));
  const next = appointments[0];
  const petName = (id?: string) => pets.find((pet) => pet.id === id)?.nombre || 'Mascota';
  const dateLabel = (date?: string, time?: string) => {
    if (!date) return '';
    const [y, m, d] = date.split('-').map(Number);
    const day = new Date(y, m - 1, d).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${day}${time ? ` · ${time}` : ''}`;
  };

  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <View style={styles.screen}>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.greetingRow}>
        <View style={styles.greetingCopy}>
          <Text style={styles.greeting}>¡Hola, {auth.currentUser?.displayName?.split(' ')[0] || 'bienvenido'}!</Text>
          <Text style={styles.subtitle}>Tu espacio de cuidado VetCare</Text>
        </View>
        {auth.currentUser?.photoURL ? <Image source={{ uri: auth.currentUser.photoURL }} style={styles.profilePhoto} /> : <Ionicons name="person-circle-outline" size={54} color="#6D28D9" />}
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color="#6D28D9" /><Text style={styles.muted}>Actualizando tu información...</Text></View> : error ? <View style={styles.card}><Text style={styles.error}>{error}</Text><Pressable onPress={loadDashboard}><Text style={styles.link}>Intentar de nuevo</Text></Pressable></View> : <>
        <View style={styles.summaryRow}>
          <Pressable style={styles.summary} onPress={() => router.push('/mascotas')}><Text style={styles.number}>{pets.length}</Text><Text style={styles.label}>Mis mascotas</Text></Pressable>
          <Pressable style={styles.summary} onPress={() => router.push('/citas')}><Text style={styles.number}>{appointments.length}</Text><Text style={styles.label}>Próximas citas</Text></Pressable>
          <Pressable style={styles.summary} onPress={() => router.push('/mascotas')}><Text style={styles.number}>{reminders.length}</Text><Text style={styles.label}>Recordatorios</Text></Pressable>
        </View>
        <View style={styles.sectionHeader}><Text style={styles.heading}>Próxima cita</Text><Pressable onPress={() => router.push('/citas')}><Text style={styles.link}>Ver todas</Text></Pressable></View>
        {next ? <Pressable style={styles.card} onPress={() => next.id && router.push(`/detalle-cita?id=${encodeURIComponent(next.id)}`)}><Text style={styles.cardTitle}>{petName(next.mascotaId)} · {next.motivo || 'Consulta'}</Text><Text style={styles.cardText}>{dateLabel(next.fecha, next.hora)}</Text><Text style={styles.cardText}>Veterinario: {next.veterinario || 'Por asignar'}</Text></Pressable> : <View style={styles.card}><Text style={styles.cardTitle}>Sin citas próximas</Text><Text style={styles.cardText}>Cuando reserves una cita aparecerá aquí.</Text><Pressable onPress={() => router.push('/agendar-cita')}><Text style={styles.link}>Agendar cita</Text></Pressable></View>}
        <View style={styles.sectionHeader}><Text style={styles.heading}>Recordatorios de salud</Text></View>
        {reminders.length ? reminders.slice(0, 5).map((item, index) => <View style={styles.card} key={`${item.mascota}-${item.nombre}-${index}`}><Text style={styles.cardTitle}>{item.nombre} · {item.mascota}</Text><Text style={styles.cardText}>Próxima fecha: {dateLabel(item.fecha)}</Text></View>) : <View style={styles.card}><Text style={styles.cardTitle}>Sin recordatorios disponibles</Text><Text style={styles.cardText}>Aún no hay próximas vacunas registradas.</Text></View>}
      </>}
    </ScrollView>
    <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Ir a mascotas" style={styles.navItem} onPress={() => router.replace('/mascotas')}>
        <Ionicons name="paw-outline" size={22} color="#6D28D9" /><Text style={styles.navLabel}>Mascotas</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Ir a citas" style={styles.navItem} onPress={() => router.replace('/citas')}>
        <Ionicons name="calendar-outline" size={22} color="#6D28D9" /><Text style={styles.navLabel}>Citas</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Ir al perfil" style={styles.navItem} onPress={() => router.replace('/explore')}>
        <Ionicons name="person-outline" size={22} color="#6D28D9" /><Text style={styles.navLabel}>Perfil</Text>
      </Pressable>
    </View>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F5F6F8' }, screen: { flex: 1 }, scroll: { flex: 1 }, content: { padding: 22, paddingBottom: 24 }, greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }, greetingCopy: { flex: 1, paddingRight: 10 }, greeting: { fontSize: 28, fontWeight: '700', color: '#1F2937' }, subtitle: { color: '#6B7280', fontSize: 15, marginTop: 5 }, profilePhoto: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EDE9FE' }, center: { alignItems: 'center', padding: 30, gap: 12 }, muted: { color: '#6B7280' }, summaryRow: { flexDirection: 'row', gap: 9, marginBottom: 24 }, summary: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, minHeight: 92, justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' }, number: { fontSize: 24, fontWeight: '700', color: '#6D28D9' }, label: { fontSize: 12, color: '#4B5563', marginTop: 4 }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 8 }, heading: { fontSize: 19, fontWeight: '700', color: '#1F2937' }, card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 10, gap: 6 }, cardTitle: { color: '#1F2937', fontSize: 16, fontWeight: '700' }, cardText: { color: '#6B7280', fontSize: 14 }, link: { color: '#6D28D9', fontWeight: '700', paddingTop: 6 }, error: { color: '#DC2626' }, bottomNav: { minHeight: 64, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 8 }, navItem: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 3 }, navLabel: { color: '#5B21B6', fontSize: 12, fontWeight: '600' } });

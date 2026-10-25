import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { VetCareBackground } from '@/components/vetcare-background';
import { Colors } from '@/constants/theme';
import { API_URL } from '@/config/api';
import { auth } from '@/config/firebase';
import { listarMascotas } from '@/features/mascotas/services/mascotas.service';
import { listarCitasDeMascota, listarHorariosDisponibles, reservarCita } from '@/features/citas/services/citas.service';

const blue = Colors.light.primary;
const motivos = ['Consulta general', 'Vacunación', 'Control', 'Desparasitación', 'Malestar / enfermedad'];
type Mascota = { id: string; nombre: string; especie?: string; propietario?: string; telefono?: string };
type Horario = { veterinario: string; fecha: string; hora: string; duracionMinutos?: number };
type Cita = Horario & { mascotaId: string; estado?: string; nombreMascota?: string };

export default function AgendarCita() {
  const router = useRouter();
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [veterinarios, setVeterinarios] = useState<string[]>([]);
  const [veterinario, setVeterinario] = useState('');
  const [inicioSemana, setInicioSemana] = useState(() => inicioSemanaISO(fechaHoyISO()));
  const [disponibles, setDisponibles] = useState<Horario[]>([]);
  const [dia, setDia] = useState('');
  const [seleccionada, setSeleccionada] = useState<Horario | null>(null);
  const [proxima, setProxima] = useState<Cita | null>(null);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [telefonoUsuario, setTelefonoUsuario] = useState('');
  const [mascotaId, setMascotaId] = useState('');
  const [propietario, setPropietario] = useState('');
  const [telefono, setTelefono] = useState('');
  const [motivo, setMotivo] = useState('');
  const [cargando, setCargando] = useState(true);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const hoy = fechaHoyISO();
  const finSemana = sumarDiasISO(inicioSemana, 6);
  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => sumarDiasISO(inicioSemana, i)), [inicioSemana]);
  const slotsDia = useMemo(() => disponibles.filter((slot) => slot.fecha === dia), [disponibles, dia]);
  const manana = slotsDia.filter((slot) => Number(slot.hora.slice(0, 2)) < 12);
  const tarde = slotsDia.filter((slot) => Number(slot.hora.slice(0, 2)) >= 12);

  const cargarDatos = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) { setError('No hay una sesión activa. Inicia sesión nuevamente.'); setCargando(false); return; }
    try {
      setError('');
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const [mascotasRes, medicosRes, perfilRes] = await Promise.all([
        listarMascotas({ headers }), fetch(`${API_URL}/api/horarios`, { headers }), fetch(`${API_URL}/api/users/profile`, { headers }).catch(() => null),
      ]);
      const mascotasJson = await mascotasRes.json();
      const medicosJson = await medicosRes.json();
      if (!mascotasRes.ok) throw new Error(mascotasJson.message || mascotasJson.mensaje || 'No se pudieron cargar tus mascotas.');
      if (!medicosRes.ok) throw new Error(medicosJson.message || 'No se pudieron cargar los médicos.');
      const pets: Mascota[] = mascotasJson.data || mascotasJson.mascotas || [];
      setMascotas(pets);
      const docs = [...new Set((medicosJson.data || []).map((item: { veterinario: string }) => item.veterinario).filter(Boolean))] as string[];
      setVeterinarios(docs);
      setVeterinario((actual) => actual || docs[0] || '');
      let nombre = user.displayName?.trim() || user.email?.split('@')[0] || '';
      let tel = '';
      if (perfilRes?.ok) {
        const perfil = await perfilRes.json();
        nombre = perfil?.user?.name?.trim() || nombre;
        tel = String(perfil?.user?.phone || perfil?.user?.telefono || '').trim();
      }
      setNombreUsuario(nombre);
      setTelefonoUsuario(tel);
      if (pets.length) {
        const results = await Promise.allSettled(pets.map(async (pet) => {
          const response = await listarCitasDeMascota(pet.id, { headers });
          const json = await response.json();
          return response.ok ? (json.data || []).map((cita: Cita) => ({ ...cita, nombreMascota: pet.nombre })) : [];
        }));
        const todas = results.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value);
        const siguiente = todas.filter((cita) => cita.fecha >= hoy && !['cancelada', 'completada'].includes(String(cita.estado || '').toLowerCase())).sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))[0];
        setProxima(siguiente || null);
      }
    } catch (e: any) { setError(e?.message || 'No se pudieron cargar los datos.'); }
    finally { setCargando(false); }
  }, [hoy]);

  useEffect(() => {
    const timer = setTimeout(() => { void cargarDatos(); }, 0);
    return () => clearTimeout(timer);
  }, [cargarDatos]);

  useEffect(() => {
    if (!veterinario) return;
    let activa = true;
    const cargar = async () => {
      try {
        setCargandoSlots(true); setError('');
        const token = await auth.currentUser?.getIdToken();
        const response = await listarHorariosDisponibles({ veterinario, desde: inicioSemana, hasta: finSemana }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'No se pudo cargar la disponibilidad.');
        if (!activa) return;
        const ahora = fechaHoyISO(); const horaAhora = horaActualSV();
        const libres: Horario[] = (json.data || []).filter((s: Horario) => s.fecha > ahora || (s.fecha === ahora && s.hora > horaAhora));
        setDisponibles(libres);
        setDia((actual) => actual >= inicioSemana && actual <= finSemana && actual >= ahora ? actual : dias.find((f) => f >= ahora && libres.some((s) => s.fecha === f)) || dias.find((f) => f >= ahora) || dias[0]);
      } catch (e: any) { if (activa) { setDisponibles([]); setError(e?.message || 'No se pudo cargar la disponibilidad.'); } }
      finally { if (activa) setCargandoSlots(false); }
    };
    void cargar();
    return () => { activa = false; };
  }, [veterinario, inicioSemana, finSemana, dias]);

  const abrirReserva = (slot: Horario) => {
    setSeleccionada(slot);
    const unica = mascotas.length === 1 ? mascotas[0] : null;
    setMascotaId(unica?.id || ''); setPropietario(unica?.propietario || nombreUsuario);
    setTelefono(unica?.telefono || telefonoUsuario); setMotivo('');
  };
  const elegirMascota = (id: string) => {
    const pet = mascotas.find((item) => item.id === id);
    setMascotaId(id); setPropietario(pet?.propietario || nombreUsuario); setTelefono(pet?.telefono || telefonoUsuario);
  };

  const reservar = async () => {
    if (!seleccionada || !mascotaId || !propietario.trim() || !telefono.trim() || !motivo.trim()) {
      Alert.alert('Campos incompletos', 'Selecciona una mascota e ingresa los datos de contacto y el motivo.'); return;
    }
    if (!/^(\+?503[\s-]?)?[2-7]\d{3}[\s-]?\d{4}$/.test(telefono.trim())) {
      Alert.alert('Teléfono inválido', 'Ingresa un número salvadoreño de 8 dígitos, por ejemplo 7123-4567.'); return;
    }
    const user = auth.currentUser;
    if (!user) { Alert.alert('Sesión requerida', 'Tu sesión ha expirado.'); return; }
    try {
      setGuardando(true);
      const token = await user.getIdToken();
      const response = await reservarCita({ method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ veterinario: seleccionada.veterinario, fecha: seleccionada.fecha, hora: seleccionada.hora, mascotaId, propietario: propietario.trim(), telefono: telefono.trim(), motivo: motivo.trim() }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'El horario ya no está disponible.');
      const reservada = seleccionada; const nombrePet = mascotas.find((pet) => pet.id === mascotaId)?.nombre || 'tu mascota';
      setSeleccionada(null);
      setDisponibles((actual) => actual.filter((slot) => !(slot.fecha === reservada.fecha && slot.hora === reservada.hora && slot.veterinario === reservada.veterinario)));
      Alert.alert('¡Cita reservada!', `La cita de ${nombrePet} quedó reservada para el ${formatearFecha(reservada.fecha)} a las ${reservada.hora}.`, [{ text: 'Aceptar', onPress: () => router.replace('/citas') }]);
      void cargarDatos();
    } catch (e: any) { Alert.alert('No se pudo reservar', e?.message || 'Inténtalo de nuevo.'); }
    finally { setGuardando(false); }
  };

  if (cargando) return <VetCareBackground><SafeAreaView style={styles.safe}><View style={styles.loading}><ActivityIndicator size="large" color={blue} /><Text style={styles.muted}>Cargando citas...</Text></View></SafeAreaView></VetCareBackground>;

  return <VetCareBackground><SafeAreaView style={styles.safe}>
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/citas')} style={styles.back}><Ionicons name="arrow-back" size={22} color="#1F2937" /></Pressable>
        <Text style={styles.headerTitle}>Agendar cita</Text><View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {proxima ? <View style={styles.reminder}><View style={styles.reminderIcon}><Ionicons name="calendar" size={21} color="#FFFFFF" /></View><View style={{ flex: 1 }}><Text style={styles.reminderTitle}>Tu próxima cita</Text><Text style={styles.reminderText}>{proxima.nombreMascota} · {formatearFecha(proxima.fecha)} a las {proxima.hora} con Dr(a). {proxima.veterinario}</Text></View></View> : null}
        <View style={styles.intro}><Text style={styles.title}>Disponibilidad de horarios</Text><Text style={styles.description}>Elige un horario disponible para agendar la consulta de tu mascota.</Text><Text style={styles.helper}>Los horarios se muestran en hora de El Salvador. La cita dura aproximadamente {disponibles[0]?.duracionMinutos || 30} min.</Text></View>
        {error ? <View style={styles.error}><Ionicons name="alert-circle-outline" size={20} color="#DC2626" /><Text style={styles.errorText}>{error}</Text></View> : null}
        {veterinarios.length === 0 ? <View style={styles.emptyCard}><Ionicons name="medkit-outline" size={30} color="#64748B" /><Text style={styles.emptyTitle}>No hay médicos disponibles</Text><Text style={styles.muted}>Todavía no hay médicos con horario configurado.</Text></View> : <>
          <View style={styles.card}>
            <View style={styles.doctorRow}><View style={styles.doctorAvatar}><Text style={styles.doctorAvatarText}>{veterinario.charAt(0).toLocaleUpperCase('es-SV')}</Text></View><View><Text style={styles.eyebrow}>MÉDICO</Text><Text style={styles.doctorName}>Dr(a). {veterinario}</Text></View></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.doctorOptions}>{veterinarios.map((nombre) => { const active = nombre === veterinario; return <Pressable key={nombre} onPress={() => setVeterinario(nombre)} style={[styles.doctorOption, active && styles.doctorActive]}><View style={[styles.docInitial, active && styles.docInitialActive]}><Text style={[styles.docInitialText, active && styles.docInitialTextActive]}>{nombre.charAt(0).toUpperCase()}</Text></View><Text style={[styles.doctorOptionText, active && styles.doctorOptionTextActive]}>Dr(a). {nombre}</Text></Pressable>; })}</ScrollView>
          </View>
          <View style={styles.card}>
            <View style={styles.weekRow}><Pressable disabled={inicioSemana <= inicioSemanaISO(hoy)} onPress={() => setInicioSemana((date) => sumarDiasISO(date, -7))} style={[styles.arrow, inicioSemana <= inicioSemanaISO(hoy) && styles.faded]}><Ionicons name="chevron-back" size={19} color={blue} /></Pressable><View style={styles.weekTitleBox}><Text style={styles.weekTitle}>{formatearFecha(inicioSemana)} — {formatearFecha(finSemana)}</Text>{inicioSemana > inicioSemanaISO(hoy) ? <Pressable onPress={() => setInicioSemana(inicioSemanaISO(hoy))}><Text style={styles.today}>Ir a esta semana</Text></Pressable> : null}</View><Pressable onPress={() => setInicioSemana((date) => sumarDiasISO(date, 7))} style={styles.arrow}><Ionicons name="chevron-forward" size={19} color={blue} /></Pressable></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>{dias.map((date) => { const count = disponibles.filter((slot) => slot.fecha === date).length; const past = date < hoy; const disabled = past || !count || cargandoSlots; const active = dia === date; return <Pressable key={date} disabled={disabled} onPress={() => setDia(date)} style={[styles.day, active && styles.dayActive, disabled && styles.dayDisabled]}><Text style={[styles.dayName, active && styles.dayNameActive, disabled && styles.disabledText]}>{formatearChip(date)}</Text><Text style={[styles.dayCount, active && styles.dayCountActive, disabled && styles.disabledText]}>{disabled ? 'Sin horarios' : `${count} ${count === 1 ? 'libre' : 'libres'}`}</Text></Pressable>; })}</ScrollView>
          </View>
          <View style={styles.card}>
            <Text style={styles.slotsTitle}><Ionicons name="calendar-outline" size={18} color={blue} />  {dia ? formatearFechaLarga(dia) : 'Horarios disponibles'}</Text>
            {cargandoSlots ? <View style={styles.loadingSlots}><ActivityIndicator color={blue} /><Text style={styles.muted}>Cargando disponibilidad...</Text></View> : !slotsDia.length ? <View style={styles.emptySlots}><View style={styles.emptyIcon}><Ionicons name="calendar-outline" size={27} color="#60A5FA" /></View><Text style={styles.emptyTitle}>No hay horarios disponibles este día.</Text><Text style={styles.muted}>Prueba otro día o cambia de médico.</Text></View> : <>
              {manana.length ? <><Text style={styles.period}>MAÑANA · {manana.length}</Text><View style={styles.slotGrid}>{manana.map((slot) => <Pressable key={`${slot.fecha}-${slot.hora}`} onPress={() => abrirReserva(slot)} style={styles.slot}><Ionicons name="time-outline" size={15} color={blue} /><Text style={styles.slotText}>{slot.hora}</Text></Pressable>)}</View></> : null}
              {tarde.length ? <><Text style={[styles.period, manana.length > 0 && { marginTop: 20 }]}>TARDE · {tarde.length}</Text><View style={styles.slotGrid}>{tarde.map((slot) => <Pressable key={`${slot.fecha}-${slot.hora}`} onPress={() => abrirReserva(slot)} style={styles.slot}><Ionicons name="time-outline" size={15} color={blue} /><Text style={styles.slotText}>{slot.hora}</Text></Pressable>)}</View></> : null}
            </>}
          </View>
        </>}
      </ScrollView>
      <View style={styles.nav}><NavItem icon="home-outline" label="Inicio" onPress={() => router.replace('/home')} /><NavItem icon="paw" label="Mascotas" onPress={() => router.replace('/mascotas')} /><NavItem icon="calendar-outline" label="Citas" active onPress={() => router.replace('/citas')} /><NavItem icon="bag-handle-outline" label="Tienda" onPress={() => router.push('/tienda')} /></View>
    </View>
    <Modal visible={!!seleccionada} transparent animationType="slide" onRequestClose={() => setSeleccionada(null)}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => !guardando && setSeleccionada(null)} />
        <View style={styles.modal}>
          <View style={styles.modalHeader}><View><Text style={styles.modalTitle}>Reservar horario</Text><Text style={styles.muted}>Completa los datos para confirmar tu cita.</Text></View><Pressable onPress={() => setSeleccionada(null)} disabled={guardando} style={styles.close}><Ionicons name="close" size={21} color="#64748B" /></Pressable></View>
          {seleccionada ? <View style={styles.appointmentInfo}><Ionicons name="calendar-outline" size={16} color={blue} /><Text style={styles.infoText}>{formatearFechaLarga(seleccionada.fecha)}</Text><Ionicons name="time-outline" size={16} color={blue} /><Text style={styles.infoText}>{seleccionada.hora}</Text><Ionicons name="medkit-outline" size={16} color={blue} /><Text style={styles.infoText}>Dr(a). {seleccionada.veterinario}</Text></View> : null}
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Mascota <Text style={styles.required}>*</Text></Text>
            {!mascotas.length ? <View style={styles.noPets}><Text style={styles.muted}>Primero registra una mascota.</Text><Pressable onPress={() => { setSeleccionada(null); router.push('/agregar-mascota'); }}><Text style={styles.addPet}>Agregar mascota</Text></Pressable></View> : <View style={styles.petGrid}>{mascotas.map((pet) => { const active = pet.id === mascotaId; return <Pressable key={pet.id} onPress={() => elegirMascota(pet.id)} style={[styles.pet, active && styles.petActive]}><View style={[styles.petIcon, active && styles.petIconActive]}><Ionicons name="paw" size={17} color={active ? blue : '#7C3AED'} /></View><View style={{ flex: 1 }}><Text style={styles.petName} numberOfLines={1}>{pet.nombre}</Text><Text style={styles.mutedSmall}>{pet.especie || 'Mascota'}</Text></View></Pressable>; })}</View>}
            <Text style={styles.label}>Propietario <Text style={styles.required}>*</Text></Text><TextInput style={styles.input} value={propietario} onChangeText={setPropietario} placeholder="Nombre del propietario" placeholderTextColor="#94A3B8" />
            <Text style={styles.label}>Teléfono <Text style={styles.required}>*</Text></Text><View style={styles.phone}><Text style={styles.prefix}>+503</Text><TextInput style={styles.phoneInput} value={telefono} onChangeText={(value) => { if (/^[+0-9\s-]*$/.test(value)) setTelefono(value); }} placeholder="7123-4567" placeholderTextColor="#94A3B8" keyboardType="phone-pad" maxLength={15} /></View>
            <View style={styles.reasonRow}><Text style={styles.label}>Motivo de la consulta <Text style={styles.required}>*</Text></Text><Text style={styles.counter}>{motivo.length}/200</Text></View>
            <View style={styles.chips}>{motivos.map((item) => { const active = motivo === item; return <Pressable key={item} onPress={() => setMotivo(item)} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text></Pressable>; })}</View>
            <TextInput style={[styles.input, styles.textArea]} value={motivo} onChangeText={setMotivo} placeholder="Describe el motivo de la consulta..." placeholderTextColor="#94A3B8" multiline textAlignVertical="top" maxLength={200} />
          </ScrollView>
          <View style={styles.actions}><Pressable style={styles.cancel} onPress={() => setSeleccionada(null)} disabled={guardando}><Text style={styles.cancelText}>Cancelar</Text></Pressable><Pressable style={[styles.confirm, (guardando || !mascotas.length) && styles.disabled]} onPress={reservar} disabled={guardando || !mascotas.length}>{guardando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmText}>Confirmar reserva</Text>}</Pressable></View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </SafeAreaView></VetCareBackground>;
}

function NavItem({ icon, label, active = false, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; active?: boolean; onPress: () => void }) {
  return <Pressable style={styles.navItem} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}><Ionicons name={icon} size={21} color={active ? blue : '#9CA3AF'} /><Text style={active ? styles.navActive : styles.navLabel}>{label}</Text></Pressable>;
}
function fechaHoyISO() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/El_Salvador' }).format(new Date()); }
function horaActualSV() { return new Intl.DateTimeFormat('en-GB', { timeZone: 'America/El_Salvador', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()); }
function parseISO(iso: string) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }
function toISO(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function sumarDiasISO(iso: string, delta: number) { const date = parseISO(iso); date.setDate(date.getDate() + delta); return toISO(date); }
function inicioSemanaISO(iso: string) { const date = parseISO(iso); date.setDate(date.getDate() - ((date.getDay() + 6) % 7)); return toISO(date); }
function formatearFecha(iso: string) { return parseISO(iso).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' }); }
function formatearFechaLarga(iso: string) { return parseISO(iso).toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
function formatearChip(iso: string) { const date = parseISO(iso); const name = date.toLocaleDateString('es-SV', { weekday: 'short' }).replace('.', ''); return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${date.getDate()}`; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' }, screen: { flex: 1, backgroundColor: 'transparent' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 }, muted: { color: '#64748B', fontSize: 13, textAlign: 'center' }, mutedSmall: { color: '#64748B', fontSize: 11, marginTop: 2 },
  header: { minHeight: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(248,250,252,0.8)', borderBottomWidth: 1, borderBottomColor: 'rgba(226,232,240,0.8)' }, back: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', elevation: 2 }, headerTitle: { color: '#1F2937', fontSize: 19, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 26 }, reminder: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 18 }, reminderIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: blue, alignItems: 'center', justifyContent: 'center' }, reminderTitle: { color: '#1E3A8A', fontSize: 12, fontWeight: '800', letterSpacing: 0.6 }, reminderText: { color: '#1F2937', fontSize: 14, lineHeight: 20, marginTop: 3, fontWeight: '600' },
  intro: { marginBottom: 16 }, title: { color: '#111827', fontSize: 23, fontWeight: '800' }, description: { color: '#4B5563', fontSize: 15, lineHeight: 21, marginTop: 4 }, helper: { color: '#6B7280', fontSize: 12, lineHeight: 17, marginTop: 5 }, error: { flexDirection: 'row', gap: 8, padding: 13, backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', marginBottom: 14 }, errorText: { flex: 1, color: '#B91C1C', fontSize: 13 },
  card: { backgroundColor: '#FFF', borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 14, elevation: 2 }, doctorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, doctorAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: blue, alignItems: 'center', justifyContent: 'center' }, doctorAvatarText: { color: '#FFF', fontSize: 19, fontWeight: '800' }, eyebrow: { color: '#6B7280', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }, doctorName: { color: '#111827', fontSize: 17, fontWeight: '700', marginTop: 3 }, doctorOptions: { gap: 8, paddingTop: 13 }, doctorOption: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7 }, doctorActive: { backgroundColor: blue, borderColor: blue }, docInitial: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' }, docInitialActive: { backgroundColor: '#FFF' }, docInitialText: { color: '#1E40AF', fontSize: 11, fontWeight: '700' }, docInitialTextActive: { color: blue }, doctorOptionText: { color: '#374151', fontSize: 12, fontWeight: '600' }, doctorOptionTextActive: { color: '#FFF' },
  weekRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }, arrow: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' }, faded: { opacity: 0.4 }, weekTitleBox: { flex: 1, alignItems: 'center' }, weekTitle: { color: '#374151', fontSize: 12, fontWeight: '700', textAlign: 'center' }, today: { color: blue, fontSize: 11, fontWeight: '700', marginTop: 4 }, days: { gap: 8, paddingTop: 12 }, day: { width: 88, minHeight: 65, backgroundColor: '#FFF', borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }, dayActive: { backgroundColor: blue, borderColor: blue }, dayDisabled: { backgroundColor: '#F3F4F6', opacity: 0.62 }, dayName: { color: '#374151', fontSize: 12, fontWeight: '800' }, dayNameActive: { color: '#FFF' }, dayCount: { color: blue, fontSize: 10, fontWeight: '700', marginTop: 5 }, dayCountActive: { color: '#DBEAFE' }, disabledText: { color: '#9CA3AF' },
  slotsTitle: { color: '#111827', fontSize: 17, fontWeight: '800', marginBottom: 17, textTransform: 'capitalize' }, loadingSlots: { minHeight: 90, alignItems: 'center', justifyContent: 'center', gap: 8 }, period: { color: '#6B7280', fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 10 }, slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, slot: { minWidth: '30%', flexGrow: 1, height: 45, paddingHorizontal: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: blue, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }, slotText: { color: blue, fontSize: 14, fontWeight: '700' }, emptySlots: { alignItems: 'center', paddingVertical: 16 }, emptyIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, emptyTitle: { color: '#374151', fontSize: 14, fontWeight: '700', textAlign: 'center', marginVertical: 4 }, emptyCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center', gap: 8 }, nav: { height: 68, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', paddingBottom: 4 }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }, navLabel: { color: '#6B7280', fontSize: 11 }, navActive: { color: blue, fontSize: 11, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', alignItems: 'center', padding: 12 }, modal: { width: '100%', maxWidth: 520, maxHeight: '94%', backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', elevation: 16 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 17, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }, modalTitle: { color: '#111827', fontSize: 20, fontWeight: '800' }, close: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }, appointmentInfo: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginHorizontal: 15, marginTop: 12, padding: 10, borderRadius: 12, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE' }, infoText: { color: '#1E40AF', fontSize: 11, fontWeight: '600' }, modalScroll: { flexShrink: 1 }, form: { paddingHorizontal: 17, paddingTop: 5, paddingBottom: 15 }, label: { color: '#374151', fontSize: 14, fontWeight: '600', marginTop: 13, marginBottom: 7 }, required: { color: '#DC2626' }, petGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, pet: { width: '48%', minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' }, petActive: { backgroundColor: '#EFF6FF', borderColor: '#93C5FD' }, petIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center' }, petIconActive: { backgroundColor: '#DBEAFE' }, petName: { color: '#111827', fontSize: 12, fontWeight: '700' }, noPets: { padding: 12, backgroundColor: '#F9FAFB', borderRadius: 12, alignItems: 'center' }, addPet: { color: blue, fontSize: 13, fontWeight: '700', marginTop: 8 }, input: { minHeight: 46, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, color: '#1F2937', fontSize: 14, backgroundColor: '#FFF' }, phone: { minHeight: 46, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12 }, prefix: { color: '#64748B', fontSize: 13, fontWeight: '700', marginRight: 10 }, phoneInput: { flex: 1, color: '#1F2937', fontSize: 14, paddingVertical: 10 }, reasonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, counter: { color: '#94A3B8', fontSize: 11, fontWeight: '700', marginTop: 13 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }, chipActive: { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' }, chipText: { color: '#475569', fontSize: 11 }, chipTextActive: { color: '#1E40AF', fontWeight: '700' }, textArea: { minHeight: 90, marginTop: 9 }, actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, paddingHorizontal: 15, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#F9FAFB' }, cancel: { minHeight: 44, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' }, cancelText: { color: '#374151', fontSize: 13, fontWeight: '600' }, confirm: { minHeight: 44, minWidth: 165, paddingHorizontal: 15, borderRadius: 10, backgroundColor: blue, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.55 }, confirmText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});

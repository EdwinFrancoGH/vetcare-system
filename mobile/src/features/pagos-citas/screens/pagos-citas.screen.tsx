import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VetCareBackground } from '@/components/vetcare-background';
import { Colors } from '@/constants/theme';
import { AccesoRevisionPagos } from '@/features/pagos-citas/components/acceso-revision-pagos';
import { DetallePagoRevision, EventoPagoRevision, pagosCitasService, PagoPendienteRevision } from '@/features/pagos-citas/services/pagos-citas.service';
import { crearPayloadRechazoPago, ejecutarDecisionPago, etiquetaEstadoPago, etiquetaEventoPago, formatearFechaPago, formatearImportePago, mensajeErrorPago, puedeDecidirPago } from '@/features/pagos-citas/utils/pagos-admin';

const primary = Colors.light.primary;

export default function PagosCitasScreen() {
  return <AccesoRevisionPagos><PanelRevision /></AccesoRevisionPagos>;
}

function PanelRevision() {
  const router = useRouter();
  const [pagos, setPagos] = useState<PagoPendienteRevision[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');
  const [detalle, setDetalle] = useState<DetallePagoRevision | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [rechazo, setRechazo] = useState<PagoPendienteRevision | null>(null);
  const [motivo, setMotivo] = useState('');
  const [ocupadas, setOcupadas] = useState<string[]>([]);
  const bloqueos = useRef(new Set<string>());

  const cargarPagos = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setError('');
    try {
      const lista = await pagosCitasService.obtenerPendientes();
      setPagos(lista);
    } catch (err) {
      setError(mensajeErrorPago(err));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void cargarPagos(); }, [cargarPagos]));

  const cargarDetalle = async (pago: PagoPendienteRevision) => {
    setDetalle(null);
    setCargandoDetalle(true);
    try {
      setDetalle(await pagosCitasService.consultarDetalle(pago.citaId));
    } catch (err) {
      Alert.alert('No se pudo abrir el detalle', mensajeErrorPago(err));
    } finally { setCargandoDetalle(false); }
  };

  const decidir = async (pago: PagoPendienteRevision, decision: 'aprobar' | 'rechazar', motivoRechazo?: string) => {
    if (!puedeDecidirPago(pago)) {
      Alert.alert('Pago actualizado', 'Este pago ya no está en un estado revisable. Se actualizará el listado.');
      await cargarPagos(true);
      return;
    }
    const citaId = pago.citaId;
    if (bloqueos.current.has(citaId)) return;
    const actualizarYDetalle = async () => {
      await cargarPagos(true);
      if (detalle?.citaId === citaId) {
        const actualizada = await pagosCitasService.consultarDetalle(citaId);
        setDetalle(actualizada);
      }
    };
    setOcupadas((actual) => actual.includes(citaId) ? actual : [...actual, citaId]);
    try {
      const ejecutada = await ejecutarDecisionPago({ pago, decision, motivo: motivoRechazo, bloqueos: bloqueos.current, servicio: pagosCitasService, actualizar: actualizarYDetalle });
      if (ejecutada) {
        Alert.alert('Pago actualizado', decision === 'aprobar' ? 'El pago fue aprobado.' : 'El pago fue rechazado.');
        return true;
      }
      return false;
    } catch (err) {
      const conflicto = (err as { status?: number })?.status === 409;
      if (conflicto) setRechazo(null);
      Alert.alert((err as { status?: number })?.status === 409 ? 'Conflicto de estado' : 'No se pudo actualizar el pago', mensajeErrorPago(err));
      return conflicto;
    } finally {
      setOcupadas((actual) => actual.filter((id) => id !== citaId));
    }
  };

  const pedirAprobacion = (pago: PagoPendienteRevision) => {
    if (!puedeDecidirPago(pago) || ocupadas.includes(pago.citaId)) return;
    Alert.alert('Aprobar pago', `¿Confirmas aprobar ${formatearImportePago(pago.montoCentavos, pago.moneda)} para la cita ${pago.citaId}?`, [
      { text: 'Volver', style: 'cancel' }, { text: 'Aprobar', onPress: () => { void decidir(pago, 'aprobar'); } },
    ]);
  };

  const confirmarRechazo = () => {
    if (!rechazo || ocupadas.includes(rechazo.citaId)) return;
    let payload: { motivoRechazo: string };
    try { payload = crearPayloadRechazoPago(motivo); } catch (err) { Alert.alert('Revisa el motivo', (err as Error).message); return; }
    Alert.alert('Rechazar pago', `¿Confirmas rechazar el pago de la cita ${rechazo.citaId}? El motivo quedará en el historial.`, [
      { text: 'Volver', style: 'cancel' }, { text: 'Rechazar', style: 'destructive', onPress: () => { void decidir(rechazo, 'rechazar', payload.motivoRechazo).then((terminada) => { if (terminada) { setRechazo(null); setMotivo(''); } }); } },
    ]);
  };

  const actualizar = () => { setRefrescando(true); void cargarPagos(true); };

  return (
    <VetCareBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Volver al inicio" onPress={() => router.replace('/home')} style={styles.back}><Ionicons name="arrow-back" size={22} color="#1F2937" /></Pressable>
          <View style={styles.headerCopy}><Text style={styles.title}>Revisión de pagos</Text><Text style={styles.subtitle}>Pagos reportados para citas veterinarias</Text></View>
          <Pressable accessibilityLabel="Actualizar pagos" onPress={actualizar} style={styles.refresh}><Ionicons name="refresh" size={21} color={primary} /></Pressable>
        </View>
        {cargando ? <View style={styles.center}><ActivityIndicator size="large" color={primary} /><Text style={styles.muted}>Cargando pagos...</Text></View> : error ? <View style={styles.center}><Text style={styles.error}>{error}</Text><Pressable onPress={() => void cargarPagos()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Intentar nuevamente</Text></Pressable></View> : (
          <FlatList
            data={pagos}
            keyExtractor={(item) => item.citaId}
            contentContainerStyle={pagos.length ? styles.list : styles.emptyList}
            refreshControl={<RefreshControl refreshing={refrescando} onRefresh={actualizar} tintColor={primary} />}
            ListEmptyComponent={<View style={styles.center}><Ionicons name="receipt-outline" size={38} color="#9CA3AF" /><Text style={styles.title}>No hay pagos pendientes</Text><Text style={styles.muted}>Los pagos reportados aparecerán aquí.</Text></View>}
            renderItem={({ item }) => {
              const ocupado = ocupadas.includes(item.citaId);
              return <View style={styles.card}>
                <View style={styles.cardTop}><View><Text style={styles.cardTitle}>Cita {item.citaId}</Text><Text style={styles.amount}>{formatearImportePago(item.montoCentavos, item.moneda)}</Text></View><Text style={styles.badge}>{etiquetaEstadoPago(item.estado)}</Text></View>
                <Text style={styles.dataLine}>Cliente: {item.cliente?.nombre || item.cliente?.email || 'No disponible'}</Text>
                {item.cliente?.email && item.cliente?.nombre ? <Text style={styles.dataLine}>{item.cliente.email}</Text> : null}
                <Text style={styles.dataLine}>Servicio: {item.servicio?.nombre || 'No disponible'}</Text>
                <Text style={styles.dataLine}>Método: {item.metodoPago || 'No disponible'}{item.referencia ? ` · Ref. ${item.referencia}` : ''}</Text>
                <Text style={styles.dataLine}>Reportado: {formatearFechaPago(item.reportadoAt)}</Text>
                <View style={styles.actions}>
                  <Pressable onPress={() => void cargarDetalle(item)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Detalle e historial</Text></Pressable>
                  {puedeDecidirPago(item) && <>
                    <Pressable disabled={ocupado} onPress={() => pedirAprobacion(item)} style={[styles.approveButton, ocupado && styles.disabled]}>{ocupado ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Aprobar</Text>}</Pressable>
                    <Pressable disabled={ocupado} onPress={() => { setMotivo(''); setRechazo(item); }} style={[styles.rejectButton, ocupado && styles.disabled]}><Text style={styles.rejectButtonText}>Rechazar</Text></Pressable>
                  </>}
                </View>
              </View>;
            }}
          />
        )}

        <Modal visible={Boolean(rechazo)} transparent animationType="fade" onRequestClose={() => setRechazo(null)}>
          <View style={styles.modalBackdrop}><View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rechazar pago</Text><Text style={styles.muted}>Cita {rechazo?.citaId}. Indica el motivo que verá el cliente y quedará registrado.</Text>
            <TextInput value={motivo} onChangeText={setMotivo} multiline maxLength={500} placeholder="Motivo (3 a 500 caracteres)" style={styles.input} editable={!rechazo || !ocupadas.includes(rechazo.citaId)} />
            <Text style={[styles.counter, motivo.trim().length < 3 && styles.error]}>{motivo.trim().length}/500</Text>
            {rechazo && ocupadas.includes(rechazo.citaId) ? <ActivityIndicator color={primary} /> : null}
            <View style={styles.actions}><Pressable onPress={() => setRechazo(null)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Volver</Text></Pressable><Pressable onPress={confirmarRechazo} disabled={!rechazo || !puedeDecidirPago(rechazo) || ocupadas.includes(rechazo.citaId)} style={[styles.rejectButton, (!rechazo || !puedeDecidirPago(rechazo) || ocupadas.includes(rechazo.citaId)) && styles.disabled]}><Text style={styles.rejectButtonText}>Continuar</Text></Pressable></View>
          </View></View>
        </Modal>

        <Modal visible={Boolean(detalle) || cargandoDetalle} transparent animationType="slide" onRequestClose={() => setDetalle(null)}>
          <View style={styles.modalBackdrop}><View style={[styles.modalCard, styles.detailModal]}>
            <View style={styles.detailHeader}><Text style={styles.modalTitle}>Detalle e historial</Text><Pressable accessibilityLabel="Cerrar detalle" onPress={() => setDetalle(null)}><Ionicons name="close" size={24} color="#4B5563" /></Pressable></View>
            {cargandoDetalle ? <ActivityIndicator size="large" color={primary} /> : detalle ? <ScrollView>
              <Text style={styles.sectionTitle}>Pago · cita {detalle.citaId}</Text>
              <Text style={styles.dataLine}>Estado: {etiquetaEstadoPago(detalle.estado)}</Text>
              <Text style={styles.dataLine}>Cliente: {detalle.cliente?.nombre || detalle.cliente?.email || pagos.find((p) => p.citaId === detalle.citaId)?.cliente?.nombre || pagos.find((p) => p.citaId === detalle.citaId)?.cliente?.email || 'Información no disponible'}</Text>
              {(detalle.cliente?.email || pagos.find((p) => p.citaId === detalle.citaId)?.cliente?.email) ? <Text style={styles.dataLine}>Correo: {detalle.cliente?.email || pagos.find((p) => p.citaId === detalle.citaId)?.cliente?.email}</Text> : null}
              <Text style={styles.dataLine}>Servicio: {detalle.servicioNombre || detalle.servicio?.nombre || 'No disponible'}</Text>
              <Text style={styles.dataLine}>Tarifa histórica: {formatearImportePago(detalle.montoCentavos, detalle.moneda)}</Text>
              <Text style={styles.dataLine}>Método: {detalle.metodoPago || 'No disponible'}</Text>
              {detalle.referencia ? <Text style={styles.dataLine}>Referencia: {detalle.referencia}</Text> : null}
              <Text style={styles.dataLine}>Reportado: {formatearFechaPago(detalle.reportadoAt)}</Text>
              {detalle.verificadoAt ? <Text style={styles.dataLine}>Verificado: {formatearFechaPago(detalle.verificadoAt)}</Text> : null}
              {detalle.verificadorRol ? <Text style={styles.dataLine}>Verificador: {detalle.verificadorRol}{detalle.verificadorUid ? ` · ${detalle.verificadorUid}` : ''}</Text> : null}
              {detalle.motivoRechazo ? <Text style={styles.dataLine}>Motivo de rechazo: {detalle.motivoRechazo}</Text> : null}
              <Text style={styles.sectionTitle}>Historial de eventos</Text>
              {detalle.historial?.length ? detalle.historial.map((evento: EventoPagoRevision, index) => <View key={evento.id || `${evento.createdAt}-${evento.tipo}-${index}`} style={styles.event}>
                <Text style={styles.cardTitle}>{etiquetaEventoPago(evento.tipo)}</Text>
                {evento.estadoAnterior || evento.estado ? <Text style={styles.dataLine}>Estado: {evento.estadoAnterior ? `${etiquetaEstadoPago(evento.estadoAnterior)} → ` : ''}{evento.estado ? etiquetaEstadoPago(evento.estado) : ''}</Text> : null}
                {evento.montoCentavos !== undefined ? <Text style={styles.dataLine}>Importe: {formatearImportePago(evento.montoCentavos, evento.moneda || 'USD')}</Text> : null}
                {evento.metodoPago ? <Text style={styles.dataLine}>Método: {evento.metodoPago}</Text> : null}
                {evento.referencia ? <Text style={styles.dataLine}>Referencia: {evento.referencia}</Text> : null}
                {evento.actorRol ? <Text style={styles.dataLine}>Actor: {evento.actorRol}{evento.actorUid ? ` · ${evento.actorUid}` : ''}</Text> : null}
                {evento.motivoRechazo ? <Text style={styles.dataLine}>Motivo: {evento.motivoRechazo}</Text> : null}
                <Text style={styles.muted}>{formatearFechaPago(evento.createdAt)}</Text>
              </View>) : <Text style={styles.muted}>No hay eventos registrados.</Text>}
              {puedeDecidirPago(detalle) && <View style={styles.actions}>
                <Pressable onPress={() => { setDetalle(null); pedirAprobacion(detalle); }} style={styles.approveButton}><Text style={styles.primaryButtonText}>Aprobar</Text></Pressable>
                <Pressable onPress={() => { const pago = pagos.find((p) => p.citaId === detalle.citaId); setDetalle(null); setMotivo(''); if (pago) setRechazo(pago); }} style={styles.rejectButton}><Text style={styles.rejectButtonText}>Rechazar</Text></Pressable>
              </View>}
            </ScrollView> : <Text style={styles.muted}>No se encontró información del pago.</Text>}
          </View></View>
        </Modal>
      </SafeAreaView>
    </VetCareBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, gap: 12 }, back: { padding: 8 }, headerCopy: { flex: 1 }, title: { color: '#1F2937', fontSize: 20, fontWeight: '700' }, subtitle: { color: '#6B7280', fontSize: 13, marginTop: 3 }, refresh: { padding: 10 },
  list: { paddingHorizontal: 16, paddingBottom: 28 }, emptyList: { flexGrow: 1, justifyContent: 'center', padding: 24 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 }, muted: { color: '#6B7280', fontSize: 14, lineHeight: 20 }, error: { color: '#B91C1C', fontSize: 14, textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 12, gap: 6 }, cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }, cardTitle: { color: '#1F2937', fontSize: 15, fontWeight: '700' }, amount: { color: primary, fontSize: 20, fontWeight: '700', marginTop: 5 }, badge: { color: '#92400E', backgroundColor: '#FEF3C7', borderRadius: 14, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, fontWeight: '700' }, dataLine: { color: '#4B5563', fontSize: 13, lineHeight: 19 }, actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 },
  primaryButton: { backgroundColor: primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 }, primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', textAlign: 'center' }, secondaryButton: { borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }, secondaryButtonText: { color: '#334155', fontSize: 13, fontWeight: '600' }, approveButton: { backgroundColor: '#15803D', borderRadius: 10, minWidth: 78, alignItems: 'center', paddingHorizontal: 13, paddingVertical: 10 }, rejectButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DC2626', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10 }, rejectButtonText: { color: '#B91C1C', fontSize: 13, fontWeight: '700' }, disabled: { opacity: 0.5 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', padding: 20 }, modalCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20, gap: 12, maxHeight: '88%' }, detailModal: { minHeight: '45%' }, modalTitle: { color: '#111827', fontWeight: '700', fontSize: 19 }, input: { minHeight: 112, maxHeight: 180, textAlignVertical: 'top', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 12, color: '#1F2937' }, counter: { textAlign: 'right', color: '#6B7280', fontSize: 12 }, detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { color: '#1F2937', fontWeight: '700', fontSize: 15, marginTop: 12, marginBottom: 4 }, event: { borderLeftWidth: 3, borderLeftColor: primary, paddingLeft: 12, paddingVertical: 7, marginTop: 6, gap: 3 },
});

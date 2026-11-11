import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { consultarPagoCita, reportarPagoCita } from '@/features/citas/services/citas.service';
import {
  crearPayloadReportePago,
  ejecutarUnaVez,
  etiquetaEstadoPago,
  formatearMontoPagoCita,
  METODOS_PAGO_CITA,
  puedeReportarPagoCita,
  PagoCita,
  tieneTarifaCita,
} from '@/features/citas/utils/pago-cita';

type CitaConTarifa = {
  id: string;
  estado?: string;
  servicioId?: string;
  servicioNombre?: string;
  precioCentavos?: number;
  moneda?: string;
};

const palette = {
  primary: Colors.light.primary,
  text: '#1F2937',
  secondary: '#6B7280',
  border: '#E5E7EB',
  green: '#15803D',
  red: '#B91C1C',
  white: '#FFFFFF',
};

export function PagoCitaCard({ cita }: { cita: CitaConTarifa }) {
  const [pago, setPago] = useState<PagoCita | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [metodoPago, setMetodoPago] = useState<string>('Efectivo');
  const [referencia, setReferencia] = useState('');
  const [error, setError] = useState('');
  const [consultaCorrecta, setConsultaCorrecta] = useState(false);
  const [exito, setExito] = useState('');
  const bloqueos = useRef(new Set<string>());
  const tarifaValida = tieneTarifaCita(cita);

  const cargarPago = useCallback(async () => {
    if (!tarifaValida) {
      setPago(null);
      setCargando(false);
      return;
    }
    setCargando(true);
    setError('');
    try {
      const response = await consultarPagoCita(cita.id);
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || body.mensaje || 'No se pudo consultar el pago.');
      setPago(body.data || null);
      setConsultaCorrecta(true);
    } catch (err: any) {
      setConsultaCorrecta(false);
      setError(err?.message || 'No se pudo consultar el pago.');
    } finally {
      setCargando(false);
    }
  }, [cita.id, tarifaValida]);

  useEffect(() => {
    const timer = setTimeout(() => { void cargarPago(); }, 0);
    return () => clearTimeout(timer);
  }, [cargarPago]);

  const enviar = async () => {
    if (!puedeReportarPagoCita(pago)) return;
    await ejecutarUnaVez(bloqueos.current, cita.id, async () => {
      setEnviando(true);
      setError('');
      setExito('');
      try {
        const payload = crearPayloadReportePago(metodoPago, referencia);
        const response = await reportarPagoCita(cita.id, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const body = await response.json();
        if (!response.ok) {
          const errorReporte: any = new Error(body.message || body.mensaje || 'No se pudo reportar el pago.');
          errorReporte.status = response.status;
          throw errorReporte;
        }
        setPago(body.data || null);
        setExito('Pago reportado. Queda pendiente de revisión y aún no está aprobado.');
      } catch (err: any) {
        const mensaje = err?.message || 'No se pudo reportar el pago.';
        setError(mensaje);
        if (err?.status === 409) {
          await cargarPago();
          setError(mensaje);
        }
      } finally {
        setEnviando(false);
      }
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Ionicons name="card-outline" size={22} color={palette.primary} />
        <Text style={styles.title}>Pago de la cita</Text>
      </View>
      {!tarifaValida ? (
        <Text style={styles.body}>Esta cita histórica no tiene servicio ni tarifa registrados. La información de la cita sigue disponible.</Text>
      ) : (
        <>
          <Text style={styles.service}>{cita.servicioNombre}</Text>
          <Text style={styles.amount}>{formatearMontoPagoCita(pago?.montoCentavos ?? cita.precioCentavos!)}</Text>
          {cargando ? <ActivityIndicator color={palette.primary} style={styles.loader} /> : (
            <>
              {consultaCorrecta ? <Text style={styles.body}>Estado del pago: <Text style={styles.state}>{etiquetaEstadoPago(pago?.estado)}</Text></Text> : null}
              {pago?.metodoPago ? <Text style={styles.body}>Método reportado: {pago.metodoPago}</Text> : null}
              {pago?.estado === 'rechazado' && pago.motivoRechazo ? <Text style={styles.error}>Motivo: {pago.motivoRechazo}</Text> : null}
              {exito ? <Text accessibilityRole="text" style={styles.success}>{exito}</Text> : null}
              {!consultaCorrecta ? <Pressable onPress={cargarPago} style={styles.retry}><Text style={styles.retryText}>Reintentar consulta</Text></Pressable> : null}
              {consultaCorrecta && cita.estado === 'completada' && puedeReportarPagoCita(pago) ? (
                <View style={styles.form}>
                  <Text style={styles.body}>El reporte requiere revisión del personal; no confirma la aprobación del pago.</Text>
                  <Text style={styles.label}>Método de pago</Text>
                  <View style={styles.methods}>
                    {METODOS_PAGO_CITA.map((metodo) => (
                      <Pressable key={metodo} onPress={() => setMetodoPago(metodo)} style={[styles.method, metodoPago === metodo && styles.methodSelected]} accessibilityRole="button" accessibilityState={{ selected: metodoPago === metodo }}>
                        <Text style={[styles.methodText, metodoPago === metodo && styles.methodTextSelected]}>{metodo}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.label}>Referencia (opcional)</Text>
                  <TextInput value={referencia} onChangeText={setReferencia} maxLength={200} style={styles.input} placeholder="Referencia" editable={!enviando} />
                  {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
                  <Pressable onPress={enviar} disabled={enviando} style={[styles.submit, enviando && styles.disabled]} accessibilityRole="button">
                    {enviando ? <ActivityIndicator color={palette.white} /> : <Text style={styles.submitText}>{pago?.estado === 'rechazado' ? 'Volver a reportar' : 'Reportar pago'}</Text>}
                  </Pressable>
                </View>
              ) : null}
              {consultaCorrecta && pago === null && cita.estado !== 'completada' ? <Text style={styles.body}>El reporte de pago estará disponible cuando la cita se complete.</Text> : null}
              {error && (!consultaCorrecta || !puedeReportarPagoCita(pago)) ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 20, padding: 16, backgroundColor: palette.white, borderRadius: 16, borderWidth: 1, borderColor: palette.border },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '700', color: palette.text },
  service: { fontSize: 15, fontWeight: '600', color: palette.text },
  amount: { marginTop: 4, fontSize: 20, fontWeight: '700', color: palette.primary },
  state: { fontWeight: '700', color: palette.text },
  body: { marginTop: 8, fontSize: 13, color: palette.secondary, lineHeight: 19 },
  loader: { marginVertical: 14 },
  form: { marginTop: 14, borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 12 },
  label: { marginTop: 12, marginBottom: 6, fontSize: 13, fontWeight: '600', color: palette.text },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  method: { borderWidth: 1, borderColor: palette.border, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
  methodSelected: { borderColor: palette.primary, backgroundColor: '#EFF6FF' },
  methodText: { color: palette.secondary, fontSize: 12 },
  methodTextSelected: { color: palette.primary, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: palette.border, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9, color: palette.text },
  error: { marginTop: 9, color: palette.red, fontSize: 13 },
  success: { marginTop: 9, color: palette.green, fontSize: 13 },
  submit: { marginTop: 13, minHeight: 44, borderRadius: 11, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: palette.white, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  retry: { marginTop: 10, paddingVertical: 8 },
  retryText: { color: palette.primary, fontWeight: '600' },
});

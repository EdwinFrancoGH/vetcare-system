import React, { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { VetCareBackground } from '@/components/vetcare-background';
import { AccesoClienteCitas } from '@/features/citas/components/acceso-cliente-citas';
import { Colors } from '@/constants/theme';
import { auth } from '@/config/firebase';
import { cancelarPedidoPropio, obtenerMisPedidos, type PedidoCliente } from '@/features/compras/services/compras.service';
import {
  categoriaEstadoPedido,
  clasificarErrorCancelacion,
  etiquetaEstadoPedido,
  ejecutarCancelacionUnica,
  formatearFechaPedido,
  formatearImportePedido,
  ErrorRespuestaPedidos,
  pedidoPuedeCancelarse,
  reemplazarPedidoEnHistorial,
  sesionPerteneceAUsuario,
} from '@/features/compras/utils/historial-pedidos';

const colors = Colors.light;
type EstadoPantalla = 'cargando' | 'listo' | 'error' | 'denegado';

export default function HistorialPedidosScreen() {
  return <AccesoClienteCitas><HistorialPedidosClienteScreen /></AccesoClienteCitas>;
}

function HistorialPedidosClienteScreen() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<PedidoCliente[]>([]);
  const [uidPedidos, setUidPedidos] = useState('');
  const [estadoPantalla, setEstadoPantalla] = useState<EstadoPantalla>('cargando');
  const [mensajeError, setMensajeError] = useState('');
  const [intento, setIntento] = useState(0);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const cancelacionesEnCurso = React.useRef(new Set<string>());
  const isFocused = useIsFocused();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      setPedidos([]);
      setUidPedidos('');
      setMensajeError('');
      setEstadoPantalla('cargando');
      setIntento((actual) => actual + 1);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let activa = true;
    if (!isFocused) return () => { activa = false; };
    void Promise.resolve().then(async () => {
      if (!activa) return;
      const usuario = auth.currentUser;
      if (!usuario) {
        setEstadoPantalla('denegado');
        return;
      }
      const uid = usuario.uid;
      setEstadoPantalla('cargando');
      setMensajeError('');
      try {
        const lista = await obtenerMisPedidos();
        if (!activa || !sesionPerteneceAUsuario(uid, auth.currentUser?.uid)) return;
        setPedidos(lista);
        setUidPedidos(uid);
        setEstadoPantalla('listo');
      } catch (error: unknown) {
        if (!activa || !sesionPerteneceAUsuario(uid, auth.currentUser?.uid)) return;
        setMensajeError(error instanceof Error ? error.message : 'No se pudo cargar tu historial.');
        setUidPedidos(uid);
        setEstadoPantalla('error');
      }
    });
    return () => { activa = false; };
  }, [intento, isFocused]);

  const uidActual = auth.currentUser?.uid || '';
  const datosVisibles = Boolean(uidActual && uidActual === uidPedidos);
  const pedidosVisibles = datosVisibles ? pedidos : [];

  const ejecutarCancelacion = async (pedido: PedidoCliente) => {
    if (!pedidoPuedeCancelarse(pedido) || cancelacionesEnCurso.current.has(pedido.id)) return;
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert('Sesión expirada', 'Inicia sesión nuevamente para cancelar el pedido.');
      return;
    }
    const operacion = ejecutarCancelacionUnica(
      pedido.id,
      cancelacionesEnCurso.current,
      () => cancelarPedidoPropio(pedido.id),
    );
    setCancelandoId(pedido.id);
    try {
      const resultado = await operacion;
      if (!resultado.ejecutada || !resultado.resultado) return;
      if (!sesionPerteneceAUsuario(uid, auth.currentUser?.uid)) return;

      setPedidos((actuales) => reemplazarPedidoEnHistorial(actuales, resultado.resultado!));
      setMensajeError('');
      try {
        const actualizados = await obtenerMisPedidos();
        if (sesionPerteneceAUsuario(uid, auth.currentUser?.uid)) {
          setPedidos(reemplazarPedidoEnHistorial(actualizados, resultado.resultado));
        }
      } catch {
        // La respuesta PUT ya confirmó el estado; se conserva ese pedido visible.
      }
      if (sesionPerteneceAUsuario(uid, auth.currentUser?.uid)) {
        Alert.alert('Pedido cancelado', `El pedido #${pedido.id.slice(-8).toUpperCase()} fue cancelado.`);
      }
    } catch (error: unknown) {
      if (!sesionPerteneceAUsuario(uid, auth.currentUser?.uid)) return;
      const status = error instanceof ErrorRespuestaPedidos ? error.status : undefined;
      const tipoError = clasificarErrorCancelacion(status);
      const mensaje = error instanceof Error ? error.message : 'No se pudo cancelar el pedido.';
      if (tipoError === 'estado_cambio') {
        Alert.alert('El pedido cambió de estado', `${mensaje} Actualizaremos el historial para mostrar su estado actual.`);
      } else if (tipoError === 'sesion') {
        Alert.alert('Sesión o permiso requerido', `${mensaje} No se cambió el estado del pedido en la aplicación.`);
      } else if (tipoError === 'no_encontrado') {
        Alert.alert('Pedido no disponible', 'El pedido ya no está disponible para esta cuenta. Actualizaremos el historial.');
      } else {
        Alert.alert('No se pudo cancelar', mensaje);
      }
      try {
        const actualizados = await obtenerMisPedidos();
        if (sesionPerteneceAUsuario(uid, auth.currentUser?.uid)) setPedidos(actualizados);
      } catch {
        // El historial no se altera si tampoco se pudo consultar su estado actual.
      }
    } finally {
      if (sesionPerteneceAUsuario(uid, auth.currentUser?.uid)) setCancelandoId(null);
    }
  };

  const solicitarCancelacion = (pedido: PedidoCliente) => {
    if (!pedidoPuedeCancelarse(pedido) || cancelacionesEnCurso.current.has(pedido.id)) return;
    Alert.alert(
      '¿Cancelar pedido?',
      `¿Quieres cancelar el pedido #${pedido.id.slice(-8).toUpperCase()}? El Backend confirmará la cancelación y la reposición de existencias.`,
      [
        { text: 'Conservar pedido', style: 'cancel' },
        { text: 'Cancelar pedido', style: 'destructive', onPress: () => { void ejecutarCancelacion(pedido); } },
      ],
    );
  };

  return (
    <VetCareBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.replace('/tienda')} accessibilityRole="button" accessibilityLabel="Volver a la tienda">
              <Ionicons name="arrow-back" size={21} color={colors.primary} />
            </Pressable>
            <View style={styles.heading}>
              <Text style={styles.title}>Mis pedidos</Text>
              <Text style={styles.subtitle}>Historial de compras</Text>
            </View>
            <Pressable style={styles.refreshButton} onPress={() => setIntento((actual) => actual + 1)} accessibilityRole="button" accessibilityLabel="Actualizar historial">
              <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>

          {estadoPantalla === 'denegado' ? (
            <View style={styles.centerState}>
              <Ionicons name="lock-closed-outline" size={42} color="#9CA3AF" />
              <Text style={styles.stateTitle}>Historial no disponible</Text>
              <Text style={styles.stateMessage}>Esta pantalla está disponible para cuentas Cliente.</Text>
              <Pressable style={styles.primaryButton} onPress={() => router.replace('/home')}><Text style={styles.primaryButtonText}>Ir al inicio</Text></Pressable>
            </View>
          ) : estadoPantalla === 'error' ? (
            <View style={styles.centerState}>
              <Ionicons name="cloud-offline-outline" size={42} color={colors.error} />
              <Text style={styles.stateTitle}>No se pudo cargar el historial</Text>
              <Text style={styles.stateMessage}>{mensajeError}</Text>
              <Pressable style={styles.primaryButton} onPress={() => setIntento((actual) => actual + 1)}><Text style={styles.primaryButtonText}>Intentar nuevamente</Text></Pressable>
            </View>
          ) : estadoPantalla === 'cargando' && !datosVisibles ? (
            <View style={styles.centerState}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.stateMessage}>Cargando tus pedidos…</Text></View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={estadoPantalla === 'cargando'} onRefresh={() => setIntento((actual) => actual + 1)} tintColor={colors.primary} />}
            >
              {estadoPantalla === 'cargando' ? <ActivityIndicator style={styles.inlineLoader} color={colors.primary} /> : null}
              {pedidosVisibles.length ? pedidosVisibles.map((pedido) => <TarjetaPedido key={pedido.id} pedido={pedido} cancelando={cancelandoId === pedido.id} onCancelar={solicitarCancelacion} />) : estadoPantalla === 'listo' ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}><Ionicons name="receipt-outline" size={31} color={colors.primary} /></View>
                  <Text style={styles.stateTitle}>Todavía no tienes pedidos</Text>
                  <Text style={styles.stateMessage}>Cuando hagas una compra, aparecerá aquí con sus productos y estado.</Text>
                  <Pressable style={styles.primaryButton} onPress={() => router.replace('/tienda')}><Text style={styles.primaryButtonText}>Ir a la tienda</Text></Pressable>
                </View>
              ) : null}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </VetCareBackground>
  );
}

function TarjetaPedido({
  pedido,
  cancelando = false,
  onCancelar,
}: {
  pedido: PedidoCliente;
  cancelando?: boolean;
  onCancelar?: (pedido: PedidoCliente) => void;
}) {
  const estado = categoriaEstadoPedido(pedido.estado);
  const label = etiquetaEstadoPedido(pedido.estado);
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderHeading}>
          <View style={styles.orderIcon}><Ionicons name="receipt-outline" size={17} color={colors.primary} /></View>
          <View style={styles.orderIdGroup}>
            <Text style={styles.orderId}>Pedido #{pedido.id.slice(-8).toUpperCase()}</Text>
            <Text style={styles.orderDate}>{formatearFechaPedido(pedido.fechaPedido)}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, styles[`status_${estado}`]]}>
          <Text style={[styles.statusText, styles[`statusText_${estado}`]]}>{label}</Text>
        </View>
      </View>

      <View style={styles.products}>
        {pedido.productos.map((producto, index) => (
          <View key={`${producto.productoId}-${index}`} style={styles.productRow}>
            <View style={styles.productCopy}>
              <Text style={styles.productName}>{producto.nombre}</Text>
              <Text style={styles.productMeta}>{producto.cantidad} × {formatearImportePedido(producto.precioUnitario)}</Text>
            </View>
            <Text style={styles.productSubtotal}>{formatearImportePedido(producto.subtotal)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.paymentInfo}>
          {pedido.metodoPago ? <Text style={styles.paymentText}>{pedido.metodoPago}</Text> : null}
          {typeof pedido.pagado === 'boolean' ? <Text style={styles.paymentText}>{pedido.pagado ? 'Pagado' : 'Pendiente de cobro'}</Text> : null}
        </View>
        <View style={styles.totalGroup}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatearImportePedido(pedido.total)}</Text>
        </View>
      </View>
      {pedido.motivoCancelacion ? <Text style={styles.cancelReason}>{pedido.motivoCancelacion}</Text> : null}
      {pedidoPuedeCancelarse(pedido) ? (
        <Pressable
          style={[styles.cancelButton, cancelando && styles.cancelButtonDisabled]}
          onPress={() => onCancelar?.(pedido)}
          disabled={cancelando}
          accessibilityRole="button"
          accessibilityLabel="Cancelar pedido pendiente"
        >
          {cancelando ? <ActivityIndicator size="small" color={colors.error} /> : <Ionicons name="close-circle-outline" size={18} color={colors.error} />}
          <Text style={styles.cancelButtonText}>{cancelando ? 'Cancelando…' : 'Cancelar pedido'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  screen: { flex: 1, backgroundColor: 'transparent' },
  header: { minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1 },
  title: { color: '#1F2937', fontSize: 23, lineHeight: 28, fontWeight: '800' },
  subtitle: { color: '#6B7280', fontSize: 13, marginTop: 1 },
  refreshButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 30, gap: 12 },
  inlineLoader: { marginVertical: 8 },
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#E5E7EB', elevation: 2, shadowColor: '#000000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  orderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  orderHeading: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  orderIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  orderIdGroup: { flex: 1 },
  orderId: { color: '#1F2937', fontSize: 14, fontWeight: '800' },
  orderDate: { color: '#6B7280', fontSize: 11, marginTop: 3 },
  statusBadge: { maxWidth: 135, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 },
  status_pendiente: { backgroundColor: '#FEF3C7' },
  status_listo: { backgroundColor: '#DBEAFE' },
  status_entregado: { backgroundColor: '#DCFCE7' },
  status_cancelado: { backgroundColor: '#FEE2E2' },
  status_desconocido: { backgroundColor: '#F3F4F6' },
  statusText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  statusText_pendiente: { color: '#92400E' },
  statusText_listo: { color: '#1E40AF' },
  statusText_entregado: { color: '#166534' },
  statusText_cancelado: { color: '#991B1B' },
  statusText_desconocido: { color: '#4B5563' },
  products: { paddingTop: 5 },
  productRow: { minHeight: 51, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  productCopy: { flex: 1 },
  productName: { color: '#1F2937', fontSize: 13, fontWeight: '600' },
  productMeta: { color: '#6B7280', fontSize: 11, marginTop: 3 },
  productSubtotal: { color: '#334155', fontSize: 13, fontWeight: '700' },
  orderFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, paddingTop: 12 },
  paymentInfo: { flex: 1, gap: 3 },
  paymentText: { color: '#6B7280', fontSize: 11, lineHeight: 15 },
  totalGroup: { alignItems: 'flex-end' },
  totalLabel: { color: '#6B7280', fontSize: 11 },
  totalAmount: { color: '#1E3A8A', fontSize: 19, fontWeight: '800', marginTop: 2 },
  cancelReason: { color: '#92400E', fontSize: 11, marginTop: 10 },
  cancelButton: { minHeight: 42, marginTop: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FEF2F2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  cancelButtonDisabled: { opacity: 0.65 },
  cancelButtonText: { color: colors.error, fontSize: 13, fontWeight: '700' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 12 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 58, gap: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  stateTitle: { color: '#1F2937', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  stateMessage: { color: '#6B7280', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  primaryButton: { marginTop: 6, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 11, backgroundColor: colors.primary },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});

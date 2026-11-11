import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VetCareBackground } from '@/components/vetcare-background';
import { AccesoClienteCitas } from '@/features/citas/components/acceso-cliente-citas';
import { Colors } from '@/constants/theme';
import { auth } from '@/config/firebase';
import { obtenerProductoTienda, type ProductoTienda } from '@/features/compras/services/tienda.service';
import { crearGestorCarritoPersistente } from '@/features/compras/services/carrito-persistente';
import { crearGestorPedidoPendiente } from '@/features/compras/services/operacion-pendiente';
import {
  agregarProductoDesdeDetalle,
  iconoCategoriaProducto,
  limitarCantidadProducto,
  resolverImagenProducto,
} from '@/features/compras/utils/producto-tienda';

const colors = Colors.light;
const carritoPersistente = crearGestorCarritoPersistente(AsyncStorage);
const operacionesPendientes = crearGestorPedidoPendiente(AsyncStorage);

export default function DetalleProductoScreen() {
  return <AccesoClienteCitas><DetalleProductoClienteScreen /></AccesoClienteCitas>;
}

function DetalleProductoClienteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [producto, setProducto] = useState<ProductoTienda | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [agregando, setAgregando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let activa = true;
    if (!id) return () => { activa = false; };
    void obtenerProductoTienda(id).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'No se pudo cargar el producto.');
      if (activa) setProducto(data.data || null);
    }).catch((err: unknown) => {
      if (activa) setError(err instanceof Error ? err.message : 'No se pudo cargar el producto.');
    }).finally(() => {
      if (activa) setCargando(false);
    });
    return () => { activa = false; };
  }, [id]);

  const stock = Math.max(0, Number(producto?.stock) || 0);
  const cantidadDisponible = limitarCantidadProducto(cantidad, stock);

  const agregar = async () => {
    const uid = auth.currentUser?.uid;
    if (!producto || !uid || !cantidadDisponible || agregando) {
      if (!uid) Alert.alert('Inicia sesión', 'Vuelve a iniciar sesión para agregar productos al carrito.');
      return;
    }
    try {
      setAgregando(true);
      const totalEnCarrito = await agregarProductoDesdeDetalle(
        uid,
        producto,
        cantidadDisponible,
        operacionesPendientes,
        carritoPersistente,
      );
      if (!totalEnCarrito) throw new Error('No hay existencias disponibles para agregar.');
      Alert.alert('Producto agregado', `${producto.nombre} · ${totalEnCarrito} ${totalEnCarrito === 1 ? 'unidad' : 'unidades'} en el carrito.`);
      router.back();
    } catch (err: unknown) {
      Alert.alert('No se pudo agregar', err instanceof Error ? err.message : 'Intenta nuevamente.');
    } finally {
      setAgregando(false);
    }
  };

  return (
    <VetCareBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Volver a la tienda">
              <Ionicons name="arrow-back" size={21} color={colors.primary} />
            </Pressable>
            <Text style={styles.headerTitle}>Detalle del producto</Text>
            <View style={styles.headerSpacer} />
          </View>

          {!id ? (
            <View style={styles.center}>
              <Ionicons name="alert-circle-outline" size={38} color={colors.error} />
              <Text style={styles.error}>No se indicó el producto.</Text>
              <Pressable style={styles.secondaryButton} onPress={() => router.back()}><Text style={styles.secondaryButtonText}>Volver al catálogo</Text></Pressable>
            </View>
          ) : cargando ? (
            <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.muted}>Cargando producto…</Text></View>
          ) : error || !producto ? (
            <View style={styles.center}>
              <Ionicons name="alert-circle-outline" size={38} color={colors.error} />
              <Text style={styles.error}>{error || 'Producto no encontrado.'}</Text>
              <Pressable style={styles.secondaryButton} onPress={() => router.back()}><Text style={styles.secondaryButtonText}>Volver al catálogo</Text></Pressable>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <ImagenDetalle producto={producto} />
              <View style={styles.infoCard}>
                <Text style={styles.category}>{producto.categoria || 'General'}</Text>
                <Text style={styles.name}>{producto.nombre}</Text>
                <Text style={styles.description}>{producto.descripcion?.trim() || 'Sin descripción disponible.'}</Text>
                <View style={styles.priceStockRow}>
                  <Text style={styles.price}>${(Number(producto.precio) || 0).toFixed(2)}</Text>
                  <View style={[styles.stockBadge, stock > 0 ? styles.stockAvailable : styles.stockEmpty]}>
                    <Text style={[styles.stockText, stock > 0 ? styles.stockTextAvailable : styles.stockTextEmpty]}>
                      {stock > 0 ? `${stock} disponibles` : 'Agotado'}
                    </Text>
                  </View>
                </View>

                {stock > 0 ? (
                  <View style={styles.purchaseRow}>
                    <View style={styles.quantityControl}>
                      <Pressable
                        onPress={() => setCantidad((actual) => Math.max(1, actual - 1))}
                        disabled={cantidad <= 1 || agregando}
                        style={styles.quantityButton}
                        accessibilityRole="button"
                        accessibilityLabel="Reducir cantidad"
                      ><Ionicons name="remove" size={19} color={colors.primary} /></Pressable>
                      <Text style={styles.quantity}>{cantidadDisponible}</Text>
                      <Pressable
                        onPress={() => setCantidad((actual) => limitarCantidadProducto(actual + 1, stock))}
                        disabled={cantidadDisponible >= Math.min(stock, 20) || agregando}
                        style={styles.quantityButton}
                        accessibilityRole="button"
                        accessibilityLabel="Aumentar cantidad"
                      ><Ionicons name="add" size={19} color={colors.primary} /></Pressable>
                    </View>
                    <Pressable style={[styles.addButton, agregando && styles.disabledButton]} onPress={agregar} disabled={agregando || !cantidadDisponible} accessibilityRole="button">
                      {agregando ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="bag-add-outline" size={19} color="#FFFFFF" /><Text style={styles.addButtonText}>Agregar al carrito</Text></>}
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.unavailable}>Este producto no tiene existencias disponibles.</Text>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </VetCareBackground>
  );
}

function ImagenDetalle({ producto }: { producto: ProductoTienda }) {
  const [fallo, setFallo] = useState(false);
  const source = resolverImagenProducto(producto.imagenUrl, fallo);
  return (
    <View style={styles.heroImage}>
      {source ? (
        <Image source={source} style={styles.heroImageContent} resizeMode="cover" onError={() => setFallo(true)} accessibilityLabel={`Imagen de ${producto.nombre}`} />
      ) : (
        <Ionicons name={iconoCategoriaProducto(producto.categoria)} size={62} color={colors.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  screen: { flex: 1, backgroundColor: 'transparent' },
  header: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#1F2937', fontSize: 17, fontWeight: '700' },
  headerSpacer: { width: 40 },
  content: { padding: 18, paddingBottom: 32 },
  heroImage: { height: 270, borderRadius: 20, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroImageContent: { width: '100%', height: '100%' },
  infoCard: { marginTop: 16, borderRadius: 18, backgroundColor: '#FFFFFF', padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  category: { alignSelf: 'flex-start', color: colors.primary, backgroundColor: '#EFF6FF', overflow: 'hidden', borderRadius: 13, paddingHorizontal: 11, paddingVertical: 5, fontSize: 12, fontWeight: '700' },
  name: { color: '#1F2937', fontSize: 23, lineHeight: 29, fontWeight: '800', marginTop: 12 },
  description: { color: '#6B7280', fontSize: 14, lineHeight: 21, marginTop: 11 },
  priceStockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, gap: 12 },
  price: { color: '#1E3A8A', fontSize: 24, fontWeight: '800' },
  stockBadge: { borderRadius: 12, paddingHorizontal: 11, paddingVertical: 7 },
  stockAvailable: { backgroundColor: '#DCFCE7' },
  stockEmpty: { backgroundColor: '#FEF3C7' },
  stockText: { fontSize: 12, fontWeight: '700' },
  stockTextAvailable: { color: '#166534' },
  stockTextEmpty: { color: '#92400E' },
  purchaseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DBEAFE', borderRadius: 12, backgroundColor: '#F8FAFC' },
  quantityButton: { width: 42, height: 46, alignItems: 'center', justifyContent: 'center' },
  quantity: { minWidth: 26, textAlign: 'center', color: '#1F2937', fontSize: 15, fontWeight: '700' },
  addButton: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 12 },
  addButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  disabledButton: { opacity: 0.65 },
  unavailable: { color: '#92400E', backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12, marginTop: 18, fontSize: 13, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  muted: { color: '#6B7280', fontSize: 14, marginTop: 8 },
  error: { color: '#991B1B', fontSize: 14, textAlign: 'center' },
  secondaryButton: { paddingHorizontal: 15, paddingVertical: 11, borderRadius: 11, backgroundColor: '#EFF6FF', marginTop: 5 },
  secondaryButtonText: { color: colors.primary, fontWeight: '700' },
});

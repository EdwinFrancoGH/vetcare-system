import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { VetCareBackground } from '@/components/vetcare-background';
import { AccesoClienteCitas } from '@/features/citas/components/acceso-cliente-citas';
import { Colors } from '@/constants/theme';
import { auth } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clasificarErrorPedidoHttp, crearPedidoTienda, obtenerCatalogoTienda, type ProductoTienda } from '@/features/compras/services/tienda.service';
import { crearGestorPedidoPendiente } from '@/features/compras/services/operacion-pendiente';
import { crearGestorCarritoPersistente } from '@/features/compras/services/carrito-persistente';
import {
  actualizarCarritoConCatalogo,
  compararCarritoConCatalogo,
  iconoCategoriaProducto,
  problemasCarritoActualizado,
  productoActivoDisponible,
  resolverImagenProducto,
} from '@/features/compras/utils/producto-tienda';

const colors = Colors.light;
const operacionesPendientes = crearGestorPedidoPendiente(AsyncStorage);
const carritoPersistente = crearGestorCarritoPersistente(AsyncStorage);
type ItemCarrito = { producto: ProductoTienda; cantidad: number };

export default function TiendaScreen() {
  return <AccesoClienteCitas><TiendaClienteScreen /></AccesoClienteCitas>;
}

function TiendaClienteScreen() {
  const router = useRouter();
  const [productos, setProductos] = useState<ProductoTienda[]>([]);
  const [carrito, setCarrito] = useState<Record<string, ItemCarrito>>({});
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [tipoPedido, setTipoPedido] = useState<'retiro' | 'en_linea'>('retiro');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comprando, setComprando] = useState(false);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [usuarioUid, setUsuarioUid] = useState<string | null>(null);
  const [carritoCargadoUid, setCarritoCargadoUid] = useState<string | null>(null);
  const [bloquearEdicionCarrito, setBloquearEdicionCarrito] = useState(false);
  const [mensajeCarrito, setMensajeCarrito] = useState('');
  const compraEnCurso = useRef(false);
  const [actualizandoCatalogo, setActualizandoCatalogo] = useState(false);

  const abrirDetalle = (productoId: string) => router.push({
    pathname: '/producto/[id]',
    params: { id: productoId },
  } as unknown as Href);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const uid = user?.uid || null;
      setUsuarioUid(uid);
      setCarrito({});
      setTipoPedido('retiro');
      setCarritoCargadoUid(null);
      setBloquearEdicionCarrito(false);
      setMensajeCarrito('');
      setMostrarCarrito(false);
      if (!uid) return;

      void Promise.all([carritoPersistente.cargar(uid), operacionesPendientes.hayPendiente(uid)])
        .then(([guardado, pendiente]) => {
          if (!mounted || auth.currentUser?.uid !== uid) return;
          setCarrito(guardado?.carrito || {});
          setTipoPedido(guardado?.tipoPedido || 'retiro');
          setBloquearEdicionCarrito(pendiente && Boolean(guardado && Object.keys(guardado.carrito).length));
          setCarritoCargadoUid(uid);
        })
        .catch((err) => {
          if (mounted && auth.currentUser?.uid === uid) {
            setError(err?.message || 'No se pudo recuperar el carrito guardado.');
            setCarritoCargadoUid(uid);
          }
        });
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!usuarioUid || carritoCargadoUid !== usuarioUid) return;
    void carritoPersistente.guardar(usuarioUid, carrito, tipoPedido).catch((err) => {
      setError(err?.message || 'No se pudo guardar el carrito en este dispositivo.');
    });
  }, [usuarioUid, carritoCargadoUid, carrito, tipoPedido]);

  const solicitarCatalogo = useCallback(async () => {
    const response = await obtenerCatalogoTienda();
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.error || 'No se pudo actualizar el catálogo.');
    return Array.isArray(data.data) ? data.data.filter(productoActivoDisponible) as ProductoTienda[] : [];
  }, []);

  const cargarCatalogo = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setProductos(await solicitarCatalogo());
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar la tienda.');
    } finally {
      setLoading(false);
    }
  }, [solicitarCatalogo]);

  useFocusEffect(useCallback(() => {
    let activa = true;
    cargarCatalogo();
    const uid = auth.currentUser?.uid;
    if (uid) {
      void Promise.all([carritoPersistente.cargar(uid), operacionesPendientes.hayPendiente(uid)])
        .then(([guardado, pendiente]) => {
          if (!activa || auth.currentUser?.uid !== uid) return;
          setCarrito(guardado?.carrito || {});
          setTipoPedido(guardado?.tipoPedido || 'retiro');
          setBloquearEdicionCarrito(pendiente && Boolean(guardado && Object.keys(guardado.carrito).length));
          setCarritoCargadoUid(uid);
        })
        .catch((err) => {
          if (activa && auth.currentUser?.uid === uid) setError(err?.message || 'No se pudo recuperar el carrito guardado.');
        });
    }
    return () => { activa = false; };
  }, [cargarCatalogo]));

  const categorias = useMemo(() => [...new Set(productos.map((producto) => producto.categoria?.trim()).filter(Boolean))] as string[], [productos]);
  const productosFiltrados = useMemo(() => productos.filter((producto) =>
    producto.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
    && (!categoria || producto.categoria?.toLowerCase() === categoria.toLowerCase())
  ), [productos, busqueda, categoria]);
  const itemsCarrito = Object.values(carrito);
  const totalUnidades = itemsCarrito.reduce((total, item) => total + item.cantidad, 0);
  const total = itemsCarrito.reduce((suma, item) => suma + item.producto.precio * item.cantidad, 0);
  const carritoListo = Boolean(usuarioUid && carritoCargadoUid === usuarioUid);

  const agregar = (producto: ProductoTienda) => {
    if (!carritoListo || bloquearEdicionCarrito || comprando || producto.disponible === false || producto.stock <= 0) return;
    setCarrito((actual) => {
      const cantidadActual = actual[producto.id]?.cantidad || 0;
      if (cantidadActual >= Math.min(producto.stock, 20)) return actual;
      return { ...actual, [producto.id]: { producto, cantidad: cantidadActual + 1 } };
    });
  };

  const cambiarCantidad = (productoId: string, delta: number) => {
    if (!carritoListo || bloquearEdicionCarrito || comprando) return;
    setCarrito((actual) => {
      const item = actual[productoId];
      if (!item) return actual;
      const cantidad = item.cantidad + delta;
      if (cantidad <= 0) {
        const siguiente = { ...actual };
        delete siguiente[productoId];
        return siguiente;
      }
      if (delta > 0 && (item.producto.disponible === false || cantidad > Math.min(item.producto.stock, 20))) return actual;
      return { ...actual, [productoId]: { ...item, cantidad } };
    });
  };

  const aplicarCatalogoAlCarrito = (catalogo: ProductoTienda[]) => {
    setCarrito((actual) => actualizarCarritoConCatalogo(actual, catalogo));
    setMensajeCarrito('Se actualizaron precios y existencias. No cambiamos las cantidades. Revisa los avisos antes de confirmar.');
  };

  const revisarCatalogoCarrito = async () => {
    const uid = usuarioUid;
    if (!uid || !carritoListo || bloquearEdicionCarrito || actualizandoCatalogo) return;
    try {
      setActualizandoCatalogo(true);
      const catalogo = await solicitarCatalogo();
      if (auth.currentUser?.uid !== uid) return;
      setProductos(catalogo);
      const revision = compararCarritoConCatalogo(carrito, catalogo);
      if (revision.requiereActualizar) {
        Alert.alert('Cambios en el catálogo', `${revision.cambios.join('\n')}\n\nNo cambiaremos las cantidades. ¿Quieres actualizar los datos del carrito?`, [
          { text: 'Revisar después', style: 'cancel' },
          { text: 'Actualizar datos', onPress: () => { if (auth.currentUser?.uid === uid) aplicarCatalogoAlCarrito(catalogo); } },
        ]);
        return;
      }
      const problemas = problemasCarritoActualizado(carrito);
      const texto = problemas.length ? problemas.join('\n') : 'Los precios y existencias coinciden con el catálogo actual.';
      setMensajeCarrito(texto);
      Alert.alert(problemas.length ? 'Revisa tu carrito' : 'Catálogo actualizado', texto);
    } catch (err: any) {
      const texto = err?.message || 'No se pudo actualizar el catálogo. Revisa tu conexión e inténtalo de nuevo.';
      setMensajeCarrito(texto);
      Alert.alert('No se pudo actualizar', texto);
    } finally {
      setActualizandoCatalogo(false);
    }
  };

  const confirmarPedido = async () => {
    if (!itemsCarrito.length || !carritoListo || compraEnCurso.current) return;
    compraEnCurso.current = true;
    setComprando(true);
    let key: string | null = null;
    const uid = usuarioUid || auth.currentUser?.uid || '';

    try {
      const productosPedido = itemsCarrito.map(({ producto, cantidad }) => ({ productoId: producto.id, cantidad }));
      const payload = { productos: productosPedido, tipo: tipoPedido };

      // Una operación incierta se reenvía intacta para recuperar su resultado.
      if (!bloquearEdicionCarrito) {
        const catalogo = await solicitarCatalogo();
        if (auth.currentUser?.uid !== uid) return;
        setProductos(catalogo);
        const revision = compararCarritoConCatalogo(carrito, catalogo);
        if (revision.requiereActualizar) {
          setMensajeCarrito(revision.cambios.join('\n'));
          Alert.alert('Cambios en el catálogo', revision.cambios.join('\n') + '\n\nActualiza los datos del carrito. Las cantidades se conservarán.', [
            { text: 'Revisar después', style: 'cancel' },
            { text: 'Actualizar carrito', onPress: () => { if (auth.currentUser?.uid === uid) aplicarCatalogoAlCarrito(catalogo); } },
          ]);
          return;
        }
        const problemas = problemasCarritoActualizado(carrito);
        if (problemas.length) {
          setMensajeCarrito(problemas.join('\n'));
          Alert.alert('Revisa tu carrito', problemas.join('\n'));
          return;
        }
      }

      await carritoPersistente.guardar(uid, carrito, tipoPedido);
      key = await operacionesPendientes.obtener(uid, payload);
      if (auth.currentUser?.uid !== uid) return;
      setBloquearEdicionCarrito(true);
      setMensajeCarrito('Pedido pendiente de confirmación. Reintentar conserva la misma clave y los mismos datos.');

      let response: Response;
      try {
        response = await crearPedidoTienda(productosPedido, tipoPedido, key);
      } catch {
        if (auth.currentUser?.uid !== uid) return;
        setBloquearEdicionCarrito(true);
        setMensajeCarrito('No se recibió respuesta del servidor. El resultado es incierto; conserva el carrito y reintenta para recuperar el mismo pedido.');
        Alert.alert('No se pudo confirmar el resultado', 'Puede que el pedido se haya registrado. Reintenta con el mismo carrito para consultar el resultado sin duplicarlo.');
        return;
      }

      if (auth.currentUser?.uid !== uid) return;
      const data = await response.json().catch(() => null);
      if (auth.currentUser?.uid !== uid) return;
      if (!response.ok) {
        const tipoError = clasificarErrorPedidoHttp(response.status);
        const detalleStock = Number.isFinite(Number(data?.stockActual)) ? ' Stock actual: ' + Number(data.stockActual) + '.' : '';
        const mensajeServidor = (data?.message || data?.error || 'El servidor respondió ' + response.status + '.') + detalleStock;
        if (tipoError === 'definitivo') {
          const resuelta = await operacionesPendientes.resolverRechazoDefinitivo(uid, key, payload);
          if (auth.currentUser?.uid !== uid) return;
          if (resuelta) {
            setBloquearEdicionCarrito(false);
            setMensajeCarrito(mensajeServidor + ' El Backend rechazó el pedido sin crearlo. Actualiza el catálogo y corrige el carrito para volver a intentar.');
            await cargarCatalogo();
            if (auth.currentUser?.uid !== uid) return;
            Alert.alert('Pedido rechazado', mensajeServidor + '\n\nNo se creó el pedido. Puedes actualizar el catálogo y corregir las cantidades.');
          } else {
            setBloquearEdicionCarrito(true);
            setMensajeCarrito('El servidor rechazó la solicitud, pero la operación local no coincide. Se conserva pendiente para evitar duplicados.');
            Alert.alert('Operación pendiente', 'No pudimos verificar que el rechazo corresponda a esta operación. Mantuvimos la clave; reintenta con los mismos datos.');
          }
          return;
        }

        setBloquearEdicionCarrito(true);
        if (tipoError === 'autenticacion') {
          setMensajeCarrito('La sesión o los permisos no permitieron confirmar el pedido. La operación se conserva; vuelve a iniciar sesión y reintenta.');
          Alert.alert(response.status === 401 ? 'Sesión expirada' : 'Sin permiso', mensajeServidor + '\n\nNo borramos la operación pendiente.');
        } else {
          setMensajeCarrito('No se puede confirmar el resultado del pedido. Conservamos la misma clave y el mismo carrito para reintentar.');
          Alert.alert('Resultado pendiente', mensajeServidor + '\n\nReintenta con el mismo carrito. No inicies otra compra todavía.');
        }
        return;
      }

      if (!data?.data?.id) {
        setBloquearEdicionCarrito(true);
        setMensajeCarrito('La respuesta no confirmó un número de pedido. La operación queda pendiente para recuperar el mismo resultado.');
        Alert.alert('Confirmación incompleta', 'No se recibió el identificador del pedido. Conservamos la clave; reintenta con el mismo carrito.');
        return;
      }

      const numero = String(data.data.id).slice(0, 6).toUpperCase();
      try {
        await operacionesPendientes.confirmar(uid, key);
      } catch {
        if (auth.currentUser?.uid !== uid) return;
        setBloquearEdicionCarrito(true);
        setMensajeCarrito('Pedido #' + numero + ' confirmado. Conservamos los datos locales porque no pudimos limpiar la clave; reintenta para recuperar la misma confirmación.');
        Alert.alert('Pedido confirmado', 'Pedido #' + numero + ' creado. No pudimos limpiar la operación local; si reintentas se recuperará este mismo pedido.');
        return;
      }

      if (auth.currentUser?.uid !== uid) return;

      setBloquearEdicionCarrito(false);
      setMensajeCarrito('');
      setCarrito({});
      setMostrarCarrito(false);
      Alert.alert('¡Pedido registrado!', 'Tu pedido #' + numero + ' se creó correctamente. Puedes retirarlo en la clínica.');
      await cargarCatalogo();
    } catch (err: any) {
      if (auth.currentUser?.uid !== uid) return;
      const hayOperacion = key !== null || await operacionesPendientes.hayPendiente(uid).catch(() => false);
      if (hayOperacion) {
        setBloquearEdicionCarrito(true);
        setMensajeCarrito('No se pudo confirmar el resultado. Conservamos la operación para reintentar con la misma clave y los mismos datos.');
        Alert.alert('Resultado pendiente', err?.message || 'Reintenta con el mismo carrito; no inicies otra compra.');
      } else {
        const texto = err?.message || 'No se pudo validar el catálogo. Revisa tu conexión e inténtalo nuevamente.';
        setMensajeCarrito(texto);
        Alert.alert('No se pudo iniciar la compra', texto);
      }
    } finally {
      compraEnCurso.current = false;
      setComprando(false);
    }
  };

  return (
    <VetCareBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={styles.headingText}>
                <Text style={styles.title}>Tienda</Text>
                <Text style={styles.subtitle}>Productos para cuidar a tu mascota</Text>
              </View>
              <View style={styles.cartBadge}>
                <Ionicons name="bag-handle-outline" size={23} color={colors.primary} />
                <Text style={styles.cartBadgeText}>{totalUnidades}</Text>
              </View>
              <Pressable style={styles.historyButton} onPress={() => router.push('/mis-pedidos' as Href)} accessibilityRole="button" accessibilityLabel="Ver historial de pedidos">
                <Ionicons name="receipt-outline" size={20} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color="#6B7280" />
              <TextInput
                value={busqueda}
                onChangeText={setBusqueda}
                placeholder="Buscar productos"
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
                returnKeyType="search"
              />
              {busqueda ? <Pressable onPress={() => setBusqueda('')} accessibilityLabel="Limpiar búsqueda"><Ionicons name="close-circle" size={20} color="#9CA3AF" /></Pressable> : null}
            </View>

            {categorias.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
                <Pressable onPress={() => setCategoria('')} style={[styles.categoryChip, !categoria && styles.categoryChipActive]}>
                  <Text style={[styles.categoryText, !categoria && styles.categoryTextActive]}>Todos</Text>
                </Pressable>
                {categorias.map((item) => (
                  <Pressable key={item} onPress={() => setCategoria(categoria === item ? '' : item)} style={[styles.categoryChip, categoria === item && styles.categoryChipActive]}>
                    <Text style={[styles.categoryText, categoria === item && styles.categoryTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            <Text style={styles.sectionTitle}>Productos disponibles</Text>
            {loading ? <ActivityIndicator style={styles.loader} size="large" color={colors.primary} /> : error ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>{error}</Text>
                <Pressable style={styles.retryButton} onPress={cargarCatalogo}><Text style={styles.retryText}>Intentar de nuevo</Text></Pressable>
              </View>
            ) : productosFiltrados.length ? productosFiltrados.map((producto) => {
              const cantidadEnCarrito = carrito[producto.id]?.cantidad || 0;
              return (
                <View key={producto.id} style={styles.productCard}>
                  <Pressable onPress={() => abrirDetalle(producto.id)} accessibilityRole="button" accessibilityLabel={`Ver detalle de ${producto.nombre}`}>
                    <ImagenCatalogoProducto producto={producto} />
                  </Pressable>
                  <Pressable style={styles.productInfo} onPress={() => abrirDetalle(producto.id)} accessibilityRole="button" accessibilityLabel={`Ver detalle de ${producto.nombre}`}>
                    <Text style={styles.productName}>{producto.nombre}</Text>
                    <Text style={styles.productCategory}>{producto.categoria || 'General'} · {producto.stock} disponibles</Text>
                    {producto.descripcion ? <Text style={styles.productDescription} numberOfLines={2}>{producto.descripcion}</Text> : null}
                    <Text style={styles.productPrice}>${Number(producto.precio).toFixed(2)}</Text>
                  </Pressable>
                  <Pressable style={[styles.addButton, cantidadEnCarrito > 0 && styles.addedButton]} onPress={() => agregar(producto)} disabled={!carritoListo || bloquearEdicionCarrito || comprando || producto.stock <= cantidadEnCarrito} accessibilityLabel={`Agregar ${producto.nombre} al carrito`}>
                    <Ionicons name={cantidadEnCarrito ? 'checkmark' : 'add'} size={22} color="#FFFFFF" />
                  </Pressable>
                </View>
              );
            }) : (
              <View style={styles.emptyCard}><Ionicons name="storefront-outline" size={36} color="#9CA3AF" /><Text style={styles.emptyText}>No hay productos para mostrar.</Text></View>
            )}

          </ScrollView>

          <Pressable style={styles.cartDock} onPress={() => setMostrarCarrito(true)} accessibilityRole="button" accessibilityLabel={`Abrir carrito con ${totalUnidades} productos`}>
            <View style={styles.cartDockHeader}><Text style={styles.cartDockTitle}>Tu carrito ({totalUnidades})</Text>{totalUnidades > 0 ? <Text style={styles.cartDockTotal}>${total.toFixed(2)}</Text> : null}</View>
            <View style={styles.cartDockBody}><Text style={styles.cartDockHint}>{totalUnidades ? `${totalUnidades} ${totalUnidades === 1 ? 'producto' : 'productos'} · Revisa tu pedido` : 'Agrega productos al carrito para preparar tu pedido.'}</Text>{totalUnidades ? <View style={styles.cartDockAction}><Text style={styles.cartDockActionText}>Ver carrito</Text><Ionicons name="chevron-forward" size={17} color={colors.primary} /></View> : null}</View>
          </Pressable>

          <View style={styles.bottomNav}>
            <NavItem icon="home-outline" label="Inicio" onPress={() => router.replace('/home')} />
            <NavItem icon="paw-outline" label="Mascotas" onPress={() => router.push('/mascotas')} />
            <NavItem icon="calendar-outline" label="Citas" onPress={() => router.push('/citas')} />
            <NavItem icon="bag-handle" label="Tienda" active onPress={() => router.replace('/tienda')} />
          </View>
        </View>

        <Modal visible={mostrarCarrito} transparent animationType="slide" onRequestClose={() => setMostrarCarrito(false)}>
          <View style={styles.cartModalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => !comprando && setMostrarCarrito(false)} accessibilityLabel="Cerrar carrito" />
            <View style={styles.cartModal}>
              <View style={styles.cartModalHeader}>
                <View><Text style={styles.cartModalTitle}>Tu carrito ({totalUnidades})</Text><Text style={styles.cartModalSubtitle}>Revisa los productos de tu pedido.</Text></View>
                <Pressable style={styles.cartCloseButton} onPress={() => setMostrarCarrito(false)} disabled={comprando} accessibilityLabel="Cerrar"><Ionicons name="close" size={21} color="#64748B" /></Pressable>
              </View>
              {mensajeCarrito ? <Text style={styles.cartNotice}>{mensajeCarrito}</Text> : null}
              {itemsCarrito.length > 0 && !bloquearEdicionCarrito ? (
                <Pressable style={styles.refreshCartButton} onPress={revisarCatalogoCarrito} disabled={!carritoListo || comprando || actualizandoCatalogo} accessibilityRole="button">
                  <Ionicons name="refresh-outline" size={16} color={colors.primary} />
                  <Text style={styles.refreshCartText}>{actualizandoCatalogo ? 'Actualizando catálogo…' : 'Actualizar precios y existencias'}</Text>
                </Pressable>
              ) : null}
              {itemsCarrito.length ? <ScrollView style={styles.cartModalScroll} contentContainerStyle={styles.cartModalContent} showsVerticalScrollIndicator={false}>
                {itemsCarrito.map(({ producto, cantidad }) => <View key={producto.id} style={styles.cartRow}><View style={styles.cartProductInfo}><Text style={styles.cartProductName}>{producto.nombre}</Text><Text style={styles.cartProductPrice}>${(producto.precio * cantidad).toFixed(2)}</Text>{producto.disponible === false || producto.stock <= 0 ? <Text style={styles.cartItemWarning}>No disponible. Reduce la cantidad para quitarlo.</Text> : cantidad > producto.stock ? <Text style={styles.cartItemWarning}>Stock actual: {producto.stock}. Reduce la cantidad para continuar.</Text> : null}</View><View style={styles.quantityControl}><Pressable onPress={() => cambiarCantidad(producto.id, -1)} style={styles.quantityButton} disabled={!carritoListo || bloquearEdicionCarrito || comprando} accessibilityLabel={`Quitar una unidad de ${producto.nombre}`}><Ionicons name="remove" size={18} color={colors.primary} /></Pressable><Text style={styles.quantityText}>{cantidad}</Text><Pressable onPress={() => agregar(producto)} style={styles.quantityButton} disabled={!carritoListo || bloquearEdicionCarrito || comprando || producto.disponible === false || cantidad >= Math.min(producto.stock, 20)} accessibilityLabel={`Agregar una unidad de ${producto.nombre}`}><Ionicons name="add" size={18} color={colors.primary} /></Pressable></View></View>)}
                <View style={styles.deliveryOptions}><Pressable style={[styles.deliveryOption, tipoPedido === 'retiro' && styles.deliveryOptionActive]} onPress={() => !bloquearEdicionCarrito && !comprando && setTipoPedido('retiro')} disabled={bloquearEdicionCarrito || comprando}><Ionicons name="medical-outline" size={18} color={tipoPedido === 'retiro' ? colors.primary : '#6B7280'} /><Text style={[styles.deliveryText, tipoPedido === 'retiro' && styles.deliveryTextActive]}>Retiro en clínica</Text></Pressable><Pressable style={[styles.deliveryOption, tipoPedido === 'en_linea' && styles.deliveryOptionActive]} onPress={() => !bloquearEdicionCarrito && !comprando && setTipoPedido('en_linea')} disabled={bloquearEdicionCarrito || comprando}><Ionicons name="card-outline" size={18} color={tipoPedido === 'en_linea' ? colors.primary : '#6B7280'} /><Text style={[styles.deliveryText, tipoPedido === 'en_linea' && styles.deliveryTextActive]}>Pago en línea</Text></Pressable></View>
                <Text style={styles.paymentNote}>El pago se coordina al retirar tu pedido en la clínica.</Text>
              </ScrollView> : <View style={styles.cartEmpty}><View style={styles.cartEmptyIcon}><Ionicons name="bag-handle-outline" size={27} color={colors.primary} /></View><Text style={styles.emptyText}>Agrega productos al carrito para preparar tu pedido.</Text></View>}
              {itemsCarrito.length ? <View style={styles.cartModalFooter}><View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalAmount}>${total.toFixed(2)}</Text></View><Pressable style={[styles.checkoutButton, comprando && styles.disabledButton]} onPress={confirmarPedido} disabled={!carritoListo || comprando}>{comprando ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" /><Text style={styles.checkoutText}>{bloquearEdicionCarrito ? 'Reintentar pedido pendiente' : 'Confirmar pedido'}</Text></>}</Pressable></View> : null}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </VetCareBackground>
  );
}

function NavItem({ icon, label, active = false, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.navItem} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={icon} size={21} color={active ? colors.primary : '#9CA3AF'} />
      <Text style={active ? styles.navTextActive : styles.navText}>{label}</Text>
    </Pressable>
  );
}

function ImagenCatalogoProducto({ producto }: { producto: ProductoTienda }) {
  const [fallo, setFallo] = useState(false);
  const source = resolverImagenProducto(producto.imagenUrl, fallo);
  return (
    <View style={styles.productIcon}>
      {source ? (
        <Image source={source} style={styles.productImage} resizeMode="cover" onError={() => setFallo(true)} accessibilityLabel={`Imagen de ${producto.nombre}`} />
      ) : (
        <Ionicons name={iconoCategoriaProducto(producto.categoria)} size={24} color={colors.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 18, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 18 },
  headingText: { flex: 1, paddingRight: 12 },
  title: { color: '#1F2937', fontSize: 26, lineHeight: 32, fontWeight: '800' },
  subtitle: { color: '#6B7280', fontSize: 14, lineHeight: 19, marginTop: 2 },
  cartBadge: { minWidth: 48, height: 48, borderRadius: 24, backgroundColor: '#DBEAFE', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, gap: 4 },
  cartBadgeText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  historyButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  searchBox: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 13, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, color: '#1F2937', fontSize: 15, paddingVertical: 0 },
  categoryList: { gap: 8, paddingVertical: 12 },
  categoryChip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DBEAFE' },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: '#FFFFFF' },
  sectionTitle: { color: '#1F2937', fontSize: 19, lineHeight: 25, fontWeight: '700', marginTop: 14, marginBottom: 10 },
  loader: { marginVertical: 28 },
  productCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  productIcon: { width: 48, height: 48, borderRadius: 13, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 11, overflow: 'hidden' },
  productImage: { width: '100%', height: '100%' },
  productInfo: { flex: 1, paddingRight: 8 },
  productName: { color: '#1F2937', fontSize: 16, lineHeight: 21, fontWeight: '700' },
  productCategory: { color: '#6B7280', fontSize: 12, lineHeight: 17, marginTop: 2 },
  productDescription: { color: '#6B7280', fontSize: 12, lineHeight: 17, marginTop: 3 },
  productPrice: { color: '#1E3A8A', fontSize: 16, fontWeight: '800', marginTop: 5 },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  addedButton: { backgroundColor: '#16A34A' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 8 },
  emptyText: { color: '#6B7280', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 5 },
  retryButton: { marginTop: 12, paddingVertical: 9, paddingHorizontal: 15, borderRadius: 9, backgroundColor: colors.primary },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  cartDock: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10, backgroundColor: 'rgba(255,255,255,0.18)' },
  cartDockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7, paddingHorizontal: 2 },
  cartDockTitle: { color: '#1F2937', fontSize: 16, fontWeight: '800' },
  cartDockTotal: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  cartDockBody: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  cartDockHint: { flex: 1, color: '#6B7280', fontSize: 13, lineHeight: 18, textAlign: 'center' },
  cartDockAction: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 8 },
  cartDockActionText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  cartModalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.48)' },
  cartModal: { width: '100%', maxHeight: '85%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden', paddingBottom: 12 },
  cartModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cartModalTitle: { color: '#1F2937', fontSize: 20, fontWeight: '800' },
  cartModalSubtitle: { color: '#6B7280', fontSize: 13, marginTop: 3 },
  cartNotice: { color: '#92400E', backgroundColor: '#FEF3C7', borderRadius: 10, marginHorizontal: 18, marginTop: 10, padding: 10, fontSize: 12, lineHeight: 18 },
  refreshCartButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 18, marginTop: 8, borderRadius: 10, backgroundColor: '#EFF6FF' },
  refreshCartText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  cartCloseButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  cartModalScroll: { flexShrink: 1 },
  cartModalContent: { paddingHorizontal: 18, paddingBottom: 12 },
  cartEmpty: { alignItems: 'center', paddingHorizontal: 22, paddingVertical: 30 },
  cartEmptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  cartModalFooter: { paddingHorizontal: 18, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  cartCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, elevation: 2, marginBottom: 14 },
  cartRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cartProductInfo: { flex: 1, paddingRight: 8 },
  cartProductName: { color: '#1F2937', fontSize: 14, lineHeight: 19, fontWeight: '600' },
  cartProductPrice: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  cartItemWarning: { color: '#92400E', fontSize: 11, lineHeight: 15, marginTop: 3 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  quantityButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  quantityText: { minWidth: 18, textAlign: 'center', color: '#1F2937', fontSize: 15, fontWeight: '700' },
  deliveryOptions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  deliveryOption: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 5 },
  deliveryOptionActive: { backgroundColor: '#EFF6FF', borderColor: colors.primary },
  deliveryText: { color: '#6B7280', fontSize: 11, fontWeight: '600' },
  deliveryTextActive: { color: colors.primary },
  paymentNote: { color: '#6B7280', fontSize: 12, lineHeight: 17, marginTop: 8 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  totalLabel: { color: '#1F2937', fontSize: 16, fontWeight: '600' },
  totalAmount: { color: '#1E3A8A', fontSize: 20, fontWeight: '800' },
  checkoutButton: { minHeight: 48, borderRadius: 11, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 12 },
  checkoutText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.65 },
  bottomNav: { height: 68, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 4 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navText: { color: '#6B7280', fontSize: 12, marginTop: 3 },
  navTextActive: { color: colors.primary, fontSize: 12, fontWeight: '700', marginTop: 3 },
});

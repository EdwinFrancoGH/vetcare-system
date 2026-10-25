import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { VetCareBackground } from '@/components/vetcare-background';
import { Colors } from '@/constants/theme';
import { auth } from '@/config/firebase';
import { API_URL } from '@/config/api';
import { listarMascotas, obtenerVacunasMascota } from '@/features/mascotas/services/mascotas.service';
import { listarCitasDeMascota } from '@/features/citas/services/citas.service';
import { obtenerMisPedidos } from '@/features/compras/services/compras.service';

const colors = Colors.light;

export default function HomeScreen() {
  const router = useRouter();
  const [nombreUsuario, setNombreUsuario] = useState('Cliente');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(auth.currentUser?.photoURL || null);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [citasProximas, setCitasProximas] = useState<Cita[]>([]);
  const [proximaCita, setProximaCita] = useState<Cita | null>(null);
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [comprasFrecuentes, setComprasFrecuentes] = useState<ProductoFrecuente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarInicio = useCallback(async () => {
    const usuario = auth.currentUser;
    if (!usuario) {
      setError('No hay una sesión activa.');
      setLoading(false);
      return;
    }

    const nombreFallback = usuario.displayName?.trim() || usuario.email?.split('@')[0] || 'Cliente';
    setNombreUsuario(nombreFallback);
    setLoading(true);
    setError('');

    try {
      const token = await usuario.getIdToken();
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const [perfilResponse, mascotasResponse, pedidosResponse] = await Promise.all([
        fetch(`${API_URL}/api/users/profile`, { headers }),
        listarMascotas({ headers }),
        obtenerMisPedidos({ headers }).catch(() => null),
      ]);

      if (perfilResponse.ok) {
        const perfil = await perfilResponse.json();
        const nombrePerfil = perfil?.user?.name?.trim();
        if (nombrePerfil) setNombreUsuario(nombrePerfil);
        const foto = perfil?.user?.photoURL || usuario.photoURL;
        setFotoPerfil(typeof foto === 'string' && foto ? foto : null);
      } else {
        setFotoPerfil(usuario.photoURL || null);
      }

      const mascotasData = await mascotasResponse.json();
      if (!mascotasResponse.ok) {
        throw new Error(mascotasData.message || mascotasData.error || 'No se pudieron cargar tus mascotas.');
      }

      const listaMascotas: Mascota[] = Array.isArray(mascotasData.data) ? mascotasData.data : [];
      setMascotas(listaMascotas);

      if (pedidosResponse?.ok) {
        const pedidosData = await pedidosResponse.json();
        setComprasFrecuentes(calcularComprasFrecuentes(pedidosData.data));
      } else {
        setComprasFrecuentes([]);
      }

      const [citasResultados, vacunasResultados] = await Promise.all([
        Promise.allSettled(listaMascotas.map(async (mascota) => {
          const response = await listarCitasDeMascota(mascota.id, { headers });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || `No se pudieron cargar las citas de ${mascota.nombre}.`);
          return (Array.isArray(data.data) ? data.data : []).map((cita: Cita) => ({ ...cita, mascotaNombre: mascota.nombre }));
        })),
        Promise.allSettled(listaMascotas.map(async (mascota) => {
          const response = await obtenerVacunasMascota(mascota.id, { headers });
          const data = await response.json();
          if (!response.ok) throw new Error(data.mensaje || data.message || `No se pudieron cargar las vacunas de ${mascota.nombre}.`);
          return (Array.isArray(data.data) ? data.data : []).map((vacuna: VacunaPendiente) => ({ ...vacuna, mascotaNombre: mascota.nombre }));
        })),
      ]);
      const citasPorMascota = citasResultados.filter((resultado) => resultado.status === 'fulfilled').map((resultado) => resultado.value);
      const vacunasPorMascota = vacunasResultados.filter((resultado) => resultado.status === 'fulfilled').map((resultado) => resultado.value);

      const hoy = fechaHoyISO();
      const citasFuturas = citasPorMascota.flat()
        .filter((cita) => cita.fecha >= hoy && ['reservada', 'confirmada'].includes(cita.estado?.toLowerCase()))
        .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
      setCitasProximas(citasFuturas);
      setProximaCita(citasFuturas[0] || null);

      const limite30Dias = sumarDiasISO(hoy, 30);
      const vacunasUnicas = new Map<string, VacunaPendiente>();
      vacunasPorMascota.flat().forEach((vacuna) => {
        const clave = `${vacuna.mascotaId}__${vacuna.nombre.trim().toLowerCase()}`;
        const actual = vacunasUnicas.get(clave);
        if (!actual || (vacuna.fecha || '').localeCompare(actual.fecha || '') > 0) vacunasUnicas.set(clave, vacuna);
      });

      const avisosVacunas: Recordatorio[] = [...vacunasUnicas.values()]
        .filter((vacuna) => {
          const fecha = (vacuna.proximaFecha || '').slice(0, 10);
          return Boolean(fecha) && fecha <= limite30Dias;
        })
        .map((vacuna) => ({
          id: `vacuna-${vacuna.id}`,
          fecha: vacuna.proximaFecha!.slice(0, 10),
          tipo: vacuna.proximaFecha!.slice(0, 10) < hoy ? 'vencida' : 'por-vencer',
          categoria: 'vacuna',
          mensaje: `La vacuna ${vacuna.nombre} de ${vacuna.mascotaNombre || 'tu mascota'} ${vacuna.proximaFecha!.slice(0, 10) < hoy ? 'venció' : 'vence'} el ${formatearFecha(vacuna.proximaFecha!.slice(0, 10))}`,
        }));
      const avisosCitas: Recordatorio[] = citasFuturas
        .filter((cita) => cita.fecha.slice(0, 10) >= hoy && cita.fecha.slice(0, 10) <= limite30Dias)
        .map((cita) => ({
          id: `cita-${cita.id}`,
          fecha: cita.fecha.slice(0, 10),
          tipo: 'cita',
          categoria: 'cita',
          mensaje: `${cita.fecha === hoy ? 'Hoy tienes' : `Tienes el ${formatearFecha(cita.fecha)}`} cita de ${cita.mascotaNombre || 'tu mascota'} con ${cita.veterinario || 'tu veterinario'} a las ${cita.hora || '—'}`,
        }));
      setRecordatorios([...avisosVacunas, ...avisosCitas].sort((a, b) => a.fecha.localeCompare(b.fecha)));
    } catch (err: any) {
      console.error('Error cargando el inicio:', err);
      setError(err?.message || 'No se pudo cargar tu información.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargarInicio(); }, [cargarInicio]));

  const abrirDetalleCita = () => {
    if (proximaCita?.id) router.push(`/detalle-cita?id=${encodeURIComponent(proximaCita.id)}`);
    else router.push('/citas');
  };

  return (
    <VetCareBackground>
      <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>¡Hola, {nombreUsuario}!</Text>
              <Text style={styles.welcomeText}>Bienvenido/a de vuelta a VetCare</Text>
            </View>
            <Pressable style={styles.profileAvatar} onPress={() => router.push('/explore')} accessibilityLabel="Abrir perfil">
              {fotoPerfil ? (
                <Image source={{ uri: fotoPerfil }} style={styles.profileImage} />
              ) : (
                <Ionicons name="person" size={22} color={colors.primary} />
              )}
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.summaryContainer}>
            <Pressable style={styles.summaryCard} onPress={() => router.push('/mascotas')} hitSlop={8}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryNumber}>{mascotas.length}</Text>
                <Ionicons name="paw-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.summaryLabel}>Mis mascotas</Text>
            </Pressable>

            <Pressable style={styles.summaryCard} onPress={() => router.push('/citas')} hitSlop={8}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryNumber}>{citasProximas.length}</Text>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.summaryLabel}>Próxima cita</Text>
            </Pressable>

            <Pressable style={styles.summaryCard} onPress={() => router.push('/mascotas')} hitSlop={8}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryNumber}>{recordatorios.filter((recordatorio) => recordatorio.categoria === 'vacuna').length}</Text>
                <Ionicons name="medkit-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.summaryLabel}>Vacunas próx.</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Próxima cita</Text>
          {loading ? (
            <ActivityIndicator style={styles.loading} color={colors.primary} />
          ) : proximaCita ? (
            <View style={styles.appointmentCard}>
              <View style={styles.petHeader}>
                <View style={styles.petAvatar}><Ionicons name="paw" size={26} color={colors.primary} /></View>
                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{proximaCita.mascotaNombre || 'Mascota'}</Text>
                  <Text style={styles.petService}>{proximaCita.motivo || 'Consulta veterinaria'}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.appointmentInfoRow}>
                <Ionicons name="time-outline" size={17} color={colors.primary} />
                <Text style={styles.appointmentInfoText}>{formatearFecha(proximaCita.fecha)}{proximaCita.hora ? ` - ${proximaCita.hora}` : ''}</Text>
              </View>
              {proximaCita.veterinario ? (
                <View style={styles.appointmentInfoRow}>
                  <Ionicons name="person-outline" size={17} color={colors.primary} />
                  <Text style={styles.appointmentInfoText}>Veterinario: {proximaCita.veterinario}</Text>
                </View>
              ) : null}
              <Pressable style={styles.detailsButton} onPress={abrirDetalleCita} hitSlop={8}>
                <Text style={styles.detailsButtonText}>Ver detalles</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{mascotas.length ? 'No tienes citas próximas.' : 'Aún no tienes mascotas registradas.'}</Text>
              {mascotas.length === 0 ? (
                <Pressable onPress={() => router.push('/agregar-mascota')}><Text style={styles.emptyLink}>Registrar una mascota</Text></Pressable>
              ) : null}
            </View>
          )}

          <Text style={styles.sectionTitle}>Compras frecuentes</Text>
          {loading ? (
            <ActivityIndicator style={styles.loading} color={colors.primary} />
          ) : comprasFrecuentes.length ? (
            <View style={styles.frequentPurchaseList}>
              {comprasFrecuentes.map((producto) => (
                <View key={producto.id} style={styles.frequentPurchaseCard}>
                  <View style={styles.frequentPurchaseIcon}>
                    <Ionicons name="bag-handle-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.frequentPurchaseInfo}>
                    <Text style={styles.frequentPurchaseName} numberOfLines={2}>{producto.nombre}</Text>
                    <Text style={styles.frequentPurchaseMeta}>
                      {producto.compras} {producto.compras === 1 ? 'compra' : 'compras'} · {producto.unidades} {producto.unidades === 1 ? 'unidad' : 'unidades'}
                    </Text>
                  </View>
                  <Ionicons name="repeat-outline" size={19} color={colors.primary} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Tus productos comprados aparecerán aquí.</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Recordatorios</Text>
          {loading ? (
            <ActivityIndicator style={styles.loading} color={colors.primary} />
          ) : recordatorios.length ? (
            <View style={styles.reminderList}>
              {recordatorios.map((recordatorio) => (
                <Pressable key={recordatorio.id} style={[styles.reminderCard, recordatorio.tipo === 'vencida' ? styles.reminderOverdue : recordatorio.tipo === 'por-vencer' ? styles.reminderDue : styles.reminderAppointment]} onPress={() => router.push(recordatorio.categoria === 'vacuna' ? '/mascotas' : '/citas')} hitSlop={8}>
                  <View style={styles.reminderIcon}><Ionicons name={recordatorio.categoria === 'cita' ? 'calendar-outline' : 'medkit-outline'} size={18} color={colors.primary} /></View>
                  <View style={styles.reminderInfo}><Text style={[styles.reminderTitle, recordatorio.tipo === 'vencida' ? styles.reminderOverdueText : recordatorio.tipo === 'por-vencer' ? styles.reminderDueText : styles.reminderAppointmentText]}>{recordatorio.mensaje}</Text></View>
                  <Ionicons name="chevron-forward" size={19} color="#6B7280" />
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No tienes recordatorios próximos.</Text></View>
          )}
          <View style={styles.bottomSpace} />
        </ScrollView>

        <View style={styles.bottomNav}>
          <Pressable style={styles.navItem} onPress={() => router.replace('/home')} hitSlop={12}>
            <Ionicons name="home" size={21} color={colors.primary} /><Text style={styles.navTextActive}>Inicio</Text>
          </Pressable>
          <Pressable style={styles.navItem} onPress={() => router.push('/mascotas')} hitSlop={12}>
            <Ionicons name="paw-outline" size={21} color="#9CA3AF" /><Text style={styles.navText}>Mascotas</Text>
          </Pressable>
          <Pressable style={styles.navItem} onPress={() => router.push('/citas')} hitSlop={12}>
            <Ionicons name="calendar-outline" size={21} color="#9CA3AF" /><Text style={styles.navText}>Citas</Text>
          </Pressable>
          <Pressable style={styles.navItem} onPress={() => router.push('/tienda')} hitSlop={12}>
            <Ionicons name="bag-handle-outline" size={21} color="#9CA3AF" /><Text style={styles.navText}>Tienda</Text>
          </Pressable>
        </View>
      </View>
      </SafeAreaView>
    </VetCareBackground>
  );
}

type Mascota = { id: string; nombre: string };
type Cita = { id: string; mascotaId: string; fecha: string; hora?: string; motivo?: string; veterinario?: string; estado: string; mascotaNombre?: string };
type VacunaPendiente = { id: string; mascotaId: string; nombre: string; fecha?: string; proximaFecha?: string; mascotaNombre?: string };
type Recordatorio = { id: string; fecha: string; tipo: 'vencida' | 'por-vencer' | 'cita'; categoria: 'vacuna' | 'cita'; mensaje: string };
type Pedido = { estado?: string; productos?: { productoId?: string; nombre?: string; cantidad?: number }[] };
type ProductoFrecuente = { id: string; nombre: string; compras: number; unidades: number };

function calcularComprasFrecuentes(pedidos: unknown): ProductoFrecuente[] {
  if (!Array.isArray(pedidos)) return [];

  const productos = new Map<string, ProductoFrecuente>();
  for (const pedido of pedidos as Pedido[]) {
    if (['cancelado', 'cancelada'].includes(pedido.estado?.toLowerCase() || '')) continue;
    const vistosEnPedido = new Set<string>();

    for (const item of pedido.productos || []) {
      const nombre = item.nombre?.trim();
      if (!nombre) continue;
      const id = item.productoId || nombre.toLowerCase();
      const producto = productos.get(id) || { id, nombre, compras: 0, unidades: 0 };
      if (!vistosEnPedido.has(id)) {
        producto.compras += 1;
        vistosEnPedido.add(id);
      }
      producto.unidades += Math.max(0, Number(item.cantidad) || 0);
      productos.set(id, producto);
    }
  }

  return [...productos.values()]
    .sort((a, b) => b.compras - a.compras || b.unidades - a.unidades || a.nombre.localeCompare(b.nombre))
    .slice(0, 5);
}

function fechaHoyISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/El_Salvador' }).format(new Date());
}

function sumarDiasISO(fecha: string, dias: number) {
  const [year, month, day] = fecha.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + dias));
  return date.toISOString().slice(0, 10);
}

function formatearFecha(fecha: string) {
  const [year, month, day] = fecha.split('-').map(Number);
  if (!year || !month || !day) return fecha;
  return new Date(year, month - 1, day).toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' });
}

const stylesWithStates = {
  errorText: { color: '#DC2626', fontSize: 14, marginHorizontal: 24, marginTop: 10 },
  loading: { marginHorizontal: 24, marginVertical: 16 },
  emptyCard: { backgroundColor: '#FFFFFF', marginHorizontal: 24, borderRadius: 11, padding: 16, alignItems: 'center' as const },
  emptyText: { color: '#6B7280', fontSize: 14, lineHeight: 20, textAlign: 'center' as const },
  emptyLink: { color: colors.primary, fontSize: 14, fontWeight: '700' as const, marginTop: 8 },
};

/* =====================================================
   ESTILOS
===================================================== */

const styles = StyleSheet.create({
  ...stylesWithStates,

  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  screen: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingBottom: 10,
  },


  /* =========================================
     HEADER
  ========================================= */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },

  headerText: { flex: 1, paddingRight: 12 },
  profileAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: { width: '100%', height: '100%', borderRadius: 21 },

  greeting: {
    color: '#FFFFFF',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '700',
    marginBottom: 3,
  },

  welcomeText: {
    color: '#E9D5FF',
    fontSize: 14,
    lineHeight: 20,
  },


  /* =========================================
     RESUMEN
  ========================================= */

  summaryContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    minHeight: 72,
    paddingHorizontal: 9,
    paddingVertical: 9,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },

  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },

  summaryNumber: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '700',
  },

  summaryLabel: {
    color: '#374151',
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '500',
  },


  /* =========================================
     TÍTULOS
  ========================================= */

  sectionTitle: {
    color: '#1F2937',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    marginHorizontal: 24,
    marginTop: 14,
    marginBottom: 8,
  },


  /* =========================================
     CITA
  ========================================= */

  appointmentCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 11,
    padding: 12,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  petAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  petInfo: {
    flex: 1,
  },

  petName: {
    color: '#1F2937',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    marginBottom: 2,
  },

  petService: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 19,
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 9,
  },

  appointmentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  appointmentInfoText: {
    color: '#4B5563',
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 7,
  },

  detailsButton: {
    minHeight: 36,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },


  /* =========================================
     RECORDATORIOS
  ========================================= */

  reminderCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    minHeight: 53,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,

    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  reminderList: { gap: 8 },
  reminderOverdue: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 },
  reminderDue: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderWidth: 1 },
  reminderAppointment: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1 },
  reminderOverdueText: { color: '#991B1B' },
  reminderDueText: { color: '#92400E' },
  reminderAppointmentText: { color: '#1E40AF' },

  reminderIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  reminderInfo: {
    flex: 1,
  },

  reminderTitle: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 2,
  },

  reminderDate: {
    color: '#6B7280',
    fontSize: 12,
  },

  frequentPurchaseList: { gap: 8, marginHorizontal: 24 },
  frequentPurchaseCard: {
    minHeight: 66,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  frequentPurchaseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  frequentPurchaseInfo: { flex: 1, paddingRight: 8 },
  frequentPurchaseName: { color: '#1F2937', fontSize: 15, lineHeight: 20, fontWeight: '700' },
  frequentPurchaseMeta: { color: '#6B7280', fontSize: 13, lineHeight: 18, marginTop: 2 },

  bottomSpace: {
    height: 20,
  },


  /* =========================================
     BARRA INFERIOR
  ========================================= */

  bottomNav: {
    height: 68,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',

    paddingBottom: 4,
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 3,
  },

  navTextActive: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },

});

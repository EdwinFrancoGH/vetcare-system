
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { auth } from '@/config/firebase';
import { API_URL } from '@/config/api';

const colors = {
  primary: '#6D28D9',
  primaryLight: '#EDE9FE',
  background: '#F5F6F8',
  white: '#FFFFFF',
  text: '#1F2937',
  secondary: '#6B7280',
  border: '#E5E7EB',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  orange: '#EA580C',
  orangeLight: '#FFEDD5',
  red: '#DC2626',
  redLight: '#FEE2E2',
};

type Mascota = {
  id: string;
  nombre: string;
};

type Cita = {
  id: string;
  mascotaId: string;
  veterinario: string;
  fecha: string;
  hora: string;
  duracionMinutos?: number;
  propietario?: string;
  telefono?: string;
  motivo: string;
  estado: string;
};

export default function CitasScreen() {
  const router = useRouter();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarCitas = useCallback(async () => {
    try {
      setCargando(true);
      setError('');

      const usuario = auth.currentUser;

      if (!usuario) {
        setError('No hay una sesión activa.');
        return;
      }

      const token = await usuario.getIdToken();

      const mascotasResponse = await fetch(
        `${API_URL}/api/mascotas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const mascotasData = await mascotasResponse.json();

      if (!mascotasResponse.ok) {
        throw new Error(
          mascotasData.mensaje ||
          mascotasData.message ||
          'No se pudieron obtener las mascotas.'
        );
      }

      const mascotasLista: Mascota[] =
        mascotasData.mascotas ||
        mascotasData.data ||
        [];

      setMascotas(mascotasLista);

      const resultados = await Promise.all(
        mascotasLista.map(async (mascota) => {
          const response = await fetch(
            `${API_URL}/api/citas/mascota/${mascota.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.mensaje ||
              data.message ||
              `No se pudieron obtener las citas de ${mascota.nombre}.`
            );
          }

          const lista = data.data || data.citas || [];

          // Conservar el ID de cada cita si el backend lo devuelve
          return lista.map((item: any) => ({
            ...item,
            id: item.id ?? item._id ?? item.citaId,
          }));
        })
      );

      const todasLasCitas: Cita[] = resultados.flat();

      todasLasCitas.sort((a, b) =>
        `${a.fecha} ${a.hora}`.localeCompare(
          `${b.fecha} ${b.hora}`
        )
      );

      setCitas(todasLasCitas);
    } catch (err: any) {
      console.error('Error cargando citas:', err);
      setError(
        err?.message || 'No se pudieron cargar las citas.'
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarCitas();
    }, [cargarCitas])
  );

  const obtenerNombreMascota = (mascotaId: string) => {
    return (
      mascotas.find((item) => item.id === mascotaId)?.nombre ||
      'Mascota'
    );
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return '';

    const partes = fecha.split('-');
    if (partes.length !== 3) return fecha;

    const fechaLocal = new Date(
      Number(partes[0]),
      Number(partes[1]) - 1,
      Number(partes[2])
    );

    return fechaLocal.toLocaleDateString('es-SV', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const obtenerEstado = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'reservada':
        return {
          texto: 'Reservada',
          color: colors.orange,
          background: colors.orangeLight,
        };
      case 'confirmada':
        return {
          texto: 'Confirmada',
          color: colors.green,
          background: colors.greenLight,
        };
      case 'completada':
        return {
          texto: 'Completada',
          color: colors.primary,
          background: colors.primaryLight,
        };
      case 'cancelada':
        return {
          texto: 'Cancelada',
          color: colors.red,
          background: colors.redLight,
        };
      default:
        return {
          texto: estado || 'Sin estado',
          color: colors.secondary,
          background: '#F3F4F6',
        };
    }
  };

  const abrirDetalle = (cita: Cita) => {
    console.log('CITA COMPLETA:', JSON.stringify(cita));
    console.log('ID ENVIADO:', cita.id);

    if (!cita.id) {
      console.error(
        'La cita no tiene id. Revisa la respuesta del backend:',
        cita
      );
      setError(
        'Esta cita no contiene un identificador. Actualiza la lista e inténtalo nuevamente.'
      );
      return;
    }

    router.push(
      `/detalle-cita?id=${encodeURIComponent(String(cita.id))}`
    );
  };

  const citasActivas = citas.filter(
    (cita) =>
      cita.estado?.toLowerCase() !== 'cancelada' &&
      cita.estado?.toLowerCase() !== 'completada'
  );

  const citasAnteriores = citas.filter(
    (cita) =>
      cita.estado?.toLowerCase() === 'cancelada' ||
      cita.estado?.toLowerCase() === 'completada'
  );

  const renderCita = (cita: Cita) => {
    const estado = obtenerEstado(cita.estado);

    return (
      <Pressable
        key={cita.id || `${cita.mascotaId}-${cita.fecha}-${cita.hora}`}
        style={styles.citaCard}
        onPress={() => abrirDetalle(cita)}
      >
        <View style={styles.citaHeader}>
          <View style={styles.mascotaIcon}>
            <Ionicons
              name="paw"
              size={21}
              color={colors.primary}
            />
          </View>

          <View style={styles.citaHeaderInfo}>
            <Text style={styles.mascotaNombre}>
              {obtenerNombreMascota(cita.mascotaId)}
            </Text>
            <Text style={styles.motivo}>
              {cita.motivo || 'Consulta veterinaria'}
            </Text>
          </View>

          <View
            style={[
              styles.estadoBadge,
              { backgroundColor: estado.background },
            ]}
          >
            <Text
              style={[
                styles.estadoTexto,
                { color: estado.color },
              ]}
            >
              {estado.texto}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={18}
            color={colors.secondary}
          />
          <Text style={styles.infoText}>
            {formatearFecha(cita.fecha)}
          </Text>

          <Ionicons
            name="time-outline"
            size={18}
            color={colors.secondary}
            style={styles.infoIcon}
          />
          <Text style={styles.infoText}>{cita.hora}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="person-outline"
            size={18}
            color={colors.secondary}
          />
          <Text style={styles.infoText}>
            {cita.veterinario || 'Por asignar'}
          </Text>
        </View>

        <View style={styles.verDetalle}>
          <Text style={styles.verDetalleTexto}>
            Ver detalle
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.primary}
          />
        </View>
      </Pressable>
    );
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
          <Text style={styles.loadingText}>
            Cargando citas...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={44}
            color={colors.red}
          />
          <Text style={styles.errorTitle}>
            No pudimos cargar las citas
          </Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={cargarCitas}
          >
            <Text style={styles.retryButtonText}>
              Intentar nuevamente
            </Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/citas')}>
            <Text style={styles.linkText}>Volver a citas</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Citas</Text>
            <Text style={styles.headerSubtitle}>
              Administra tus consultas veterinarias
            </Text>
          </View>

          <Pressable
            style={styles.headerRefresh}
            onPress={cargarCitas}
            hitSlop={12}
          >
            <Ionicons
              name="refresh"
              size={21}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>
              Próximas citas
            </Text>

            {citasActivas.length === 0 ? (
              <View style={styles.vacioSeccion}>
                <Text style={styles.vacioSeccionTexto}>
                  No tienes próximas citas.
                </Text>
              </View>
            ) : (
              citasActivas.map(renderCita)
            )}
          </View>

          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Historial</Text>

            {citasAnteriores.length === 0 ? (
              <View style={styles.vacioSeccion}>
                <Text style={styles.vacioSeccionTexto}>
                  No hay citas anteriores.
                </Text>
              </View>
            ) : (
              citasAnteriores.map(renderCita)
            )}
          </View>

          {citas.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={48}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>
                No tienes citas
              </Text>
              <Text style={styles.emptyText}>
                Agenda una cita para tu mascota y aparecerá aquí.
              </Text>
            </View>
          )}
        </ScrollView>

        <Pressable
          style={styles.agendarButton}
          onPress={() => router.push('/agendar-cita')}
          hitSlop={12}
        >
          <Ionicons
            name="add"
            size={25}
            color={colors.white}
          />
          <Text style={styles.agendarButtonText}>
            Agendar cita
          </Text>
        </Pressable>

        <View style={styles.bottomNav}>
          <Pressable
            style={styles.navItem}
            onPress={() => router.replace('/home')}
            hitSlop={12}
          >
            <Ionicons
              name="home-outline"
              size={23}
              color={colors.secondary}
            />
            <Text style={styles.navText}>Inicio</Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={() => router.replace('/mascotas')}
            hitSlop={12}
          >
            <Ionicons
              name="paw-outline"
              size={23}
              color={colors.secondary}
            />
            <Text style={styles.navText}>Mascotas</Text>
          </Pressable>

          <Pressable
            style={styles.navItemActive}
            onPress={() => router.replace('/citas')}
            hitSlop={12}
          >
            <Ionicons
              name="calendar"
              size={23}
              color={colors.primary}
            />
            <Text style={styles.navTextActive}>Citas</Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={() => router.replace('/explore')}
            hitSlop={12}
          >
            <Ionicons
              name="person-outline"
              size={23}
              color={colors.secondary}
            />
            <Text style={styles.navText}>Perfil</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 95,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: colors.secondary,
  },
  headerRefresh: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 150,
  },
  seccion: {
    marginTop: 8,
    marginBottom: 8,
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  citaCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  citaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mascotaIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  citaHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mascotaNombre: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  motivo: {
    fontSize: 13,
    color: colors.secondary,
    marginTop: 3,
  },
  estadoBadge: {
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  estadoTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 13,
    color: colors.text,
  },
  infoIcon: {
    marginLeft: 18,
  },
  verDetalle: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  verDetalleTexto: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 3,
  },
  vacioSeccion: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vacioSeccionTexto: {
    textAlign: 'center',
    color: colors.secondary,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 35,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    color: colors.secondary,
    fontSize: 14,
    lineHeight: 21,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 12,
    color: colors.secondary,
    fontSize: 14,
  },
  errorTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 22,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
    marginTop: 18,
  },
  agendarButton: {
    position: 'absolute',
    right: 20,
    bottom: 82,
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 26,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  agendarButtonText: {
    marginLeft: 7,
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 68,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 65,
  },
  navItemActive: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 65,
  },
  navText: {
    marginTop: 4,
    fontSize: 11,
    color: colors.secondary,
  },
  navTextActive: {
    marginTop: 4,
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },
});


import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

type Mascota = {
  id: string;
  nombre: string;
};

export default function DetalleCitaScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string | string[];
    citaId?: string | string[];
  }>();

  const valorId = params.id ?? params.citaId;
  const citaId = Array.isArray(valorId) ? valorId[0] : valorId;

  const [cita, setCita] = useState<Cita | null>(null);
  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Regresar a la lista de citas de forma directa.
  const volverACitas = () => {
    router.replace('/citas');
  };

  const cargarDetalle = useCallback(async () => {
    try {
      setCargando(true);
      setError('');

      if (!citaId) {
        throw new Error('No se recibió el identificador de la cita.');
      }

      const usuario = auth.currentUser;

      if (!usuario) {
        throw new Error('No hay una sesión activa.');
      }

      const token = await usuario.getIdToken();

      const response = await fetch(
        `${API_URL}/api/citas/${encodeURIComponent(citaId)}`,
        {
          method: 'GET',
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
            'No se pudo obtener la información de la cita.'
        );
      }

      const citaObtenida = data.cita || data.data;

      if (!citaObtenida) {
        throw new Error('El servidor no devolvió los datos de la cita.');
      }

      const citaNormalizada: Cita = {
        ...citaObtenida,
        id: String(
          citaObtenida.id ??
            citaObtenida._id ??
            citaObtenida.citaId ??
            citaId
        ),
      };

      setCita(citaNormalizada);

      if (citaNormalizada.mascotaId) {
        try {
          const mascotaResponse = await fetch(
            `${API_URL}/api/mascotas/${encodeURIComponent(
              citaNormalizada.mascotaId
            )}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (mascotaResponse.ok) {
            const mascotaData = await mascotaResponse.json();
            setMascota(mascotaData.mascota || mascotaData.data || null);
          }
        } catch (err) {
          console.log('No se pudo cargar la mascota:', err);
        }
      }
    } catch (err: any) {
      console.error('Error cargando detalle de cita:', err);
      setError(err?.message || 'No se pudo cargar el detalle de la cita.');
    } finally {
      setCargando(false);
    }
  }, [citaId]);

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

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
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const obtenerEstado = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'reservada':
        return {
          texto: 'Reservada',
          color: colors.orange,
          fondo: colors.orangeLight,
          icono: 'time-outline' as const,
        };
      case 'confirmada':
        return {
          texto: 'Confirmada',
          color: colors.green,
          fondo: colors.greenLight,
          icono: 'checkmark-circle-outline' as const,
        };
      case 'completada':
        return {
          texto: 'Completada',
          color: colors.primary,
          fondo: colors.primaryLight,
          icono: 'checkmark-done-outline' as const,
        };
      case 'cancelada':
        return {
          texto: 'Cancelada',
          color: colors.red,
          fondo: colors.redLight,
          icono: 'close-circle-outline' as const,
        };
      default:
        return {
          texto: estado || 'Sin estado',
          color: colors.secondary,
          fondo: '#F3F4F6',
          icono: 'help-circle-outline' as const,
        };
    }
  };

  const cancelarCita = () => {
    if (!cita) return;

    Alert.alert(
      'Cancelar cita',
      '¿Estás seguro de que deseas cancelar esta cita?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: ejecutarCancelacion,
        },
      ]
    );
  };

  const ejecutarCancelacion = async () => {
    try {
      if (!cita) return;

      const usuario = auth.currentUser;

      if (!usuario) {
        Alert.alert('Sesión', 'No hay una sesión activa.');
        return;
      }

      const token = await usuario.getIdToken();

      const response = await fetch(
        `${API_URL}/api/citas/${encodeURIComponent(cita.id)}/cancelar`,
        {
          method: 'PUT',
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
            'No se pudo cancelar la cita.'
        );
      }

      Alert.alert(
        'Cita cancelada',
        'La cita fue cancelada correctamente.',
        [{ text: 'Aceptar', onPress: volverACitas }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo cancelar la cita.');
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.textoSecundario}>Cargando detalle...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !cita) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centro}>
          <View style={styles.iconoError}>
            <Ionicons
              name="alert-circle-outline"
              size={44}
              color={colors.red}
            />
          </View>

          <Text style={styles.tituloError}>
            No pudimos cargar la cita
          </Text>

          <Text style={styles.errorTexto}>
            {error || 'La cita no fue encontrada.'}
          </Text>

          <Pressable
            style={styles.botonPrincipal}
            onPress={cargarDetalle}
          >
            <Text style={styles.botonPrincipalTexto}>
              Intentar nuevamente
            </Text>
          </Pressable>

          <Pressable
            style={styles.botonVolverGrande}
            onPress={volverACitas}
            hitSlop={15}
          >
            <Ionicons name="arrow-back" size={25} color={colors.white} />
            <Text style={styles.textoBotonVolver}>
              Volver a citas
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const estado = obtenerEstado(cita.estado);
  const puedeCancelar =
    cita.estado?.toLowerCase() !== 'cancelada' &&
    cita.estado?.toLowerCase() !== 'completada';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Encabezado con botón grande y más abajo */}
        <View style={styles.header}>
          <Pressable
            style={styles.botonVolverGrande}
            onPress={volverACitas}
            hitSlop={15}
            accessibilityRole="button"
            accessibilityLabel="Volver a citas"
          >
            <Ionicons
              name="arrow-back"
              size={30}
              color={colors.white}
            />
          </Pressable>

          <Text style={styles.tituloHeader}>
            Detalle de cita
          </Text>

          <View style={styles.espaciador} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contenido}
        >
          <View
            style={[
              styles.tarjetaEstado,
              { backgroundColor: estado.fondo },
            ]}
          >
            <View style={styles.iconoEstado}>
              <Ionicons
                name={estado.icono}
                size={30}
                color={estado.color}
              />
            </View>

            <View style={styles.datosEstado}>
              <Text
                style={[
                  styles.tituloEstado,
                  { color: estado.color },
                ]}
              >
                {estado.texto}
              </Text>
              <Text style={styles.textoSecundario}>
                Estado de la cita
              </Text>
            </View>
          </View>

          <Text style={styles.tituloSeccion}>Mascota</Text>
          <InfoCard
            icono="paw"
            etiqueta="Paciente"
            valor={mascota?.nombre || 'Mascota'}
          />

          <Text style={styles.tituloSeccion}>Fecha y hora</Text>
          <InfoCard
            icono="calendar-outline"
            etiqueta="Fecha"
            valor={formatearFecha(cita.fecha)}
          />
          <InfoCard
            icono="time-outline"
            etiqueta="Hora"
            valor={cita.hora}
            secundario={
              cita.duracionMinutos
                ? `Duración: ${cita.duracionMinutos} minutos`
                : undefined
            }
          />

          <Text style={styles.tituloSeccion}>Veterinario</Text>
          <InfoCard
            icono="person-outline"
            etiqueta="Médico veterinario"
            valor={cita.veterinario || 'Por asignar'}
          />

          <Text style={styles.tituloSeccion}>
            Motivo de consulta
          </Text>
          <View style={styles.tarjetaTexto}>
            <Ionicons
              name="medical-outline"
              size={23}
              color={colors.primary}
            />
            <Text style={styles.textoMotivo}>
              {cita.motivo || 'Sin motivo registrado'}
            </Text>
          </View>

          {(cita.propietario || cita.telefono) && (
            <>
              <Text style={styles.tituloSeccion}>
                Datos de contacto
              </Text>

              {cita.propietario && (
                <InfoCard
                  icono="person-circle-outline"
                  etiqueta="Propietario"
                  valor={cita.propietario}
                />
              )}

              {cita.telefono && (
                <InfoCard
                  icono="call-outline"
                  etiqueta="Teléfono"
                  valor={cita.telefono}
                />
              )}
            </>
          )}

          {puedeCancelar && (
            <Pressable
              style={styles.botonCancelar}
              onPress={cancelarCita}
            >
              <Ionicons
                name="close-circle-outline"
                size={22}
                color={colors.red}
              />
              <Text style={styles.textoCancelar}>
                Cancelar cita
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function InfoCard({
  icono,
  etiqueta,
  valor,
  secundario,
}: {
  icono: React.ComponentProps<typeof Ionicons>['name'];
  etiqueta: string;
  valor: string;
  secundario?: string;
}) {
  return (
    <View style={styles.tarjetaInfo}>
      <View style={styles.iconoInfo}>
        <Ionicons name={icono} size={25} color={colors.primary} />
      </View>

      <View style={styles.contenidoInfo}>
        <Text style={styles.etiquetaInfo}>{etiqueta}</Text>
        <Text style={styles.valorInfo}>{valor}</Text>
        {secundario ? (
          <Text style={styles.textoSecundario}>{secundario}</Text>
        ) : null}
      </View>
    </View>
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
    minHeight: 112,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  botonVolverGrande: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tituloHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 10,
  },
  espaciador: {
    width: 64,
  },
  contenido: {
    padding: 20,
    paddingBottom: 40,
  },
  tarjetaEstado: {
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconoEstado: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datosEstado: {
    marginLeft: 14,
  },
  tituloEstado: {
    fontSize: 18,
    fontWeight: '700',
  },
  textoSecundario: {
    marginTop: 4,
    fontSize: 13,
    color: colors.secondary,
  },
  tituloSeccion: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 10,
  },
  tarjetaInfo: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconoInfo: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenidoInfo: {
    flex: 1,
    marginLeft: 13,
  },
  etiquetaInfo: {
    fontSize: 12,
    color: colors.secondary,
    marginBottom: 3,
  },
  valorInfo: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  tarjetaTexto: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  textoMotivo: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  botonCancelar: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.redLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  textoCancelar: {
    marginLeft: 8,
    color: colors.red,
    fontSize: 15,
    fontWeight: '700',
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  iconoError: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.redLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  tituloError: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  errorTexto: {
    marginTop: 9,
    fontSize: 14,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  botonPrincipal: {
    marginTop: 22,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  botonPrincipalTexto: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  textoBotonVolver: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
});

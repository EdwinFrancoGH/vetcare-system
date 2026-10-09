import React, { useEffect, useState } from 'react';

import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

import { auth } from '@/config/firebase';
import { API_URL } from '@/config/api';

const colors = Colors.light;

type Mascota = {
  id: string;
  nombre: string;
  especie: string;
  raza: string;
  sexo: string;
  edad: number;
  peso: number;
  color?: string;
  fechaNacimiento: string;
  propietario: string;
  telefono: string;
  direccion: string;
  estado: string;
  foto?: string;
  imagen?: string;
};

type Historial = {
  id?: string;
  mascotaId: string;
  fecha: string;
  motivoConsulta: string;
  diagnostico: string;
  tratamiento?: string;
  peso: number;
  veterinario?: string;
  proximaCita?: string;
  observaciones?: string;
};

type Vacuna = {
  id?: string;
  mascotaId: string;
  nombre: string;
  fecha: string;
  proximaFecha?: string;
  veterinario?: string;
  lote?: string;
  observaciones?: string;
};

export default function DetalleMascotaScreen() {
  const router = useRouter();

  const { id } = useLocalSearchParams();

  const [mascota, setMascota] = useState<Mascota | null>(null);

  const [historiales, setHistoriales] = useState<Historial[]>([]);
  const [vacunas, setVacunas] = useState<Vacuna[]>([]);

  const [pestanaActiva, setPestanaActiva] = useState<
    'informacion' | 'salud'
  >('informacion');

  const [cargando, setCargando] = useState(true);
  const [cargandoSalud, setCargandoSalud] = useState(false);

  const [error, setError] = useState('');
  const [errorSalud, setErrorSalud] = useState('');

  useEffect(() => {
    cargarMascota();
  }, [id]);

  const cargarMascota = async () => {
    try {
      setCargando(true);
      setError('');

      if (!id || typeof id !== 'string') {
        setError('No se recibió el ID de la mascota.');
        return;
      }

      const usuario = auth.currentUser;

      if (!usuario) {
        setError('No hay una sesión activa.');
        return;
      }

      const token = await usuario.getIdToken();

      const response = await fetch(
        `${API_URL}/api/mascotas/${id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      console.log(
        'RESPUESTA DETALLE MASCOTA:',
        JSON.stringify(data, null, 2)
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            'No se pudo obtener la mascota.'
        );
      }

      setMascota(data.data);
    } catch (err) {
      console.error('Error obteniendo mascota:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al cargar la mascota.'
      );
    } finally {
      setCargando(false);
    }
  };

  // =====================================================
  // CARGAR INFORMACIÓN DE SALUD
  // =====================================================

  const cargarSalud = async () => {
    try {
      if (!id || typeof id !== 'string') {
        setErrorSalud('No se recibió el ID de la mascota.');
        return;
      }

      const usuario = auth.currentUser;

      if (!usuario) {
        setErrorSalud('No hay una sesión activa.');
        return;
      }

      setCargandoSalud(true);
      setErrorSalud('');

      const token = await usuario.getIdToken();

      // Historial médico
      const historialResponse = await fetch(
        `${API_URL}/api/historiales/mascota/${id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const historialData = await historialResponse.json();

      console.log(
        'RESPUESTA HISTORIAL:',
        JSON.stringify(historialData, null, 2)
      );

      if (!historialResponse.ok) {
        throw new Error(
          historialData?.mensaje ||
            historialData?.message ||
            historialData?.error ||
            'No se pudo obtener el historial.'
        );
      }

      // Vacunas
      const vacunasResponse = await fetch(
        `${API_URL}/api/vacunas/mascota/${id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const vacunasData = await vacunasResponse.json();

      console.log(
        'RESPUESTA VACUNAS:',
        JSON.stringify(vacunasData, null, 2)
      );

      if (!vacunasResponse.ok) {
        throw new Error(
          vacunasData?.mensaje ||
            vacunasData?.message ||
            vacunasData?.error ||
            'No se pudieron obtener las vacunas.'
        );
      }

      setHistoriales(
        Array.isArray(historialData?.historiales)
          ? historialData.historiales
          : []
      );

      setVacunas(
        Array.isArray(vacunasData?.data)
          ? vacunasData.data
          : []
      );

    } catch (err) {
      console.error('Error cargando salud:', err);

      setErrorSalud(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al cargar la información de salud.'
      );
    } finally {
      setCargandoSalud(false);
    }
  };

  const cambiarPestana = (
    pestana: 'informacion' | 'salud'
  ) => {
    setPestanaActiva(pestana);

    if (pestana === 'salud') {
      cargarSalud();
    }
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) {
      return 'No especificada';
    }

    try {
      const fechaObj = new Date(fecha);

      if (Number.isNaN(fechaObj.getTime())) {
        return fecha;
      }

      return fechaObj.toLocaleDateString('es-SV', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return fecha;
    }
  };

  const formatearEdad = (edad: number) => {
    if (edad === undefined || edad === null) {
      return 'No especificada';
    }

    if (edad === 1) {
      return '1 año';
    }

    return `${edad} años`;
  };

  const formatearPeso = (peso: number) => {
    if (peso === undefined || peso === null) {
      return 'No especificado';
    }

    return `${peso} kg`;
  };

  const valorSeguro = (valor?: string | number) => {
    if (
      valor === undefined ||
      valor === null ||
      valor === ''
    ) {
      return 'No especificado';
    }

    return String(valor);
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.loadingText}>
            Cargando información...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !mascota) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons
              name="alert-circle-outline"
              size={42}
              color={colors.primary}
            />
          </View>

          <Text style={styles.errorTitle}>
            No se pudo cargar la mascota
          </Text>

          <Text style={styles.errorText}>
            {error || 'No se encontró la información.'}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={cargarMascota}
          >
            <Text style={styles.retryButtonText}>
              Reintentar
            </Text>
          </Pressable>

          <Pressable
            style={styles.backErrorButton}
            onPress={() => router.replace('/mascotas')}
          >
            <Text style={styles.backErrorButtonText}>
              Volver a Mascotas
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>

        {/* =========================================
            CONTENIDO
        ========================================= */}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >

          {/* =========================================
              PARTE SUPERIOR
          ========================================= */}

          <View style={styles.topSection}>

            {/* Botón regresar */}

            <Pressable
              style={styles.roundButton}
              onPress={() => {
                console.log('REGRESANDO A MASCOTAS');
                router.replace('/mascotas');
              }}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color="#374151"
              />
            </Pressable>

            {/* Botón editar */}

            <Pressable
              style={styles.roundButton}
              onPress={() => console.log('Editar mascota')}
            >
              <Ionicons
                name="create-outline"
                size={21}
                color="#374151"
              />
            </Pressable>

          </View>

          {/* =========================================
              INFORMACIÓN PRINCIPAL
          ========================================= */}

          <View style={styles.petMainCard}>

            <View style={styles.petMainInfo}>

              <Text style={styles.petName}>
                {mascota.nombre}
              </Text>

              <Text style={styles.petSubtitle}>
                {valorSeguro(mascota.raza)} •{' '}
                {formatearEdad(mascota.edad)}
              </Text>

            </View>

            <View style={styles.petIcon}>
              <Ionicons
                name="paw"
                size={24}
                color="#FFFFFF"
              />
            </View>

          </View>

          {/* =========================================
              TABS
          ========================================= */}

          <View style={styles.tabs}>

            <Pressable
              style={styles.tab}
              onPress={() => cambiarPestana('informacion')}
            >
              <Text
                style={
                  pestanaActiva === 'informacion'
                    ? styles.activeTabText
                    : styles.tabText
                }
              >
                Información
              </Text>

              {pestanaActiva === 'informacion' && (
                <View style={styles.activeIndicator} />
              )}
            </Pressable>

            <Pressable
              style={styles.tab}
              onPress={() => cambiarPestana('salud')}
            >
              <Text
                style={
                  pestanaActiva === 'salud'
                    ? styles.activeTabText
                    : styles.tabText
                }
              >
                Salud
              </Text>

              {pestanaActiva === 'salud' && (
                <View style={styles.activeIndicator} />
              )}
            </Pressable>

            <Pressable
              style={styles.tab}
              onPress={() => console.log('Notas')}
            >
              <Text style={styles.tabText}>
                Notas
              </Text>
            </Pressable>

          </View>

          {/* =========================================
              INFORMACIÓN
          ========================================= */}

          {pestanaActiva === 'informacion' && (
            <View style={styles.infoSection}>

              <InfoRow
                label="Especie"
                value={valorSeguro(mascota.especie)}
              />

              <InfoRow
                label="Raza"
                value={valorSeguro(mascota.raza)}
              />

              <InfoRow
                label="Fecha de nacimiento"
                value={formatearFecha(mascota.fechaNacimiento)}
              />

              <InfoRow
                label="Sexo"
                value={valorSeguro(mascota.sexo)}
              />

              <InfoRow
                label="Edad"
                value={formatearEdad(mascota.edad)}
              />

              <InfoRow
                label="Peso"
                value={formatearPeso(mascota.peso)}
              />

              <InfoRow
                label="Color"
                value={valorSeguro(mascota.color)}
              />

              <InfoRow
                label="Propietario"
                value={valorSeguro(mascota.propietario)}
              />

              <InfoRow
                label="Teléfono"
                value={valorSeguro(mascota.telefono)}
              />

              <InfoRow
                label="Dirección"
                value={valorSeguro(mascota.direccion)}
              />

              <InfoRow
                label="Estado"
                value={valorSeguro(mascota.estado)}
              />

            </View>
          )}

          {/* =========================================
              SALUD
          ========================================= */}

          {pestanaActiva === 'salud' && (
            <View style={styles.healthSection}>

              {cargandoSalud ? (
                <View style={styles.healthLoading}>
                  <ActivityIndicator
                    size="large"
                    color={colors.primary}
                  />

                  <Text style={styles.loadingText}>
                    Cargando información de salud...
                  </Text>
                </View>
              ) : errorSalud ? (
                <View style={styles.healthError}>

                  <Ionicons
                    name="alert-circle-outline"
                    size={36}
                    color={colors.primary}
                  />

                  <Text style={styles.healthErrorText}>
                    {errorSalud}
                  </Text>

                  <Pressable
                    style={styles.retryButton}
                    onPress={cargarSalud}
                  >
                    <Text style={styles.retryButtonText}>
                      Reintentar
                    </Text>
                  </Pressable>

                </View>
              ) : (
                <>
                  {/* =========================================
                      HISTORIAL MÉDICO
                  ========================================= */}

                  <View style={styles.healthHeader}>
                    <Ionicons
                      name="medkit-outline"
                      size={21}
                      color={colors.primary}
                    />

                    <Text style={styles.healthTitle}>
                      Historial médico
                    </Text>
                  </View>

                  {historiales.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Ionicons
                        name="document-text-outline"
                        size={34}
                        color="#9CA3AF"
                      />

                      <Text style={styles.emptyTitle}>
                        Sin historial médico
                      </Text>

                      <Text style={styles.emptyText}>
                        No hay consultas médicas registradas para esta mascota.
                      </Text>
                    </View>
                  ) : (
                    historiales.map((historial, index) => (
                      <View
                        key={historial.id || `${historial.fecha}-${index}`}
                        style={styles.healthCard}
                      >

                        <View style={styles.cardHeaderRow}>
                          <Text style={styles.cardDate}>
                            {formatearFecha(historial.fecha)}
                          </Text>

                          <Ionicons
                            name="medical-outline"
                            size={20}
                            color={colors.primary}
                          />
                        </View>

                        <Text style={styles.cardLabel}>
                          Motivo de consulta
                        </Text>

                        <Text style={styles.cardValue}>
                          {valorSeguro(historial.motivoConsulta)}
                        </Text>

                        <Text style={styles.cardLabel}>
                          Diagnóstico
                        </Text>

                        <Text style={styles.cardValue}>
                          {valorSeguro(historial.diagnostico)}
                        </Text>

                        {historial.tratamiento && (
                          <>
                            <Text style={styles.cardLabel}>
                              Tratamiento
                            </Text>

                            <Text style={styles.cardValue}>
                              {historial.tratamiento}
                            </Text>
                          </>
                        )}

                        <View style={styles.cardBottomRow}>

                          <Text style={styles.cardSmallText}>
                            Peso: {formatearPeso(historial.peso)}
                          </Text>

                          {historial.veterinario && (
                            <Text style={styles.cardSmallText}>
                              Dr. {historial.veterinario}
                            </Text>
                          )}

                        </View>

                      </View>
                    ))
                  )}

                  {/* =========================================
                      VACUNAS
                  ========================================= */}

                  <View style={styles.healthHeader}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={21}
                      color={colors.primary}
                    />

                    <Text style={styles.healthTitle}>
                      Vacunas
                    </Text>
                  </View>

                  {vacunas.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Ionicons
                        name="shield-outline"
                        size={34}
                        color="#9CA3AF"
                      />

                      <Text style={styles.emptyTitle}>
                        Sin vacunas registradas
                      </Text>

                      <Text style={styles.emptyText}>
                        No hay vacunas registradas para esta mascota.
                      </Text>
                    </View>
                  ) : (
                    vacunas.map((vacuna, index) => (
                      <View
                        key={vacuna.id || `${vacuna.nombre}-${index}`}
                        style={styles.vaccineCard}
                      >

                        <View style={styles.vaccineIcon}>
                          <Ionicons
                            name="shield-checkmark"
                            size={22}
                            color={colors.primary}
                          />
                        </View>

                        <View style={styles.vaccineInfo}>

                          <Text style={styles.vaccineName}>
                            {vacuna.nombre}
                          </Text>

                          <Text style={styles.vaccineDate}>
                            Aplicada: {formatearFecha(vacuna.fecha)}
                          </Text>

                          {vacuna.proximaFecha && (
                            <Text style={styles.vaccineNext}>
                              Próxima: {formatearFecha(vacuna.proximaFecha)}
                            </Text>
                          )}

                          {vacuna.veterinario && (
                            <Text style={styles.vaccineVet}>
                              Veterinario: {vacuna.veterinario}
                            </Text>
                          )}

                        </View>

                      </View>
                    ))
                  )}
                </>
              )}

            </View>
          )}

        </ScrollView>

        {/* =========================================
            BARRA INFERIOR
        ========================================= */}

        <View style={styles.bottomNav}>

          {/* Inicio */}

          <Pressable
            style={styles.navItem}
            onPress={() => router.replace('/home')}
          >
            <Ionicons
              name="home-outline"
              size={22}
              color="#9CA3AF"
            />

            <Text style={styles.navText}>
              Inicio
            </Text>
          </Pressable>

          {/* Mascotas */}

          <Pressable
            style={styles.navItem}
            onPress={() => {
              console.log('REGRESANDO A MASCOTAS');
              router.replace('/mascotas');
            }}
          >
            <Ionicons
              name="paw"
              size={22}
              color={colors.primary}
            />

            <Text style={styles.navTextActive}>
              Mascotas
            </Text>
          </Pressable>

          {/* Citas */}

          <Pressable
            style={styles.navItem}
            onPress={() => console.log('Citas')}
          >
            <Ionicons
              name="calendar-outline"
              size={22}
              color="#9CA3AF"
            />

            <Text style={styles.navText}>
              Citas
            </Text>
          </Pressable>

          {/* Perfil */}

          <Pressable
            style={styles.navItem}
            onPress={() => router.push('/explore')}
          >
            <Ionicons
              name="person-outline"
              size={22}
              color="#9CA3AF"
            />

            <Text style={styles.navText}>
              Perfil
            </Text>
          </Pressable>

        </View>

      </View>
    </SafeAreaView>
  );
}

/* =====================================================
   COMPONENTE FILA DE INFORMACIÓN
===================================================== */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>

      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>

    </View>
  );
}

/* =====================================================
   ESTILOS
===================================================== */

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  screen: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingBottom: 20,
  },

  /* =========================================
     LOADING / ERROR
  ========================================= */

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
  },

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },

  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  retryButton: {
    marginTop: 24,
    minWidth: 130,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  backErrorButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  backErrorButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  /* =========================================
     PARTE SUPERIOR
  ========================================= */

  topSection: {
    height: 105,
    paddingHorizontal: 18,
    paddingTop: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
    elevation: 10,
  },

  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    zIndex: 20,
  },

  /* =========================================
     TARJETA PRINCIPAL
  ========================================= */

  petMainCard: {
    marginHorizontal: 10,
    minHeight: 66,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
  },

  petMainInfo: {
    flex: 1,
  },

  petName: {
    color: '#1F2937',
    fontSize: 20,
    fontWeight: '700',
  },

  petSubtitle: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 3,
  },

  petIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* =========================================
     TABS
  ========================================= */

  tabs: {
    height: 66,
    marginTop: 0,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 9,
    position: 'relative',
  },

  activeTabText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  tabText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },

  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
  },

  /* =========================================
     INFORMACIÓN
  ========================================= */

  infoSection: {
    paddingHorizontal: 14,
    paddingTop: 20,
  },

  infoRow: {
    minHeight: 41,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
  },

  infoLabel: {
    color: '#4B5563',
    fontSize: 14,
  },

  infoValue: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '58%',
    textAlign: 'right',
  },

  /* =========================================
     SALUD
  ========================================= */

  healthSection: {
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 20,
  },

  healthLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },

  healthError: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },

  healthErrorText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },

  healthTitle: {
    marginLeft: 8,
    color: '#1F2937',
    fontSize: 17,
    fontWeight: '700',
  },

  healthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    elevation: 1,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  cardDate: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  cardLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 3,
  },

  cardValue: {
    color: '#1F2937',
    fontSize: 14,
    lineHeight: 20,
  },

  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  cardSmallText: {
    color: '#6B7280',
    fontSize: 12,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 28,
    paddingHorizontal: 18,
    marginBottom: 24,
    alignItems: 'center',
    elevation: 1,
  },

  emptyTitle: {
    marginTop: 10,
    color: '#374151',
    fontSize: 15,
    fontWeight: '700',
  },

  emptyText: {
    marginTop: 5,
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },

  vaccineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 1,
  },

  vaccineIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  vaccineInfo: {
    flex: 1,
  },

  vaccineName: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '700',
  },

  vaccineDate: {
    marginTop: 5,
    color: '#6B7280',
    fontSize: 12,
  },

  vaccineNext: {
    marginTop: 3,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  vaccineVet: {
    marginTop: 3,
    color: '#9CA3AF',
    fontSize: 12,
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
    fontSize: 10,
    marginTop: 3,
  },

  navTextActive: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },

});
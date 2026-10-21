import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { auth } from '@/config/firebase';
import { API_URL } from '@/config/api';

export default function AgendarCita() {
  const router = useRouter();
  const regresar = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/citas');
  };

  const [mascotas, setMascotas] = useState<any[]>([]);
  const [disponibles, setDisponibles] = useState<any[]>([]);

  const [mascotaId, setMascotaId] = useState('');
  const [veterinario, setVeterinario] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const motivos = ['Consulta general', 'Vacunación', 'Desparasitación', 'Seguimiento', 'Emergencia', 'Otro'];

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');

  const fechaHoraLocalActual = () => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/El_Salvador', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
    const value = (type: string) => parts.find((part) => part.type === type)?.value || '';
    return `${value('year')}-${value('month')}-${value('day')} ${value('hour')}:${value('minute')}`;
  };
  const horarioEsFuturo = (item: any) => `${item.fecha} ${item.hora}` > fechaHoraLocalActual();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setErrorCarga('');
      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('Inicia sesión para consultar horarios.');

      const token = await user.getIdToken();

      const mascotasRes = await fetch(
        `${API_URL}/api/mascotas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const mascotasData = await mascotasRes.json();
      if (!mascotasRes.ok) throw new Error(mascotasData.message || 'No se pudieron cargar tus mascotas.');

      const mascotasLista = (mascotasData.mascotas || mascotasData.data || []).map((pet: any) => ({ ...pet, id: String(pet.id ?? pet._id ?? '') }));
      setMascotas(mascotasLista);

      const citasRes = await fetch(
        `${API_URL}/api/citas/disponibles`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const citasData = await citasRes.json();
      if (!citasRes.ok) throw new Error(citasData.message || 'No se pudieron cargar los horarios disponibles.');

      setDisponibles((citasData.data || []).filter(horarioEsFuturo));

    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron cargar los datos.';
      setErrorCarga(message);
      console.error('Error cargando datos para agendar:', error);
      Alert.alert(
        'Error',
        message
      );
    } finally {
      setLoading(false);
    }
  };

  const seleccionarHorario = (
    horario: any
  ) => {
    setVeterinario(
      horario.veterinario
    );

    setFecha(
      horario.fecha
    );

    setHora(
      horario.hora
    );
  };

  const reservar = async () => {
    if (guardando) return;
    if (
      !mascotaId ||
      !veterinario ||
      !fecha ||
      !hora ||
      !(motivoSeleccionado === 'Otro' ? motivo.trim() : motivoSeleccionado)
    ) {
      Alert.alert(
        'Datos incompletos',
        'Completa todos los campos.'
      );
      return;
    }

    try {
      setGuardando(true);

      const user = auth.currentUser;

      if (!user) {
        Alert.alert(
          'Sesión',
          'Tu sesión ha expirado.'
        );
        return;
      }

      const token =
        await user.getIdToken();

      const mascota =
        mascotas.find(
          (item) =>
            item.id === mascotaId
        );
      if (!mascota?.propietario?.trim() || !mascota?.telefono?.trim()) {
        Alert.alert('Datos del propietario', 'La ficha de esta mascota no tiene nombre y teléfono de contacto. Actualiza sus datos antes de reservar.');
        return;
      }

      const response =
        await fetch(
          `${API_URL}/api/citas/reservar`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              veterinario,
              fecha,
              hora,
              mascotaId,
              propietario: mascota.propietario.trim(),
              telefono: mascota.telefono.trim(),
              motivo: motivoSeleccionado === 'Otro' ? motivo.trim() : motivoSeleccionado,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        Alert.alert(
          'No se pudo reservar',
          data.message ||
            'El horario ya no está disponible.'
        );
        return;
      }

      Alert.alert(
        '¡Cita reservada!',
        'Tu cita fue registrada correctamente.',
        [
          {
            text: 'Aceptar',
            onPress: regresar,
          },
        ]
      );

    } catch (error) {
      console.error('Error reservando cita:', error);

      Alert.alert(
        'Error',
        'No se pudo reservar la cita.'
      );

    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <ActivityIndicator
          size="large"
          color="#6D28D9"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >

        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={regresar}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Volver a la pantalla anterior"
          >
            <Ionicons
              name="arrow-back"
              size={26}
              color="#1F2937"
            />
          </Pressable>

          <Text style={styles.title}>
            Agendar cita
          </Text>
        </View>

        {errorCarga ? <View style={styles.emptyPetBox}><Text style={styles.empty}>{errorCarga}</Text><Pressable onPress={cargarDatos}><Text style={styles.retry}>Intentar de nuevo</Text></Pressable></View> : null}

        <Text style={styles.label}>
          Mascota
        </Text>

        {mascotas.length === 0 ? (
          <View style={styles.emptyPetBox}>
            <Text style={styles.empty}>Primero registra una mascota para poder agendar.</Text>
            <Pressable style={styles.button} onPress={() => router.push('/agregar-mascota')}>
              <Text style={styles.buttonText}>Registrar mascota</Text>
            </Pressable>
          </View>
        ) : null}

        <View>
          {mascotas.map(
            (mascota) => (
              <Pressable
                key={mascota.id}
                style={[
                  styles.option,
                  mascotaId ===
                    mascota.id &&
                    styles.selected,
                ]}
                onPress={() =>
                  setMascotaId(
                    mascota.id
                  )
                }
              >
                <Ionicons
                  name="paw-outline"
                  size={20}
                  color="#6D28D9"
                />

                <Text>
                  {mascota.nombre}
                </Text>
              </Pressable>
            )
          )}
        </View>

        <Text style={styles.label}>
          Horarios disponibles
        </Text>

        {disponibles.length === 0 ? (
          <Text style={styles.empty}>
            No hay horarios disponibles.
          </Text>
        ) : (
          disponibles.filter(horarioEsFuturo)
            .slice(0, 30)
            .map((item, index) => (
              <Pressable
                key={index}
                style={[
                  styles.horario,
                  fecha ===
                    item.fecha &&
                    hora ===
                    item.hora &&
                    veterinario ===
                    item.veterinario &&
                    styles.selected,
                ]}
                onPress={() =>
                  seleccionarHorario(
                    item
                  )
                }
              >
                <Text
                  style={
                    styles.horarioVeterinario
                  }
                >
                  {item.veterinario}
                </Text>

                <Text>
                  {item.fecha} • {item.hora}
                </Text>
              </Pressable>
            ))
        )}

        <Text style={styles.label}>
          Motivo de la consulta
        </Text>

        <View style={styles.motivosContainer}>
          {motivos.map((item) => (
            <Pressable key={item} style={[styles.option, motivoSeleccionado === item && styles.selected]} onPress={() => { setMotivoSeleccionado(item); setMotivo(''); }}>
              <Text>{item}</Text>
            </Pressable>
          ))}
        </View>

        {motivoSeleccionado === 'Otro' ? <TextInput
          style={styles.input}
          placeholder="Describe el motivo"
          value={motivo}
          onChangeText={setMotivo}
          multiline
        /> : null}

        <Pressable
          style={[
            styles.button,
            guardando &&
              styles.buttonDisabled,
          ]}
          onPress={reservar}
          disabled={guardando || mascotas.length === 0}
        >
          {guardando ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text
              style={styles.buttonText}
            >
              Confirmar cita
            </Text>
          )}
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    gap: 15,
  },
  backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#FFFFFF' },

  title: {
    fontSize: 27,
    fontWeight: '700',
    color: '#1F2937',
  },

  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 18,
    marginBottom: 10,
  },

  option: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  horario: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  horarioVeterinario: {
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },

  selected: {
    borderColor: '#6D28D9',
    backgroundColor: '#EDE9FE',
  },

  empty: {
    color: '#6B7280',
    marginTop: 10,
  },
  emptyPetBox: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  retry: { color: '#6D28D9', fontWeight: '700', marginTop: 8 },
  motivosContainer: { gap: 4 },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },

  button: {
    backgroundColor: '#6D28D9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 25,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

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

  const [mascotas, setMascotas] = useState<any[]>([]);
  const [disponibles, setDisponibles] = useState<any[]>([]);

  const [mascotaId, setMascotaId] = useState('');
  const [veterinario, setVeterinario] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

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

      setMascotas(
        mascotasData.mascotas ||
        mascotasData.data ||
        []
      );

      const citasRes = await fetch(
        `${API_URL}/api/citas/disponibles`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const citasData = await citasRes.json();

      setDisponibles(
        citasData.data || []
      );

    } catch (error) {
      console.log('Error cargando datos:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar los datos.'
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
    if (
      !mascotaId ||
      !veterinario ||
      !fecha ||
      !hora ||
      !motivo.trim()
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
              propietario:
                mascota?.propietario ||
                user.email ||
                'Cliente',
              telefono:
                mascota?.telefono ||
                '00000000',
              motivo:
                motivo.trim(),
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
            onPress: () =>
              router.replace('/citas'),
          },
        ]
      );

    } catch (error) {
      console.log(
        'Error reservando cita:',
        error
      );

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
            onPress={() =>
              router.replace('/citas')
            }
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

        <Text style={styles.label}>
          Mascota
        </Text>

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
          disponibles
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

        <TextInput
          style={styles.input}
          placeholder="Ej. Consulta general"
          value={motivo}
          onChangeText={setMotivo}
        />

        <Pressable
          style={[
            styles.button,
            guardando &&
              styles.buttonDisabled,
          ]}
          onPress={reservar}
          disabled={guardando}
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
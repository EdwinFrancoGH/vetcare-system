import React, { useCallback, useState } from 'react';

import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
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
  fechaNacimiento?: string;
  propietario?: string;
  telefono?: string;
  direccion?: string;
  estado?: string;
  foto?: string;
  imagen?: string;
};

export default function MascotasScreen() {
  const router = useRouter();

  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarMascotas = async () => {
    try {
      setLoading(true);
      setError('');

      const user = auth.currentUser;

      if (!user) {
        setError('No hay una sesión activa.');
        return;
      }

      console.log('================================');
      console.log('CARGANDO MASCOTAS');
      console.log('================================');
      console.log('Usuario:', user.email);
      console.log('UID:', user.uid);

      const token = await user.getIdToken();

      const url = `${API_URL}/api/mascotas`;

      console.log('URL:', url);
      console.log('Consultando mascotas...');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Status:', response.status);

      const responseText = await response.text();

      console.log('Respuesta:', responseText);

      let data: any = {};

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `El servidor respondió algo que no es JSON. Status: ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            'No se pudieron obtener las mascotas.'
        );
      }

      setMascotas(data.data || []);

      console.log(
        'Mascotas obtenidas:',
        (data.data || []).length
      );

      console.log('================================');
    } catch (error: any) {
      console.error('================================');
      console.error('ERROR AL CARGAR MASCOTAS');
      console.error('================================');
      console.error('Error completo:', error);
      console.error('Mensaje:', error?.message);

      setError(
        error?.message || 'No se pudieron cargar las mascotas.'
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarMascotas();
    }, [])
  );

  const obtenerImagen = (mascota: Mascota) => {
    if (mascota.foto) {
      return mascota.foto;
    }

    if (mascota.imagen) {
      return mascota.imagen;
    }

    if (mascota.especie?.toLowerCase() === 'gato') {
      return 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=300';
    }

    return 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300';
  };

  const formatearSexo = (sexo: string) => {
    if (!sexo) return '';

    const sexoNormalizado = sexo.toLowerCase();

    if (sexoNormalizado === 'macho') {
      return 'Macho';
    }

    if (sexoNormalizado === 'hembra') {
      return 'Hembra';
    }

    return sexo;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Mis Mascotas
          </Text>

          <Pressable
            style={styles.addButton}
            onPress={() => {
              console.log('ABRIENDO AGREGAR MASCOTA');
              router.push('/agregar-mascota');
            }}
            hitSlop={12}
          >
            <Ionicons
              name="add"
              size={30}
              color={colors.primary}
            />
          </Pressable>
        </View>

        {/* CONTENIDO */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >

          {/* CARGANDO */}
          {loading && (
            <View style={styles.centerContainer}>
              <ActivityIndicator
                size="large"
                color={colors.primary}
              />

              <Text style={styles.loadingText}>
                Cargando mascotas...
              </Text>
            </View>
          )}

          {/* ERROR */}
          {!loading && error !== '' && (
            <View style={styles.messageContainer}>

              <Ionicons
                name="alert-circle-outline"
                size={42}
                color="#EF4444"
              />

              <Text style={styles.messageTitle}>
                No se pudieron cargar las mascotas
              </Text>

              <Text style={styles.messageText}>
                {error}
              </Text>

              <Pressable
                style={styles.retryButton}
                onPress={cargarMascotas}
              >
                <Text style={styles.retryButtonText}>
                  Intentar nuevamente
                </Text>
              </Pressable>

            </View>
          )}

          {/* SIN MASCOTAS */}
          {!loading &&
            error === '' &&
            mascotas.length === 0 && (
              <View style={styles.messageContainer}>

                <Ionicons
                  name="paw-outline"
                  size={50}
                  color={colors.primary}
                />

                <Text style={styles.messageTitle}>
                  No tienes mascotas registradas
                </Text>

                <Text style={styles.messageText}>
                  Agrega tu primera mascota para comenzar.
                </Text>

                <Pressable
                  style={styles.retryButton}
                  onPress={() =>
                    router.push('/agregar-mascota')
                  }
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text style={styles.retryButtonText}>
                    Agregar mascota
                  </Text>
                </Pressable>

              </View>
            )}

          {/* LISTA DE MASCOTAS */}
          {!loading &&
            error === '' &&
            mascotas.map((mascota) => (
              <Pressable
                key={mascota.id}
                style={styles.petCard}
                onPress={() =>
                  router.push({
                    pathname: '/detalle-mascota',
                    params: {
                      id: mascota.id,
                      nombre: mascota.nombre,
                    },
                  })
                }
              >

                <View style={styles.petImageContainer}>
                  <Image
                    source={{
                      uri: obtenerImagen(mascota),
                    }}
                    style={styles.petImage}
                  />
                </View>

                <View style={styles.petInfo}>

                  <Text style={styles.petName}>
                    {mascota.nombre}
                  </Text>

                  <Text style={styles.petBreed}>
                    {mascota.raza || mascota.especie}
                  </Text>

                  <Text style={styles.petDetails}>
                    {mascota.edad} años •{' '}
                    {formatearSexo(mascota.sexo)} •{' '}
                    {mascota.peso} kg
                  </Text>

                </View>

                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color="#9CA3AF"
                />

              </Pressable>
            ))}

          {/* AGREGAR MASCOTA */}
          {!loading &&
            error === '' &&
            mascotas.length > 0 && (
              <Pressable
                style={styles.addPetButton}
                onPress={() =>
                  router.push('/agregar-mascota')
                }
              >
                <Ionicons
                  name="add"
                  size={23}
                  color={colors.primary}
                />

                <Text style={styles.addPetText}>
                  Agregar mascota
                </Text>
              </Pressable>
            )}

        </ScrollView>

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>

          {/* INICIO */}
          <Pressable
            style={styles.navItem}
            onPress={() => {
              console.log('ABRIENDO INICIO DESDE MASCOTAS');
              router.replace('/home');
            }}
            hitSlop={12}
          >
            <Ionicons
              name="home-outline"
              size={21}
              color="#9CA3AF"
            />

            <Text style={styles.navText}>
              Inicio
            </Text>
          </Pressable>

          {/* MASCOTAS */}
          <Pressable
            style={styles.navItem}
            hitSlop={12}
          >
            <Ionicons
              name="paw"
              size={21}
              color={colors.primary}
            />

            <Text style={styles.navTextActive}>
              Mascotas
            </Text>
          </Pressable>

          {/* CITAS */}
          <Pressable
            style={styles.navItem}
            onPress={() => {
              console.log('ABRIENDO CITAS DESDE MASCOTAS');
              router.push('/citas');
            }}
            hitSlop={12}
          >
            <Ionicons
              name="calendar-outline"
              size={21}
              color="#9CA3AF"
            />

            <Text style={styles.navText}>
              Citas
            </Text>
          </Pressable>

          {/* PERFIL */}
          <Pressable
            style={styles.navItem}
            onPress={() => {
              console.log('ABRIENDO PERFIL DESDE MASCOTAS');
              router.push('/explore');
            }}
            hitSlop={12}
          >
            <Ionicons
              name="person-outline"
              size={21}
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

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },

  screen: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 100,
  },

  /* HEADER */

  header: {
    height: 82,
    paddingHorizontal: 20,
    paddingTop: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#F5F6F8',
    zIndex: 10,
    elevation: 10,
  },

  title: {
    fontSize: 25,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 10,
  },

  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 6,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 1,
    },

    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  /* MASCOTA */

  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },

  petImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },

  petImage: {
    width: '100%',
    height: '100%',
  },

  petInfo: {
    flex: 1,
    marginLeft: 14,
  },

  petName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 3,
  },

  petBreed: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },

  petDetails: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  /* AGREGAR */

  addPetButton: {
    height: 54,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  addPetText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  /* CARGANDO */

  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
  },

  /* MENSAJES */

  messageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 30,
    marginTop: 10,
  },

  messageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 8,
  },

  messageText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
  },

  retryButton: {
    marginTop: 18,
    minHeight: 46,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },

  /* BOTTOM NAV */

  bottomNav: {
    height: 68,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  navText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },

  navTextActive: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },

});
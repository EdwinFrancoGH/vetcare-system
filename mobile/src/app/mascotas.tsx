import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

const colors = Colors.light;

export default function MascotasScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>

        {/* =========================================
            CONTENIDO PRINCIPAL
        ========================================= */}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >

          {/* =========================================
              HEADER
          ========================================= */}

          <View style={styles.header}>
            <Text style={styles.title}>Mis Mascotas</Text>

            {/* BOTÓN + SUPERIOR */}
            <Pressable
              style={styles.addButton}
              onPress={() => router.push('/agregar-mascota')}
            >
              <Ionicons
                name="add"
                size={25}
                color={colors.primary}
              />
            </Pressable>
          </View>


          {/* =========================================
              MASCOTA MAX
          ========================================= */}

          <Pressable
            style={styles.petCard}
            onPress={() =>
              router.push('/detalle-mascota?nombre=Max')
            }
          >

            <View style={styles.petImageContainer}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300',
                }}
                style={styles.petImage}
              />
            </View>

            <View style={styles.petInfo}>
              <Text style={styles.petName}>
                Max
              </Text>

              <Text style={styles.petBreed}>
                Golden Retriever
              </Text>

              <Text style={styles.petDetails}>
                5 años • Macho • 28 kg
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={24}
              color="#9CA3AF"
            />

          </Pressable>


          {/* =========================================
              MASCOTA LUNA
          ========================================= */}

          <Pressable
            style={styles.petCard}
            onPress={() =>
              router.push('/detalle-mascota?nombre=Luna')
            }
          >

            <View style={styles.petImageContainer}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=300',
                }}
                style={styles.petImage}
              />
            </View>

            <View style={styles.petInfo}>
              <Text style={styles.petName}>
                Luna
              </Text>

              <Text style={styles.petBreed}>
                Gato Persa
              </Text>

              <Text style={styles.petDetails}>
                3 años • Hembra • 4.5 kg
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={24}
              color="#9CA3AF"
            />

          </Pressable>


          {/* =========================================
              AGREGAR MASCOTA
          ========================================= */}

          <Pressable
            style={styles.addPetButton}
            onPress={() => router.push('/agregar-mascota')}
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

        </ScrollView>


        {/* =========================================
            BARRA INFERIOR
        ========================================= */}

        <View style={styles.bottomNav}>

          {/* =========================================
              INICIO
          ========================================= */}

          <Pressable
            style={styles.navItem}
            onPress={() => router.replace('/home')}
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


          {/* =========================================
              MASCOTAS
          ========================================= */}

          <Pressable
            style={styles.navItem}
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


          {/* =========================================
              CITAS
          ========================================= */}

          <Pressable
            style={styles.navItem}
            onPress={() => console.log('Citas')}
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


          {/* =========================================
              PERFIL
          ========================================= */}

          <Pressable
            style={styles.navItem}
            onPress={() => router.push('/explore')}
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


/* =====================================================
   ESTILOS
===================================================== */

const styles = StyleSheet.create({

  /* =========================================
     PANTALLA
  ========================================= */

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
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
  },


  /* =========================================
     HEADER
  ========================================= */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  title: {
    color: '#1F2937',
    fontSize: 25,
    fontWeight: '700',
  },

  addButton: {
    width: 38,
    height: 38,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },


  /* =========================================
     TARJETAS DE MASCOTAS
  ========================================= */

  petCard: {
    backgroundColor: '#FFFFFF',
    minHeight: 96,
    borderRadius: 17,
    marginBottom: 16,
    paddingHorizontal: 13,
    paddingVertical: 12,

    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  petImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginRight: 13,
  },

  petImage: {
    width: '100%',
    height: '100%',
  },

  petInfo: {
    flex: 1,
  },

  petName: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },

  petBreed: {
    color: '#4B5563',
    fontSize: 14,
    marginBottom: 5,
  },

  petDetails: {
    color: '#9CA3AF',
    fontSize: 12,
  },


  /* =========================================
     BOTÓN AGREGAR MASCOTA
  ========================================= */

  addPetButton: {
    height: 74,
    borderRadius: 17,

    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,

    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',

    marginTop: 1,
  },

  addPetText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
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
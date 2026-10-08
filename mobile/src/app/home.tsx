import React from 'react';

import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

const colors = Colors.light;

export default function HomeScreen() {
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

            <Text style={styles.greeting}>
              ¡Hola, Ana!
            </Text>

            <Text style={styles.welcomeText}>
              Bienvenida de vuelta a VetCare
            </Text>

          </View>


          {/* =========================================
              TARJETAS DE RESUMEN
          ========================================= */}

          <View style={styles.summaryContainer}>

            {/* Mascotas */}

            <Pressable
              style={styles.summaryCard}
              onPress={() => router.push('/mascotas')}
              hitSlop={8}
            >

              <View style={styles.summaryHeader}>

                <Text style={styles.summaryNumber}>
                  2
                </Text>

                <Ionicons
                  name="paw-outline"
                  size={18}
                  color={colors.primary}
                />

              </View>

              <Text style={styles.summaryLabel}>
                Mis mascotas
              </Text>

            </Pressable>


            {/* Próxima cita */}

            <Pressable
              style={styles.summaryCard}
              onPress={() => router.push('/citas')}
              hitSlop={8}
            >

              <View style={styles.summaryHeader}>

                <Text style={styles.summaryNumber}>
                  1
                </Text>

                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.primary}
                />

              </View>

              <Text style={styles.summaryLabel}>
                Próxima cita
              </Text>

            </Pressable>


            {/* Vacunas */}

            <Pressable
              style={styles.summaryCard}
              onPress={() => router.push('/mascotas')}
              hitSlop={8}
            >

              <View style={styles.summaryHeader}>

                <Text style={styles.summaryNumber}>
                  2
                </Text>

                <Ionicons
                  name="medkit-outline"
                  size={18}
                  color={colors.primary}
                />

              </View>

              <Text style={styles.summaryLabel}>
                Vacunas próx.
              </Text>

            </Pressable>

          </View>


          {/* =========================================
              PRÓXIMA CITA
          ========================================= */}

          <Text style={styles.sectionTitle}>
            Próxima cita
          </Text>


          <View style={styles.appointmentCard}>

            {/* Mascota */}

            <View style={styles.petHeader}>

              <View style={styles.petAvatar}>

                <Ionicons
                  name="paw"
                  size={26}
                  color={colors.primary}
                />

              </View>


              <View style={styles.petInfo}>

                <Text style={styles.petName}>
                  Max
                </Text>

                <Text style={styles.petService}>
                  Consulta general
                </Text>

              </View>

            </View>


            {/* Separador */}

            <View style={styles.divider} />


            {/* Fecha */}

            <View style={styles.appointmentInfoRow}>

              <Ionicons
                name="time-outline"
                size={17}
                color={colors.primary}
              />

              <Text style={styles.appointmentInfoText}>
                22 de Mayo, 2026 - 10:00 AM
              </Text>

            </View>


            {/* Veterinario */}

            <View style={styles.appointmentInfoRow}>

              <Ionicons
                name="person-outline"
                size={17}
                color={colors.primary}
              />

              <Text style={styles.appointmentInfoText}>
                Veterinario: Dr. Juan Pérez
              </Text>

            </View>


            {/* Botón */}

            <Pressable
              style={styles.detailsButton}
              onPress={() => router.push('/citas')}
              hitSlop={8}
            >

              <Text style={styles.detailsButtonText}>
                Ver detalles
              </Text>

            </Pressable>

          </View>


          {/* =========================================
              RECORDATORIOS
          ========================================= */}

          <Text style={styles.sectionTitle}>
            Recordatorios
          </Text>


          <Pressable
            style={styles.reminderCard}
            onPress={() => router.push('/mascotas')}
            hitSlop={8}
          >

            <View style={styles.reminderIcon}>

              <Ionicons
                name="medkit-outline"
                size={18}
                color={colors.primary}
              />

            </View>


            <View style={styles.reminderInfo}>

              <Text style={styles.reminderTitle}>
                Vacuna de la Rabia • Max
              </Text>

              <Text style={styles.reminderDate}>
                Vence el 25 de Mayo, 2026
              </Text>

            </View>


            <Ionicons
              name="chevron-forward"
              size={19}
              color="#6B7280"
            />

          </Pressable>


          <View style={styles.bottomSpace} />

        </ScrollView>


        {/* =========================================
            BARRA INFERIOR
        ========================================= */}

        <View style={styles.bottomNav}>

          {/* Inicio */}

          <Pressable
            style={styles.navItem}
            onPress={() => router.replace('/home')}
            hitSlop={12}
          >

            <Ionicons
              name="home"
              size={21}
              color={colors.primary}
            />

            <Text style={styles.navTextActive}>
              Inicio
            </Text>

          </Pressable>


          {/* Mascotas */}

          <Pressable
            style={styles.navItem}
            onPress={() => {
              console.log('ABRIENDO MASCOTAS DESDE HOME');
              router.push('/mascotas');
            }}
            hitSlop={12}
          >

            <Ionicons
              name="paw-outline"
              size={21}
              color="#9CA3AF"
            />

            <Text style={styles.navText}>
              Mascotas
            </Text>

          </Pressable>


          {/* Citas */}

          <Pressable
            style={styles.navItem}
            onPress={() => {
              console.log('ABRIENDO CITAS DESDE HOME');
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


          {/* Perfil */}

          <Pressable
            style={styles.navItem}
            onPress={() => {
              console.log('ABRIENDO PERFIL DESDE HOME');
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


/* =====================================================
   ESTILOS
===================================================== */

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
    paddingBottom: 10,
  },


  /* =========================================
     HEADER
  ========================================= */

  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingTop: 17,
    paddingBottom: 19,
  },

  greeting: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 3,
  },

  welcomeText: {
    color: '#E9D5FF',
    fontSize: 12.5,
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
    minHeight: 65,
    paddingHorizontal: 10,
    paddingVertical: 8,

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
    fontSize: 20,
    fontWeight: '700',
  },

  summaryLabel: {
    color: '#374151',
    fontSize: 10.5,
    fontWeight: '500',
  },


  /* =========================================
     TÍTULOS
  ========================================= */

  sectionTitle: {
    color: '#1F2937',
    fontSize: 15,
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
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  petInfo: {
    flex: 1,
  },

  petName: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },

  petService: {
    color: '#6B7280',
    fontSize: 11.5,
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
    fontSize: 11.5,
    marginLeft: 7,
  },

  detailsButton: {
    height: 27,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
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

  reminderIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  reminderInfo: {
    flex: 1,
  },

  reminderTitle: {
    color: '#374151',
    fontSize: 11.5,
    fontWeight: '500',
    marginBottom: 2,
  },

  reminderDate: {
    color: '#6B7280',
    fontSize: 9.5,
  },

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
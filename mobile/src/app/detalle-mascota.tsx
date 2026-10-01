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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

const colors = Colors.light;

export default function DetalleMascotaScreen() {
  const router = useRouter();
  const { nombre } = useLocalSearchParams();

  const esLuna = nombre === 'Luna';

  const mascota = {
    nombre: esLuna ? 'Luna' : 'Max',
    raza: esLuna ? 'Gato Persa' : 'Golden Retriever',
    edad: esLuna ? '3 años' : '5 años',
    especie: esLuna ? 'Gato' : 'Perro',
    nacimiento: esLuna ? '20/08/2022' : '12/03/2021',
    sexo: esLuna ? 'Hembra' : 'Macho',
    peso: esLuna ? '4.5 kg' : '28 kg',
    alergias: 'Ninguna conocida',
    enfermedades: 'Ninguna conocida',
  };

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
                {mascota.raza} • {mascota.edad}
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

            <Pressable style={styles.tab}>
              <Text style={styles.activeTabText}>
                Información
              </Text>

              <View style={styles.activeIndicator} />
            </Pressable>

            <Pressable
              style={styles.tab}
              onPress={() => console.log('Salud')}
            >
              <Text style={styles.tabText}>
                Salud
              </Text>
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

          <View style={styles.infoSection}>

            <InfoRow
              label="Especie"
              value={mascota.especie}
            />

            <InfoRow
              label="Raza"
              value={mascota.raza}
            />

            <InfoRow
              label="Fecha de nacimiento"
              value={mascota.nacimiento}
            />

            <InfoRow
              label="Sexo"
              value={mascota.sexo}
            />

            <InfoRow
              label="Peso"
              value={mascota.peso}
            />

            <InfoRow
              label="Alergias"
              value={mascota.alergias}
            />

            <InfoRow
              label="Enfermedades"
              value={mascota.enfermedades}
            />

          </View>

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
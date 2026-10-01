import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

const colors = Colors.light;

const especies = [
  'Perro',
  'Gato',
  'Ave',
  'Conejo',
  'Hámster',
  'Reptil',
  'Otro',
];

const estados = [
  'Activo',
  'Inactivo',
];

export default function AgregarMascotaScreen() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState('');
  const [mostrarEspecies, setMostrarEspecies] = useState(false);

  const [raza, setRaza] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo, setSexo] = useState('');

  const [edad, setEdad] = useState('');
  const [peso, setPeso] = useState('');
  const [color, setColor] = useState('');

  const [propietario, setPropietario] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  const [estado, setEstado] = useState('');
  const [mostrarEstados, setMostrarEstados] = useState(false);

  const handleGuardar = () => {
    if (!nombre.trim()) {
      Alert.alert(
        'Campo requerido',
        'Ingresa el nombre de la mascota.'
      );
      return;
    }

    if (!especie) {
      Alert.alert(
        'Campo requerido',
        'Selecciona la especie de la mascota.'
      );
      return;
    }

    if (!raza.trim()) {
      Alert.alert(
        'Campo requerido',
        'Ingresa la raza de la mascota.'
      );
      return;
    }

    if (!sexo) {
      Alert.alert(
        'Campo requerido',
        'Selecciona el sexo de la mascota.'
      );
      return;
    }

    if (!edad.trim()) {
      Alert.alert(
        'Campo requerido',
        'Ingresa la edad de la mascota.'
      );
      return;
    }

    if (Number(edad) < 0) {
      Alert.alert(
        'Edad inválida',
        'La edad debe ser mayor o igual a cero.'
      );
      return;
    }

    if (!peso.trim()) {
      Alert.alert(
        'Campo requerido',
        'Ingresa el peso de la mascota.'
      );
      return;
    }

    if (Number(peso) <= 0) {
      Alert.alert(
        'Peso inválido',
        'El peso debe ser mayor que cero.'
      );
      return;
    }

    if (!color.trim()) {
      Alert.alert(
        'Campo requerido',
        'Ingresa el color de la mascota.'
      );
      return;
    }

    if (!fechaNacimiento.trim()) {
      Alert.alert(
        'Campo requerido',
        'Ingresa la fecha de nacimiento.'
      );
      return;
    }

    if (!propietario.trim()) {
      Alert.alert(
        'Campo requerido',
        'Ingresa el nombre del propietario.'
      );
      return;
    }

    if (!telefono.trim()) {
      Alert.alert(
        'Campo requerido',
        'Ingresa el teléfono del propietario.'
      );
      return;
    }

    if (!direccion.trim()) {
      Alert.alert(
        'Campo requerido',
        'Ingresa la dirección.'
      );
      return;
    }

    if (!estado) {
      Alert.alert(
        'Campo requerido',
        'Selecciona el estado de la mascota.'
      );
      return;
    }

    Alert.alert(
      'Mascota lista',
      'Todos los datos fueron validados correctamente. La conexión con el backend se realizará en el siguiente paso.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>

        {/* =========================================
            HEADER
        ========================================= */}

        <View style={styles.header}>

          <Pressable
            style={styles.backButton}
            onPress={() => router.replace('/mascotas')}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#1F2937"
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Agregar mascota
          </Text>

          <View style={styles.headerSpace} />

        </View>


        {/* =========================================
            CONTENIDO
        ========================================= */}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* =========================================
              FOTO
          ========================================= */}

          <View style={styles.photoSection}>

            <Pressable
              style={styles.photoContainer}
              onPress={() =>
                Alert.alert(
                  'Foto',
                  'La selección de imagen se agregará posteriormente.'
                )
              }
            >
              <Ionicons
                name="camera-outline"
                size={32}
                color={colors.primary}
              />
            </Pressable>

            <Text style={styles.photoText}>
              Agregar foto
            </Text>

          </View>


          {/* =========================================
              NOMBRE
          ========================================= */}

          <View style={styles.fieldContainer}>

            <Text style={styles.label}>
              Nombre
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ej. Max"
              placeholderTextColor="#9CA3AF"
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
            />

          </View>


          {/* =========================================
              ESPECIE
          ========================================= */}

          <View style={styles.fieldContainer}>

            <Text style={styles.label}>
              Especie
            </Text>

            <Pressable
              style={styles.inputWithIcon}
              onPress={() =>
                setMostrarEspecies(!mostrarEspecies)
              }
            >

              <Text
                style={[
                  styles.selectText,
                  !especie && styles.placeholderText,
                ]}
              >
                {especie || 'Seleccionar especie'}
              </Text>

              <Ionicons
                name={
                  mostrarEspecies
                    ? 'chevron-up'
                    : 'chevron-down'
                }
                size={20}
                color="#9CA3AF"
              />

            </Pressable>


            {mostrarEspecies && (
              <View style={styles.optionsContainer}>

                {especies.map((item) => (
                  <Pressable
                    key={item}
                    style={styles.option}
                    onPress={() => {
                      setEspecie(item);
                      setMostrarEspecies(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        especie === item &&
                          styles.optionTextActive,
                      ]}
                    >
                      {item}
                    </Text>

                    {especie === item && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.primary}
                      />
                    )}

                  </Pressable>
                ))}

              </View>
            )}

          </View>


          {/* =========================================
              RAZA
          ========================================= */}

          <View style={styles.fieldContainer}>

            <Text style={styles.label}>
              Raza
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ej. Golden Retriever"
              placeholderTextColor="#9CA3AF"
              value={raza}
              onChangeText={setRaza}
              autoCapitalize="words"
            />

          </View>


          {/* =========================================
              FECHA DE NACIMIENTO
          ========================================= */}

          <View style={styles.fieldContainer}>

            <Text style={styles.label}>
              Fecha de nacimiento
            </Text>

            <View style={styles.inputWithIcon}>

              <TextInput
                style={styles.inputSelect}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#9CA3AF"
                value={fechaNacimiento}
                onChangeText={setFechaNacimiento}
                keyboardType="numeric"
              />

              <Ionicons
                name="calendar-outline"
                size={20}
                color="#9CA3AF"
              />

            </View>

          </View>


          {/* =========================================
              EDAD
          ========================================= */}

          <View style={styles.fieldContainer}>

            <Text style={styles.label}>
              Edad
            </Text>

            <View style={styles.inputWithUnit}>

              <TextInput
                style={styles.inputWeight}
                placeholder="Ej. 5"
                placeholderTextColor="#9CA3AF"
                value={edad}
                onChangeText={setEdad}
                keyboardType="numeric"
              />

              <Text style={styles.unitText}>
                años
              </Text>

            </View>

          </View>


          {/* =========================================
              SEXO
          ========================================= */}

          <View style={styles.fieldContainer}>

            <Text style={styles.label}>
              Sexo
            </Text>

            <View style={styles.sexContainer}>

              <Pressable
                style={[
                  styles.sexButton,
                  sexo === 'Macho' &&
                    styles.sexButtonActive,
                ]}
                onPress={() => setSexo('Macho')}
              >

                <Ionicons
                  name="male"
                  size={20}
                  color={
                    sexo === 'Macho'
                      ? colors.primary
                      : '#6B7280'
                  }
                />

                <Text
                  style={[
                    styles.sexText,
                    sexo === 'Macho' &&
                      styles.sexTextActive,
                  ]}
                >
                  Macho
                </Text>

              </Pressable>


              <Pressable
                style={[
                  styles.sexButton,
                  sexo === 'Hembra' &&
                    styles.sexButtonActive,
                ]}
                onPress={() => setSexo('Hembra')}
              >

                <Ionicons
                  name="female"
                  size={20}
                  color={
                    sexo === 'Hembra'
                      ? colors.primary
                      : '#6B7280'
                  }
                />

                <Text
                  style={[
                    styles.sexText,
                    sexo === 'Hembra' &&
                      styles.sexTextActive,
                  ]}
                >
                  Hembra
                </Text>

              </Pressable>

            </View>

          </View>


          {/* =========================================
              PESO
          ========================================= */}

          <View style={styles.fieldContainer}>

            <Text style={styles.label}>
              Peso
            </Text>

            <View style={styles.inputWithUnit}>

              <TextInput
                style={styles.inputWeight}
                placeholder="Ej. 28"
                placeholderTextColor="#9CA3AF"
                value={peso}
                onChangeText={setPeso}
                keyboardType="decimal-pad"
              />

              <Text style={styles.unitText}>
                kg
              </Text>

            </View>

          </View>


          {/* =========================================
              COLOR
          ========================================= */}

          <View style={styles.fieldContainer}>

            <Text style={styles.label}>
              Color
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ej. Dorado"
              placeholderTextColor="#9CA3AF"
              value={color}
              onChangeText={setColor}
              autoCapitalize="words"
            />

          </View>


          {/* =========================================
              PROPIETARIO
          ========================================= */}

          <View style={styles.fieldContainer}>

            <Text style={styles.label}>
              Propietario
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre del propietario"
              placeholderTextColor="#9CA3AF"
              value={propietario}
              onChangeText={setPropietario}
              autoCapitalize="words"
            />

          </View>


          {/* =========================================
              TELÉFONO
          ========================================= */}

          <View style={styles.fieldContainer}>

            <Text style={styles.label}>
              Teléfono
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ej. 7000-0000"
              placeholderTextColor="#9CA3AF"
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
            />

          </View>


          {/* =========================================
              DIRECCIÓN
          ========================================= */}

          <View style={styles.fieldContainer}>

            <Text style={styles.label}>
              Dirección
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.textArea,
              ]}
              placeholder="Dirección del propietario"
              placeholderTextColor="#9CA3AF"
              value={direccion}
              onChangeText={setDireccion}
              multiline
              textAlignVertical="top"
            />

          </View>


          {/* =========================================
              ESTADO
          ========================================= */}

          <View style={styles.fieldContainer}>

            <Text style={styles.label}>
              Estado
            </Text>

            <Pressable
              style={styles.inputWithIcon}
              onPress={() =>
                setMostrarEstados(!mostrarEstados)
              }
            >

              <Text
                style={[
                  styles.selectText,
                  !estado && styles.placeholderText,
                ]}
              >
                {estado || 'Seleccionar estado'}
              </Text>

              <Ionicons
                name={
                  mostrarEstados
                    ? 'chevron-up'
                    : 'chevron-down'
                }
                size={20}
                color="#9CA3AF"
              />

            </Pressable>


            {mostrarEstados && (
              <View style={styles.optionsContainer}>

                {estados.map((item) => (
                  <Pressable
                    key={item}
                    style={styles.option}
                    onPress={() => {
                      setEstado(item);
                      setMostrarEstados(false);
                    }}
                  >

                    <Text
                      style={[
                        styles.optionText,
                        estado === item &&
                          styles.optionTextActive,
                      ]}
                    >
                      {item}
                    </Text>

                    {estado === item && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.primary}
                      />
                    )}

                  </Pressable>
                ))}

              </View>
            )}

          </View>


          {/* =========================================
              GUARDAR
          ========================================= */}

          <Pressable
            style={styles.saveButton}
            onPress={handleGuardar}
          >

            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color="#FFFFFF"
            />

            <Text style={styles.saveButtonText}>
              Guardar mascota
            </Text>

          </Pressable>


          {/* =========================================
              CANCELAR
          ========================================= */}

          <Pressable
            style={styles.cancelButton}
            onPress={() => router.replace('/mascotas')}
          >

            <Text style={styles.cancelButtonText}>
              Cancelar
            </Text>

          </Pressable>

        </ScrollView>

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
    paddingHorizontal: 20,
    paddingBottom: 35,
  },


  /* =========================================
     HEADER
  ========================================= */

  header: {
    height: 64,
    paddingHorizontal: 18,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    backgroundColor: '#F5F6F8',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',

    elevation: 2,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  headerTitle: {
    color: '#1F2937',
    fontSize: 20,
    fontWeight: '700',
  },

  headerSpace: {
    width: 42,
  },


  /* =========================================
     FOTO
  ========================================= */

  photoSection: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 28,
  },

  photoContainer: {
    width: 105,
    height: 105,
    borderRadius: 53,

    backgroundColor: '#EDE9FE',

    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',

    alignItems: 'center',
    justifyContent: 'center',
  },

  photoText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },


  /* =========================================
     CAMPOS
  ========================================= */

  fieldContainer: {
    marginBottom: 19,
  },

  label: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  input: {
    height: 50,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E5E7EB',

    borderRadius: 12,

    paddingHorizontal: 15,

    color: '#1F2937',
    fontSize: 14,
  },

  inputWithIcon: {
    minHeight: 50,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E5E7EB',

    borderRadius: 12,

    paddingLeft: 15,
    paddingRight: 14,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  inputSelect: {
    flex: 1,

    color: '#1F2937',
    fontSize: 14,

    paddingVertical: 0,
  },

  selectText: {
    flex: 1,
    color: '#1F2937',
    fontSize: 14,
  },

  placeholderText: {
    color: '#9CA3AF',
  },


  /* =========================================
     OPCIONES
  ========================================= */

  optionsContainer: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E5E7EB',

    borderRadius: 12,

    marginTop: 6,

    overflow: 'hidden',

    elevation: 3,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  option: {
    minHeight: 48,

    paddingHorizontal: 15,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  optionText: {
    color: '#4B5563',
    fontSize: 14,
  },

  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },


  /* =========================================
     SEXO
  ========================================= */

  sexContainer: {
    flexDirection: 'row',
    gap: 12,
  },

  sexButton: {
    flex: 1,
    height: 50,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E5E7EB',

    borderRadius: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sexButtonActive: {
    backgroundColor: '#EDE9FE',
    borderColor: colors.primary,
  },

  sexText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 7,
  },

  sexTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },


  /* =========================================
     PESO / EDAD
  ========================================= */

  inputWithUnit: {
    height: 50,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E5E7EB',

    borderRadius: 12,

    paddingLeft: 15,
    paddingRight: 15,

    flexDirection: 'row',
    alignItems: 'center',
  },

  inputWeight: {
    flex: 1,

    color: '#1F2937',
    fontSize: 14,

    paddingVertical: 0,
  },

  unitText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },


  /* =========================================
     DIRECCIÓN
  ========================================= */

  textArea: {
    height: 85,
    paddingTop: 14,
    paddingBottom: 14,
  },


  /* =========================================
     GUARDAR
  ========================================= */

  saveButton: {
    height: 52,

    backgroundColor: colors.primary,

    borderRadius: 13,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 8,

    elevation: 2,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },


  /* =========================================
     CANCELAR
  ========================================= */

  cancelButton: {
    height: 48,

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 5,
  },

  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },

});
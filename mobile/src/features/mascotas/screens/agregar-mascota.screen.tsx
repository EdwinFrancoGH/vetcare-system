import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Colors } from '@/constants/theme';
import { VetCareBackground } from '@/components/vetcare-background';
import { API_URL } from '@/config/api';
import { auth } from '@/config/firebase';
import { crearMascota } from '@/features/mascotas/services/mascotas.service';

const colors = Colors.light;

const especies = [
  { nombre: 'Perro', icono: 'paw' as const },
  { nombre: 'Gato', icono: 'paw' as const },
  { nombre: 'Ave', icono: 'airplane' as const },
  { nombre: 'Conejo', icono: 'paw' as const },
  { nombre: 'Roedor', icono: 'ellipse' as const },
  { nombre: 'Reptil', icono: 'leaf' as const },
  { nombre: 'Pez', icono: 'fish' as const },
  { nombre: 'Otro', icono: 'paw' as const },
];

export default function AgregarMascotaScreen() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState('');
  const [especieOtroTexto, setEspecieOtroTexto] = useState('');

  const [raza, setRaza] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [mesCalendario, setMesCalendario] = useState(() => new Date());
  const [sexo, setSexo] = useState('');

  const [peso, setPeso] = useState('');
  const [color, setColor] = useState('');

  const [propietario, setPropietario] = useState(() => {
    const usuario = auth.currentUser;
    return usuario?.displayName?.trim() || usuario?.email?.split('@')[0] || '';
  });
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  const [estado] = useState('Activo');
  const [foto, setFoto] = useState('');
  const [seleccionandoFoto, setSeleccionandoFoto] = useState(false);

  const hoy = fechaHoyISO();
  const diasCalendario = useMemo(() => obtenerDiasCalendario(mesCalendario), [mesCalendario]);
  const especieOtroSeleccionada = especie === 'Otro' || !especies.some((item) => item.nombre === especie);

  useEffect(() => {
    let activa = true;
    const usuario = auth.currentUser;
    if (!usuario) return;

    const nombreFallback = usuario.displayName?.trim() || usuario.email?.split('@')[0] || '';
    const cargarNombrePerfil = async () => {
      try {
        const token = await usuario.getIdToken();
        const response = await fetch(`${API_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        const nombrePerfil = data?.user?.name?.trim();
        const direccionPerfil = (data?.user?.direccion || data?.user?.address || '').trim();
        if (activa && nombrePerfil) {
          setPropietario((actual) => actual === nombreFallback || !actual ? nombrePerfil : actual);
        }
        if (activa && direccionPerfil) setDireccion((actual) => actual || direccionPerfil);
      } catch {
        // Se conserva el nombre disponible en Firebase si el perfil no responde.
      }
    };

    void cargarNombrePerfil();
    return () => { activa = false; };
  }, []);

  const handleVolver = () => {
    console.log('REGRESANDO A MASCOTAS');
    router.replace('/mascotas');
  };

  const seleccionarEspecie = (valor: string) => {
    if (valor === 'Otro') {
      setEspecieOtroTexto('');
      setEspecie('Otro');
    } else {
      setEspecie(valor);
      setEspecieOtroTexto('');
    }
  };

  const cambiarEspeciePersonalizada = (valor: string) => {
    setEspecieOtroTexto(valor);
    setEspecie(valor.trim() || 'Otro');
  };

  const abrirCalendario = () => {
    const fechaSeleccionada = fechaNacimiento ? fechaDesdeISO(fechaNacimiento) : new Date();
    setMesCalendario(new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), 1));
    setMostrarCalendario(true);
  };

  const seleccionarFecha = (fechaISO: string) => {
    setFechaNacimiento(fechaISO);
    setMostrarCalendario(false);
  };

  const cambiarMesCalendario = (cambio: number) => {
    setMesCalendario((actual) => new Date(actual.getFullYear(), actual.getMonth() + cambio, 1));
  };

  const seleccionarFoto = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso requerido', 'Permite el acceso a tus fotos para elegir una imagen de tu mascota.');
        return;
      }

      const seleccion = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (seleccion.canceled || !seleccion.assets[0]) return;

      setSeleccionandoFoto(true);
      const imagen = await ImageManipulator.manipulateAsync(
        seleccion.assets[0].uri,
        [{ resize: { width: 320 } }],
        { compress: 0.78, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      if (!imagen.base64) throw new Error('No se pudo procesar la foto seleccionada.');

      const fotoComprimida = `data:image/jpeg;base64,${imagen.base64}`;
      if (fotoComprimida.length > 700_000) {
        throw new Error('La foto sigue siendo muy pesada. Selecciona otra imagen.');
      }
      setFoto(fotoComprimida);
    } catch (error: any) {
      Alert.alert('No se pudo seleccionar la foto', error?.message || 'Inténtalo de nuevo.');
    } finally {
      setSeleccionandoFoto(false);
    }
  };

  const handleGuardar = async () => {
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

    if (!fechaNacimiento.trim()) {
      Alert.alert(
        'Campo requerido',
        'Selecciona la fecha de nacimiento de la mascota.'
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

    if (!/^((\+?503[\s-]?)?[2-7]\d{3}[\s-]?\d{4})$/.test(telefono.trim())) {
      Alert.alert('Teléfono inválido', 'Ingresa un número salvadoreño de 8 dígitos, por ejemplo 7123-4567.');
      return;
    }

    if (!direccion.trim()) {
      Alert.alert(
        'Campo requerido',
        'Ingresa la dirección.'
      );
      return;
    }

    try {
      console.log('================================');
      console.log('GUARDANDO MASCOTA');
      console.log('================================');

      const user = auth.currentUser;

      if (!user) {
        Alert.alert(
          'Sesión requerida',
          'No hay una sesión activa. Inicia sesión nuevamente.'
        );
        return;
      }

      console.log('Usuario:', user.email);
      console.log('UID:', user.uid);

      const token = await user.getIdToken();

      console.log('Enviando mascota al backend...');

      const mascota = {
        nombre: nombre.trim(),
        especie,
        raza: raza.trim(),
        sexo,
        edad: calcularEdadAnios(fechaNacimiento, hoy),
        peso: Number(peso),
        color: color.trim(),
        fechaNacimiento: fechaNacimiento.trim(),
        propietario: propietario.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        estado,
        ...(foto ? { fotoURL: foto } : {}),
      };

      console.log('Datos enviados:', mascota);

      const response = await crearMascota({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(mascota),
      });

      console.log(
        'Backend respondió con status:',
        response.status
      );

      const responseText = await response.text();

      console.log(
        'Respuesta del backend:',
        responseText
      );

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
          'No se pudo registrar la mascota.'
        );
      }

      console.log('================================');
      console.log('MASCOTA CREADA CORRECTAMENTE');
      console.log('================================');

      Alert.alert(
        'Mascota registrada',
        'La mascota fue guardada correctamente.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/mascotas'),
          },
        ]
      );

    } catch (error: any) {
      console.error('================================');
      console.error('ERROR AL GUARDAR MASCOTA');
      console.error('================================');
      console.error('Error completo:', error);
      console.error('Mensaje:', error?.message);

      Alert.alert(
        'Error',
        error?.message ||
          'No se pudo guardar la mascota. Intenta nuevamente.'
      );
    }
  };

  return (
    <VetCareBackground>
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>

        {/* HEADER */}
        <View style={styles.header}>

          <Pressable
            style={styles.backButton}
            onPress={handleVolver}
            hitSlop={12}
          >
            <Ionicons
              name="arrow-back"
              size={28}
              color="#1F2937"
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Agregar mascota
          </Text>

          <View style={styles.headerSpace} />

        </View>

        {/* CONTENIDO */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* FOTO */}
          <View style={styles.photoSection}>

            <Pressable style={styles.photoContainer} onPress={seleccionarFoto} disabled={seleccionandoFoto} accessibilityLabel="Seleccionar foto de mascota">
              {seleccionandoFoto ? (
                <ActivityIndicator color={colors.primary} />
              ) : foto ? (
                <Image source={{ uri: foto }} style={styles.petPhoto} />
              ) : (
                <Ionicons name="camera-outline" size={32} color={colors.primary} />
              )}
              {!seleccionandoFoto ? (
                <View style={styles.photoCameraBadge}>
                  <Ionicons name="camera" size={15} color="#FFFFFF" />
                </View>
              ) : null}
            </Pressable>

            <Text style={styles.photoText}>
              {foto ? 'Cambiar foto' : 'Agregar foto'}
            </Text>

          </View>

          {/* NOMBRE */}
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

          {/* ESPECIE */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Especie <Text style={styles.required}>*</Text></Text>
            <View style={styles.speciesGrid}>
              {especies.map((item) => {
                const seleccionada = item.nombre === 'Otro'
                  ? especieOtroSeleccionada
                  : especie === item.nombre;
                return (
                  <Pressable
                    key={item.nombre}
                    style={[styles.speciesButton, seleccionada && styles.speciesButtonActive]}
                    onPress={() => seleccionarEspecie(item.nombre)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: seleccionada }}
                  >
                    <Ionicons name={item.icono} size={21} color={seleccionada ? colors.primary : '#4B5563'} />
                    <Text style={[styles.speciesText, seleccionada && styles.speciesTextActive]}>{item.nombre}</Text>
                  </Pressable>
                );
              })}
            </View>
            {especieOtroSeleccionada ? (
              <View style={styles.otherSpeciesContainer}>
                <Text style={styles.optionalLabel}>Especifica la especie (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Hurón, Erizo, Caballo"
                  placeholderTextColor="#9CA3AF"
                  value={especieOtroTexto}
                  onChangeText={cambiarEspeciePersonalizada}
                  autoCapitalize="words"
                />
              </View>
            ) : null}
          </View>

          {/* RAZA */}
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

          {/* FECHA DE NACIMIENTO */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Fecha de nacimiento <Text style={styles.required}>*</Text>
            </Text>

            <Pressable style={styles.inputWithIcon} onPress={abrirCalendario} accessibilityRole="button" accessibilityLabel="Elegir fecha de nacimiento">
              <Text style={[styles.selectText, !fechaNacimiento && styles.placeholderText]}>
                {fechaNacimiento ? formatearFecha(fechaNacimiento) : 'Seleccionar fecha'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </Pressable>
            {fechaNacimiento ? <Text style={styles.ageHint}>Edad aproximada: {etiquetaEdad(fechaNacimiento, hoy)}</Text> : null}
          </View>

          {/* SEXO */}
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

          {/* PESO */}
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

          {/* COLOR */}
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

          {/* PROPIETARIO */}
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

          {/* TELÉFONO */}
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

          {/* DIRECCIÓN */}
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

          {/* GUARDAR */}
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

          {/* CANCELAR */}
          <Pressable
            style={styles.cancelButton}
            onPress={handleVolver}
          >
            <Text style={styles.cancelButtonText}>
              Cancelar
            </Text>
          </Pressable>

        </ScrollView>

        <View style={styles.bottomNav}>
          <NavItem icon="home-outline" label="Inicio" onPress={() => router.replace('/home')} />
          <NavItem icon="paw" label="Mascotas" active onPress={() => router.replace('/mascotas')} />
          <NavItem icon="calendar-outline" label="Citas" onPress={() => router.push('/citas')} />
          <NavItem icon="bag-handle-outline" label="Tienda" onPress={() => router.push('/tienda')} />
        </View>

      </View>
    </SafeAreaView>
    <Modal visible={mostrarCalendario} transparent animationType="fade" onRequestClose={() => setMostrarCalendario(false)}>
      <View style={styles.calendarOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setMostrarCalendario(false)} accessibilityLabel="Cerrar calendario" />
        <View style={styles.calendarCard}>
          <View style={styles.calendarTitleRow}>
            <View>
              <Text style={styles.calendarEyebrow}>SALUD</Text>
              <Text style={styles.calendarTitle}>Fecha de nacimiento</Text>
            </View>
            <Pressable style={styles.calendarClose} onPress={() => setMostrarCalendario(false)} accessibilityLabel="Cerrar calendario">
              <Ionicons name="close" size={21} color="#4B5563" />
            </Pressable>
          </View>

          <View style={styles.calendarMonthRow}>
            <Pressable style={styles.calendarArrow} onPress={() => cambiarMesCalendario(-1)} accessibilityLabel="Mes anterior">
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </Pressable>
            <Text style={styles.calendarMonth}>
              {capitalizar(mesCalendario.toLocaleDateString('es-SV', { month: 'long', year: 'numeric' }))}
            </Text>
            <Pressable style={styles.calendarArrow} onPress={() => cambiarMesCalendario(1)} disabled={mesCalendario.getFullYear() === fechaDesdeISO(hoy).getFullYear() && mesCalendario.getMonth() >= fechaDesdeISO(hoy).getMonth()} accessibilityLabel="Mes siguiente">
              <Ionicons name="chevron-forward" size={20} color={mesCalendario.getFullYear() === fechaDesdeISO(hoy).getFullYear() && mesCalendario.getMonth() >= fechaDesdeISO(hoy).getMonth() ? '#CBD5E1' : colors.primary} />
            </Pressable>
          </View>

          <View style={styles.calendarGrid}>
            {['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'].map((dia, index) => (
              <Text key={`${dia}-${index}`} style={styles.calendarWeekday}>{dia}</Text>
            ))}
            {diasCalendario.map((dia) => {
              const fechaISO = fechaDateToISO(dia);
              const fueraDelMes = dia.getMonth() !== mesCalendario.getMonth();
              const seleccionado = fechaISO === fechaNacimiento;
              const deshabilitado = fueraDelMes || fechaISO > hoy;
              return (
                <Pressable
                  key={fechaISO}
                  style={[styles.calendarDay, fueraDelMes && styles.calendarDayOutside, seleccionado && styles.calendarDaySelected, deshabilitado && styles.calendarDayDisabled]}
                  onPress={() => seleccionarFecha(fechaISO)}
                  disabled={deshabilitado}
                  accessibilityLabel={dia.toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' })}
                  accessibilityState={{ selected: seleccionado, disabled: deshabilitado }}
                >
                  <Text style={[styles.calendarDayText, fueraDelMes && styles.calendarDayOutsideText, seleccionado && styles.calendarDaySelectedText, deshabilitado && styles.calendarDayDisabledText]}>{dia.getDate()}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.calendarHint}>No se pueden seleccionar fechas futuras.</Text>
          <Pressable style={styles.calendarTodayButton} onPress={() => seleccionarFecha(hoy)}>
            <Text style={styles.calendarTodayText}>Usar hoy</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
    </VetCareBackground>
  );
}

function NavItem({ icon, label, active = false, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.navItem} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={icon} size={21} color={active ? colors.primary : '#9CA3AF'} />
      <Text style={active ? styles.navTextActive : styles.navText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  /* HEADER */

  header: {
    height: 100,
    paddingHorizontal: 18,
    paddingTop: 28,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(248, 250, 252, 0.68)',
    zIndex: 10,
    elevation: 10,
  },

  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 6,

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
    marginTop: 13,
  },

  headerSpace: {
    width: 50,
    height: 50,
  },

  /* FOTO */

  photoSection: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 28,
  },

  photoContainer: {
    width: 105,
    height: 105,
    borderRadius: 53,
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },

  petPhoto: {
    width: '100%',
    height: '100%',
  },

  photoCameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },

  /* CAMPOS */

  fieldContainer: {
    marginBottom: 19,
  },

  label: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  required: { color: colors.error },
  optionalLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: 7 },
  speciesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  speciesButton: {
    width: '48%', minHeight: 62, backgroundColor: '#FFFFFF', borderWidth: 1,
    borderColor: colors.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  speciesButtonActive: { backgroundColor: colors.backgroundSelected, borderColor: colors.primary },
  speciesText: { color: '#374151', fontSize: 13, fontWeight: '600' },
  speciesTextActive: { color: colors.primary },
  otherSpeciesContainer: { marginTop: 12 },
  ageHint: { color: colors.primary, fontSize: 13, fontWeight: '600', marginTop: 7 },

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

  /* OPCIONES */

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

  /* SEXO */

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
    backgroundColor: '#DBEAFE',
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

  /* PESO / EDAD */

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

  /* DIRECCIÓN */

  textArea: {
    height: 85,
    paddingTop: 14,
    paddingBottom: 14,
  },

  /* GUARDAR */

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

  /* CANCELAR */

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

  bottomNav: {
    height: 68, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 4,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  navText: { color: '#6B7280', fontSize: 11 },
  navTextActive: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  calendarOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.48)', justifyContent: 'center', alignItems: 'center', padding: 18 },
  calendarCard: { width: '100%', maxWidth: 420, borderRadius: 20, backgroundColor: '#FFFFFF', padding: 18, elevation: 12 },
  calendarTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  calendarEyebrow: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  calendarTitle: { color: '#1F2937', fontSize: 19, fontWeight: '700', marginTop: 3 },
  calendarClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  calendarMonthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  calendarArrow: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  calendarMonth: { color: '#1F2937', fontSize: 16, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarWeekday: { width: '14.2857%', height: 34, textAlign: 'center', textAlignVertical: 'center', color: '#6B7280', fontSize: 11, fontWeight: '700' },
  calendarDay: { width: '14.2857%', height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21 },
  calendarDayOutside: { opacity: 0 },
  calendarDaySelected: { backgroundColor: colors.primary },
  calendarDayDisabled: { opacity: 0.35 },
  calendarDayText: { color: '#1F2937', fontSize: 14, fontWeight: '500' },
  calendarDayOutsideText: { color: '#9CA3AF' },
  calendarDaySelectedText: { color: '#FFFFFF', fontWeight: '700' },
  calendarDayDisabledText: { color: '#9CA3AF' },
  calendarHint: { color: '#6B7280', fontSize: 12, marginTop: 10, textAlign: 'center' },
  calendarTodayButton: { height: 44, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  calendarTodayText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});

function fechaHoyISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/El_Salvador' }).format(new Date());
}

function fechaDesdeISO(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function fechaDateToISO(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function obtenerDiasCalendario(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset + index));
}

function calcularEdadAnios(nacimiento: string, hoy: string) {
  const birth = fechaDesdeISO(nacimiento);
  const today = fechaDesdeISO(hoy);
  let years = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) years -= 1;
  return Math.max(0, years);
}

function etiquetaEdad(nacimiento: string, hoy: string) {
  const birth = fechaDesdeISO(nacimiento);
  const today = fechaDesdeISO(hoy);
  const years = calcularEdadAnios(nacimiento, hoy);
  if (years >= 1) return `${years} ${years === 1 ? 'año' : 'años'}`;
  let months = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) months -= 1;
  months = Math.max(0, months);
  return `${months} ${months === 1 ? 'mes' : 'meses'}`;
}

function formatearFecha(iso: string) {
  return fechaDesdeISO(iso).toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function capitalizar(value: string) {
  return value.charAt(0).toLocaleUpperCase('es-SV') + value.slice(1);
}


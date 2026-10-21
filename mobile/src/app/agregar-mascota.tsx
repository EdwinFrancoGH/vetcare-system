import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Modal,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { auth } from '@/config/firebase';
import { API_URL } from '@/config/api';
import { cleanupPickedImage, useGalleryImage, type PickedImage } from '@/hooks/use-gallery-image';
import { uploadUserImage } from '@/services/image-storage';
import { PetImage } from '@/components/pet-image';
import { calculatePetAge, formatPetDate, localDateString, parsePetDate } from '@/utils/pet-date';

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
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const mascotaId = Array.isArray(rawId) ? rawId[0] : rawId;
  const editando = Boolean(mascotaId);

  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState('');
  const [mostrarEspecies, setMostrarEspecies] = useState(false);

  const [raza, setRaza] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo, setSexo] = useState('');

  const [peso, setPeso] = useState('');
  const [color, setColor] = useState('');

  const [propietario, setPropietario] = useState(auth.currentUser?.displayName || '');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  const [estado, setEstado] = useState('');
  const [mostrarEstados, setMostrarEstados] = useState(false);
  const [cargando, setCargando] = useState(editando);
  const [guardando, setGuardando] = useState(false);
  const [fotoGuardada, setFotoGuardada] = useState('');
  const [quitarFoto, setQuitarFoto] = useState(false);
  const [fotoSeleccionada, setFotoSeleccionada] = useState<PickedImage | null>(null);
  const [mostrarSelectorFecha, setMostrarSelectorFecha] = useState(false);
  const [fechaSelector, setFechaSelector] = useState(new Date());
  const fotoSeleccionadaRef = useRef<PickedImage | null>(null);
  const { pickImage, pickingImage } = useGalleryImage();
  const edadCalculada = calculatePetAge(fechaNacimiento);
  const edad = edadCalculada === null ? '' : String(edadCalculada);

  useEffect(() => { fotoSeleccionadaRef.current = fotoSeleccionada; }, [fotoSeleccionada]);
  useEffect(() => () => { void cleanupPickedImage(fotoSeleccionadaRef.current); }, []);

  useEffect(() => {
    if (!mascotaId) return;
    let activo = true;
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Inicia sesión para editar esta mascota.');
        const token = await user.getIdToken();
        const response = await fetch(`${API_URL}/api/mascotas/${encodeURIComponent(mascotaId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'No se pudo cargar la mascota.');
        const pet = data.data || data.mascota;
        if (!pet) throw new Error('No se encontraron los datos de la mascota.');
        if (!activo) return;
        setNombre(pet.nombre || ''); setEspecie(pet.especie || ''); setRaza(pet.raza || '');
        const birthDate = parsePetDate(String(pet.fechaNacimiento || ''));
        setFechaNacimiento(birthDate ? localDateString(birthDate) : ''); setSexo(pet.sexo || '');
        setPeso(pet.peso === undefined || pet.peso === null ? '' : String(pet.peso));
        setColor(pet.color || ''); setPropietario(user.displayName || pet.propietario || '');
        setFotoGuardada(pet.foto || pet.imagen || '');
        setQuitarFoto(false);
        setTelefono(pet.telefono || ''); setDireccion(pet.direccion || ''); setEstado(pet.estado || '');
      } catch (error: any) {
        Alert.alert('No se pudo cargar', error?.message || 'Intenta nuevamente.', [
          { text: 'Volver', onPress: () => router.replace('/mascotas') },
        ]);
      } finally { if (activo) setCargando(false); }
    })();
    return () => { activo = false; };
  }, [mascotaId, router]);

  const handleVolver = () => {
    router.replace('/mascotas');
  };

  const seleccionarFoto = async () => {
    const image = await pickImage();
    if (image) {
      setQuitarFoto(false);
      const previous = fotoSeleccionada;
      setFotoSeleccionada(image);
      void cleanupPickedImage(previous);
    }
  };

  const quitarFotografia = () => {
    if (fotoSeleccionada) {
      const selected = fotoSeleccionada;
      setFotoSeleccionada(null);
      void cleanupPickedImage(selected);
      return;
    }
    if (quitarFoto) { setQuitarFoto(false); return; }
    if (!fotoGuardada) return;
    Alert.alert('Quitar fotografía', 'Al guardar, se quitará la fotografía personalizada y se mostrará la imagen de la especie.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => setQuitarFoto(true) },
    ]);
  };

  const cambiarFechaNacimiento = (date: Date) => {
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (localDate > today) return;
    setFechaNacimiento(localDateString(localDate));
    setFechaSelector(localDate);
  };

  const abrirSelectorFecha = () => {
    setFechaSelector(parsePetDate(fechaNacimiento) || new Date());
    setMostrarSelectorFecha(true);
  };

  const handleGuardar = async () => {
    if (guardando) return;
    if (!/^[\p{L}]+(?:[ '\u2019-][\p{L}]+)*$/u.test(nombre.trim())) {
      Alert.alert(
        'Campo requerido',
        'Ingresa un nombre con al menos una letra.'
      );
      return;
    }

    if (!especies.includes(especie)) {
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

    if (!/^\d+(?:[.,]\d+)?$/.test(edad.trim()) || !Number.isFinite(Number(edad.replace(',', '.'))) || Number(edad.replace(',', '.')) < 0) {
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

    if (!/^\d+(?:[.,]\d+)?$/.test(peso.trim()) || !Number.isFinite(Number(peso.replace(',', '.'))) || Number(peso.replace(',', '.')) <= 0) {
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

    if (!/[\p{L}]/u.test(color)) {
      Alert.alert('Color inválido', 'El color debe incluir letras.');
      return;
    }

    if (!fechaNacimiento.trim()) {
      Alert.alert(
        'Campo requerido',
        'Ingresa la fecha de nacimiento.'
      );
      return;
    }

    const fechaValida = (valor: string) => {
      const m = valor.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/) || valor.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!m) return false;
      const yyyy = m[1].length === 4 ? Number(m[1]) : Number(m[3]);
      const mm = Number(m[2]);
      const dd = m[1].length === 4 ? Number(m[3]) : Number(m[1]);
      const d = new Date(yyyy, mm - 1, dd);
      const hoy = new Date(); hoy.setHours(23, 59, 59, 999);
      return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd && d <= hoy;
    };
    if (!fechaValida(fechaNacimiento)) {
      Alert.alert('Fecha inválida', 'Usa DD/MM/AAAA o AAAA-MM-DD y una fecha que no sea futura.');
      return;
    }

    if (!propietario.trim()) {
      Alert.alert(
        'Perfil incompleto',
        'Completa tu nombre desde Perfil antes de registrar la mascota.'
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

    const digitosTelefono = telefono.replace(/\D/g, '');
    if (!/^\+?[0-9\s().-]+$/.test(telefono.trim()) || digitosTelefono.length < 7 || digitosTelefono.length > 15) {
      Alert.alert('Teléfono inválido', 'Ingresa entre 7 y 15 dígitos, con prefijo internacional opcional.');
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

    let mascotaCreada = false;
    try {
      setGuardando(true);

      const user = auth.currentUser;

      if (!user) {
        Alert.alert(
          'Sesión requerida',
          'No hay una sesión activa. Inicia sesión nuevamente.'
        );
        return;
      }

      if (!propietario.trim()) {
        Alert.alert('Perfil incompleto', 'Completa el nombre de tu perfil antes de registrar una mascota.');
        return;
      }

      const token = await user.getIdToken();

      const url = editando
        ? `${API_URL}/api/mascotas/${encodeURIComponent(mascotaId!)}`
        : `${API_URL}/api/mascotas`;

      const mascota: Record<string, unknown> = {
        nombre: nombre.trim(),
        especie,
        raza: raza.trim(),
        sexo,
        edad: edadCalculada,
        peso: Number(peso.replace(',', '.')),
        color: color.trim(),
        fechaNacimiento: localDateString(parsePetDate(fechaNacimiento)!),
        propietario: propietario.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        estado,
      };

      if (!fotoSeleccionada && fotoGuardada) mascota.foto = fotoGuardada;
      if (quitarFoto) { mascota.foto = ''; mascota.imagen = ''; }

      const guardarEnBackend = async (endpoint: string, method: 'POST' | 'PUT', payload: Record<string, unknown>) => {
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || data.error || 'No se pudo guardar la mascota.');
        return data;
      };

      let idMascota = mascotaId;
      if (editando) {
        if (fotoSeleccionada) {
          const { url: foto } = await uploadUserImage(
            fotoSeleccionada,
            `users/${user.uid}/pets/${encodeURIComponent(mascotaId!)}`
          );
          await guardarEnBackend(url, 'PUT', { ...mascota, foto });
        } else {
          await guardarEnBackend(url, 'PUT', mascota);
        }
      } else {
        const data = await guardarEnBackend(url, 'POST', mascota);
        const createdPet = data.data || data.mascota || data;
        idMascota = String(createdPet.id ?? createdPet._id ?? createdPet.mascotaId ?? '');
        mascotaCreada = true;
        if (fotoSeleccionada) {
          if (!idMascota) throw new Error('La mascota se creó, pero el servidor no devolvió su identificador para guardar la foto.');
          const { url: foto } = await uploadUserImage(
            fotoSeleccionada,
            `users/${user.uid}/pets/${encodeURIComponent(idMascota)}`
          );
          await guardarEnBackend(`${API_URL}/api/mascotas/${encodeURIComponent(idMascota)}`, 'PUT', { ...mascota, foto });
        }
      }

      const selectedImage = fotoSeleccionada;
      setFotoSeleccionada(null);
      await cleanupPickedImage(selectedImage);

      Alert.alert(
        editando ? 'Cambios guardados' : 'Mascota registrada',
        editando ? 'La información se actualizó correctamente.' : 'La mascota fue guardada correctamente.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/mascotas'),
          },
        ]
      );

    } catch (error: any) {
      console.error('Error guardando mascota:', error);
      if (quitarFoto) setQuitarFoto(false);

      Alert.alert(
        mascotaCreada ? 'Mascota registrada sin fotografía' : 'Error al guardar',
        mascotaCreada
          ? `La ficha quedó guardada, pero la foto no se pudo completar: ${error?.message || 'Error de Storage o permisos.'} Puedes editarla e intentarlo nuevamente.`
          : error?.message || 'No se pudo guardar la mascota. Intenta nuevamente.',
        mascotaCreada ? [{ text: 'Ver mascotas', onPress: () => router.replace('/mascotas') }] : undefined
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
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
            {editando ? 'Editar mascota' : 'Agregar mascota'}
          </Text>

          <View style={styles.headerSpace} />

        </View>

        {/* CONTENIDO */}
        {cargando ? <Text style={{ textAlign: 'center', padding: 24 }}>Cargando mascota...</Text> : <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* FOTO */}
          <View style={styles.photoSection}>

            <Pressable
              style={styles.photoContainer}
              onPress={seleccionarFoto}
              disabled={pickingImage || guardando}
              accessibilityRole="button"
              accessibilityLabel={fotoSeleccionada || fotoGuardada ? 'Cambiar fotografía de mascota' : 'Elegir fotografía de mascota'}
            >
              <PetImage species={especie} photoUri={fotoSeleccionada?.uri || (quitarFoto ? '' : fotoGuardada)} style={styles.photoPreview} />
              <View style={styles.photoCameraBadge}><Ionicons name="camera" size={17} color="#fff" /></View>
            </Pressable>

            {(fotoSeleccionada || fotoGuardada) ? <Pressable onPress={quitarFotografia} disabled={guardando} style={styles.removePhoto}><Text style={styles.removePhotoText}>{fotoSeleccionada ? 'Cancelar selección de foto' : quitarFoto ? 'Restaurar fotografía' : 'Quitar fotografía'}</Text></Pressable> : null}

            <Text style={styles.photoText}>
              {pickingImage ? 'Abriendo galería...' : fotoSeleccionada || fotoGuardada ? 'Cambiar foto' : 'Seleccionar foto'}
            </Text>
            {fotoSeleccionada ? <Text style={styles.photoNotice}>La fotografía se subirá a Storage y se vinculará al guardar la ficha.</Text> : null}

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
              Fecha de nacimiento
            </Text>

            {Platform.OS === 'web' ? <TextInput style={styles.input} placeholder="AAAA-MM-DD" placeholderTextColor="#9CA3AF" value={fechaNacimiento} onChangeText={setFechaNacimiento} keyboardType="numeric" /> : <Pressable style={styles.inputWithIcon} onPress={abrirSelectorFecha} accessibilityRole="button" accessibilityLabel="Seleccionar fecha de nacimiento"><Text style={[styles.inputSelect, !fechaNacimiento && styles.placeholderDate]}>{fechaNacimiento ? formatPetDate(fechaNacimiento) : 'Seleccionar fecha'}</Text><Ionicons name="calendar-outline" size={20} color="#9CA3AF" /></Pressable>}
            {mostrarSelectorFecha && Platform.OS === 'android' && <DateTimePicker value={fechaSelector} mode="date" maximumDate={new Date()} presentation="dialog" positiveButton={{ label: 'Elegir' }} negativeButton={{ label: 'Cancelar' }} onValueChange={(_event, date) => { cambiarFechaNacimiento(date); setMostrarSelectorFecha(false); }} onDismiss={() => setMostrarSelectorFecha(false)} />}
            <Modal transparent animationType="fade" visible={mostrarSelectorFecha && Platform.OS === 'ios'} onRequestClose={() => setMostrarSelectorFecha(false)}>
              <View style={styles.dateModalOverlay}><View style={styles.dateModalCard}><Text style={styles.dateModalTitle}>Fecha de nacimiento</Text><DateTimePicker value={fechaSelector} mode="date" maximumDate={new Date()} display="inline" locale="es_ES" accentColor={colors.primary} onValueChange={(_event, date) => setFechaSelector(new Date(date.getFullYear(), date.getMonth(), date.getDate()))} /><View style={styles.dateModalActions}><Pressable onPress={() => setMostrarSelectorFecha(false)} style={styles.dateAction}><Text style={styles.dateCancelText}>Cancelar</Text></Pressable><Pressable onPress={() => { cambiarFechaNacimiento(fechaSelector); setMostrarSelectorFecha(false); }} style={[styles.dateAction, styles.dateConfirm]}><Text style={styles.dateConfirmText}>Listo</Text></Pressable></View></View></View>
            </Modal>
          </View>

          {/* EDAD */}
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
                editable={false}
                accessibilityLabel="Edad calculada en años cumplidos"
                keyboardType="numeric"
              />

              <Text style={styles.unitText}>
                años
              </Text>
            </View>
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
              placeholder={auth.currentUser?.displayName ? 'Nombre del propietario' : 'Completa tu nombre en el perfil'}
              placeholderTextColor="#9CA3AF"
              value={propietario}
              editable={false}
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

          {/* ESTADO */}
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

          {/* GUARDAR */}
          <Pressable
            style={styles.saveButton}
            onPress={() => { void handleGuardar(); }}
            disabled={guardando || pickingImage}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color="#FFFFFF"
            />

            <Text style={styles.saveButtonText}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar mascota'}
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

        </ScrollView>}

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
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  /* HEADER */

  header: {
    height: 100,
    paddingHorizontal: 18,
    paddingTop: 28,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#F5F6F8',
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
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'solid',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreview: { width: '100%', height: '100%', borderRadius: 44 },
  photoCameraBadge: { position: 'absolute', right: -3, bottom: -2, width: 31, height: 31, borderRadius: 16, backgroundColor: colors.primary, borderColor: '#fff', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  photoText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  photoNotice: { color: '#92400E', backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10, marginTop: 8, maxWidth: 300, textAlign: 'center', lineHeight: 18 },
  removePhoto: { padding: 8, marginTop: 3 },
  removePhotoText: { color: '#B42332', fontSize: 13, fontWeight: '600' },

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
  placeholderDate: { color: '#9CA3AF' },
  dateModalOverlay: { flex: 1, backgroundColor: '#0006', justifyContent: 'center', padding: 20 },
  dateModalCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, alignItems: 'center' },
  dateModalTitle: { color: '#1F2937', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  dateModalActions: { width: '100%', flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  dateAction: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  dateConfirm: { backgroundColor: colors.primary },
  dateCancelText: { color: '#6B7280', fontWeight: '600' },
  dateConfirmText: { color: '#fff', fontWeight: '700' },

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
});

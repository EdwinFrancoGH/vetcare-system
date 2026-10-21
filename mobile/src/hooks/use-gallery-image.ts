import { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

export type PickedImage = ImagePicker.ImagePickerAsset;

export async function cleanupPickedImage(image: PickedImage | null) {
  if (!image?.uri.startsWith('file://')) return;
  try {
    await FileSystem.deleteAsync(image.uri, { idempotent: true });
  } catch (error) {
    // The OS may already have cleared its temporary picker cache.
    console.warn('No se pudo limpiar el archivo temporal de la fotografía:', error);
  }
}

export function useGalleryImage() {
  const [pickingImage, setPickingImage] = useState(false);

  const pickImage = useCallback(async (): Promise<PickedImage | null> => {
    if (pickingImage) return null;
    setPickingImage(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso necesario', 'Permite el acceso a tus fotos para elegir una imagen.', [
          { text: 'Ahora no', style: 'cancel' },
          ...(!permission.canAskAgain ? [{ text: 'Abrir configuración', onPress: () => Linking.openSettings() }] : []),
        ]);
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
        base64: true,
      });

      return result.canceled ? null : result.assets[0] || null;
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('No se pudo abrir la galería', 'Intenta nuevamente o revisa los permisos de fotos.');
      return null;
    } finally {
      setPickingImage(false);
    }
  }, [pickingImage]);

  return { pickImage, pickingImage };
}

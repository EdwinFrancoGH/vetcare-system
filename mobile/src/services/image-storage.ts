import { decode } from 'base-64';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import type { ImagePickerAsset } from 'expo-image-picker';
import { auth, storage } from '@/config/firebase';

if (typeof globalThis.atob === 'undefined') {
  Object.assign(globalThis, { atob: decode });
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function uploadUserImage(asset: ImagePickerAsset, objectPath: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Inicia sesión para subir una fotografía.');
  if (!storage.app.options.storageBucket) {
    throw new Error('Falta EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET en la configuración móvil.');
  }
  if (!asset.base64) throw new Error('No se pudo leer la imagen seleccionada. Elige otra foto.');

  const mimeType = 'image/jpeg'; // ImagePicker's Base64 output is JPEG on native platforms.
  if (asset.type && asset.type !== 'image') throw new Error('Selecciona un archivo de imagen.');
  if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
    throw new Error('La imagen supera el límite móvil de 5 MB. Elige una imagen más pequeña.');
  }

  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const path = `${objectPath}/${uniqueName}`;
  const imageRef = ref(storage, path);
  await uploadString(imageRef, asset.base64, 'base64', { contentType: mimeType });

  // Resolve only after Storage confirms the object and its download URL.
  return { url: await getDownloadURL(imageRef), path };
}

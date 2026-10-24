import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Override this in mobile/.env when using a physical device, for example:
// EXPO_PUBLIC_API_URL=http://192.168.1.135:5000
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

// Android emulator reaches the host through 10.0.2.2; iOS simulator and web use localhost.
/*export const API_URL = configuredApiUrl || (
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5000'
    : 'http://localhost:5000'
    : 'http://192.168.1.143:5000'
);*/

export const API_URL = configuredApiUrl || (
  Platform.OS === 'web'
    ? 'http://localhost:5000'
    : Platform.OS === 'android'
      ? Constants.isDevice
        ? 'http://192.168.1.143:5000' // Android físico
        : 'http://10.0.2.2:5000'      // Emulador Android
      : 'http://localhost:5000'       // Emulador Web
);

import { Platform } from 'react-native';

// Web/iOS simulator reach the host through localhost; Android emulator uses 10.0.2.2.
export const API_URL = Platform.OS === 'android'
  ? 'http://192.168.1.135:5000'
  : 'http://localhost:5000';

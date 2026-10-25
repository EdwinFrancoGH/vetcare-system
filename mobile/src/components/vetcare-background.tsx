import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

export function VetCareBackground({ children }: PropsWithChildren) {
  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/fondo-vetcare.jpg')} contentFit="cover" style={styles.image} />
      <View pointerEvents="none" style={styles.tint} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  image: { ...StyleSheet.absoluteFill },
  tint: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(248, 250, 252, 0.82)' },
});

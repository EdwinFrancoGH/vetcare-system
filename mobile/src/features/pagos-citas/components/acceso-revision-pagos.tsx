import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VetCareBackground } from '@/components/vetcare-background';
import { Colors } from '@/constants/theme';
import { API_URL } from '@/config/api';
import { auth } from '@/config/firebase';
import { apiFetch } from '@/lib/api-client';
import { esRolRevisorPagos } from '@/features/pagos-citas/utils/pagos-admin';

type Estado = 'cargando' | 'permitido' | 'denegado' | 'error';

export function AccesoRevisionPagos({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('cargando');
  const [reintento, setReintento] = useState(0);

  useEffect(() => {
    let activo = true;
    let revision = 0;
    const unsubscribe = onAuthStateChanged(auth, (usuario) => {
      if (!activo) return;
      const actual = ++revision;
      setEstado('cargando');
      if (!usuario) { setEstado('denegado'); return; }
      void (async () => {
        try {
          const token = await usuario.getIdToken();
          const response = await apiFetch(`${API_URL}/api/users/profile`, { headers: { Authorization: `Bearer ${token}` } });
          if (!response.ok) throw new Error('No se pudo verificar el perfil.');
          const profile = await response.json();
          if (activo && actual === revision) setEstado(esRolRevisorPagos(profile?.user?.role) ? 'permitido' : 'denegado');
        } catch {
          if (activo && actual === revision) setEstado('error');
        }
      })();
    });
    return () => { activo = false; unsubscribe(); };
  }, [reintento]);

  if (estado === 'permitido') return <>{children}</>;
  return (
    <VetCareBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.contenido}>
          {estado === 'cargando' ? <><ActivityIndicator size="large" color={Colors.light.primary} /><Text style={styles.texto}>Verificando acceso...</Text></> : <>
            <Text style={styles.titulo}>{estado === 'error' ? 'No se pudo verificar el acceso' : 'Acceso no disponible'}</Text>
            <Text style={styles.texto}>{estado === 'error' ? 'No se consultaron pagos. Comprueba tu conexión e inténtalo nuevamente.' : 'La revisión de pagos está disponible para Administrador y Recepcionista.'}</Text>
            {estado === 'error' && <Pressable style={styles.secundario} onPress={() => setReintento((v) => v + 1)}><Text style={styles.secundarioTexto}>Intentar nuevamente</Text></Pressable>}
            <Pressable style={styles.boton} onPress={() => router.replace('/home')}><Text style={styles.botonTexto}>Ir al inicio</Text></Pressable>
          </>}
        </View>
      </SafeAreaView>
    </VetCareBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' }, contenido: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 12 },
  titulo: { color: '#1F2937', fontSize: 20, fontWeight: '700', textAlign: 'center' }, texto: { color: '#6B7280', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  boton: { marginTop: 8, backgroundColor: Colors.light.primary, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 }, botonTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  secundario: { borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 }, secundarioTexto: { color: '#334155', fontSize: 14, fontWeight: '600' },
});

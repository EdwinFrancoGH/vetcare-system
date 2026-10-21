import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

const illustrations: Record<string, string> = {
  perro: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" rx="38" fill="#F4EDDF"/><ellipse cx="120" cy="207" rx="67" ry="14" fill="#E2D2B9"/><path d="M77 67Q42 43 48 104q6 37 37 23M163 67q35-24 29 37-6 37-37 23" fill="#A9663F" stroke="#895337" stroke-width="5"/><ellipse cx="120" cy="122" rx="67" ry="69" fill="#D59A67"/><ellipse cx="94" cy="118" rx="7" ry="9" fill="#35251E"/><ellipse cx="146" cy="118" rx="7" ry="9" fill="#35251E"/><ellipse cx="120" cy="145" rx="27" ry="21" fill="#F5E8D7"/><path d="M112 139q8-10 16 0-1 10-8 10t-8-10" fill="#34241F"/><path d="M120 150v9m0 0q-10 10-18 0m18 0q10 10 18 0" fill="none" stroke="#55382A" stroke-width="4" stroke-linecap="round"/><path d="M72 163q48 17 96 0" fill="none" stroke="#F2D6AF" stroke-width="8"/></svg>`,
  gato: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" rx="38" fill="#EAF2F4"/><ellipse cx="120" cy="207" rx="67" ry="14" fill="#CFDFE3"/><path d="M62 99 68 44q3-13 15-4l36 31 38-31q12-9 15 4l6 55v37q-4 61-58 61T62 136z" fill="#7B8798" stroke="#657285" stroke-width="4"/><path d="m74 64 34 27-32 8zM166 64l-34 27 32 8z" fill="#D99DA5"/><ellipse cx="95" cy="119" rx="7" ry="10" fill="#25333C"/><ellipse cx="145" cy="119" rx="7" ry="10" fill="#25333C"/><path d="m112 141 8-6 8 6-8 8z" fill="#C96E7D"/><path d="M120 149q-9 11-18 2m18-2q9 11 18 2" fill="none" stroke="#39444C" stroke-width="3" stroke-linecap="round"/><path d="M83 143 48 137m37 16-39 4m111-14 35-6m-37 22 39 4" stroke="#66727A" stroke-width="3" stroke-linecap="round"/></svg>`,
  ave: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" rx="38" fill="#E8F5EE"/><path d="M46 190q74-8 147 4" fill="none" stroke="#7F9A69" stroke-width="8" stroke-linecap="round"/><path d="M79 163q-11-54 34-78 42-23 75 11 29 31 4 76-29 42-81 15z" fill="#34A86D" stroke="#258654" stroke-width="4"/><path d="M104 158q32-48 78-42-10 47-57 61z" fill="#3A9AD2"/><circle cx="151" cy="104" r="35" fill="#44BA78"/><path d="m181 103 32 14-33 18q9-17 1-32" fill="#F0A333" stroke="#DA8525" stroke-width="3"/><circle cx="159" cy="96" r="5" fill="#172E27"/><path d="M107 184v14m26-10v10" stroke="#E5A138" stroke-width="6" stroke-linecap="round"/><path d="M61 190q-16-13-22-2m22 2q17-13 23-2" fill="none" stroke="#7F9A69" stroke-width="4" stroke-linecap="round"/></svg>`,
  conejo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" rx="38" fill="#F4EEF4"/><ellipse cx="120" cy="207" rx="67" ry="14" fill="#E4D7E5"/><ellipse cx="92" cy="70" rx="22" ry="57" transform="rotate(-12 92 70)" fill="#F7F2F0" stroke="#D7C8CE" stroke-width="4"/><ellipse cx="149" cy="70" rx="22" ry="57" transform="rotate(12 149 70)" fill="#F7F2F0" stroke="#D7C8CE" stroke-width="4"/><ellipse cx="92" cy="72" rx="9" ry="39" transform="rotate(-12 92 72)" fill="#E8AAB7"/><ellipse cx="149" cy="72" rx="9" ry="39" transform="rotate(12 149 72)" fill="#E8AAB7"/><ellipse cx="120" cy="139" rx="62" ry="58" fill="#F6F1ED" stroke="#D7C8CE" stroke-width="4"/><circle cx="97" cy="134" r="6" fill="#44363C"/><circle cx="143" cy="134" r="6" fill="#44363C"/><ellipse cx="120" cy="153" rx="10" ry="7" fill="#D9859A"/><path d="M120 159q-9 12-18 2m18-2q9 12 18 2" fill="none" stroke="#69545D" stroke-width="3" stroke-linecap="round"/><circle cx="72" cy="153" r="10" fill="#EDC4CB"/><circle cx="168" cy="153" r="10" fill="#EDC4CB"/></svg>`,
  hamster: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" rx="38" fill="#FFF2E2"/><ellipse cx="120" cy="207" rx="67" ry="14" fill="#EED9BE"/><circle cx="82" cy="90" r="20" fill="#CE8A4F"/><circle cx="158" cy="90" r="20" fill="#CE8A4F"/><circle cx="82" cy="90" r="10" fill="#E7A8A4"/><circle cx="158" cy="90" r="10" fill="#E7A8A4"/><ellipse cx="120" cy="132" rx="65" ry="61" fill="#DDA065"/><path d="M66 120q20-39 54-31 16 6 0 34-19 27-48 22zm108 0q-20-39-54-31-16 6 0 34 19 27 48 22z" fill="#F7E8D6"/><circle cx="97" cy="123" r="6" fill="#3D2B22"/><circle cx="143" cy="123" r="6" fill="#3D2B22"/><ellipse cx="120" cy="147" rx="11" ry="8" fill="#C46F70"/><path d="M120 154q-8 9-16 2m16-2q8 9 16 2" fill="none" stroke="#654638" stroke-width="3" stroke-linecap="round"/><circle cx="75" cy="155" r="9" fill="#E7A49B"/><circle cx="165" cy="155" r="9" fill="#E7A49B"/></svg>`,
  reptil: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" rx="38" fill="#EDF4E5"/><path d="M42 183q71-12 154 5" fill="none" stroke="#9FB77B" stroke-width="7" stroke-linecap="round"/><path d="M74 123q-20-30-38-19m42 47q-25 25-43 12m129-44q23-31 42-17m-38 48q25 24 44 10" fill="none" stroke="#58A65B" stroke-width="16" stroke-linecap="round"/><path d="M73 129q7-45 50-41 40 4 47 43 6 36-26 50-43 18-67-14-11-15-4-38" fill="#78BE62" stroke="#509A4C" stroke-width="4"/><path d="M160 112q20-33 45-17 22 14 3 35-14 14-43 3" fill="#78BE62" stroke="#509A4C" stroke-width="4"/><circle cx="188" cy="108" r="5" fill="#283A29"/><path d="M79 131q38 25 83-1" fill="none" stroke="#A9D77D" stroke-width="9" stroke-linecap="round"/><circle cx="104" cy="112" r="5" fill="#4C9B4C"/><circle cx="131" cy="153" r="5" fill="#4C9B4C"/><path d="M38 164h20m-22 8h23m-11-8v8" stroke="#6E9E54" stroke-width="3" stroke-linecap="round"/></svg>`,
  otro: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" rx="38" fill="#F0ECFA"/><circle cx="120" cy="120" r="79" fill="#E2D9F6"/><ellipse cx="120" cy="155" rx="23" ry="31" fill="#7956C9"/><ellipse cx="80" cy="112" rx="15" ry="20" transform="rotate(-25 80 112)" fill="#7956C9"/><ellipse cx="107" cy="83" rx="15" ry="20" transform="rotate(-8 107 83)" fill="#7956C9"/><ellipse cx="140" cy="83" rx="15" ry="20" transform="rotate(8 140 83)" fill="#7956C9"/><ellipse cx="167" cy="112" rx="15" ry="20" transform="rotate(25 167 112)" fill="#7956C9"/></svg>`,
};

const speciesKey = (species: string) => {
  const value = species.trim().toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  if (value === 'perro') return 'perro';
  if (value === 'gato') return 'gato';
  if (value === 'ave' || value === 'loro') return 'ave';
  if (value === 'conejo') return 'conejo';
  if (value === 'hamster') return 'hamster';
  if (value === 'reptil') return 'reptil';
  return 'otro';
};

function isValidCustomUri(uri: string) {
  return /^(https?:\/\/|file:\/\/|content:\/\/|ph:\/\/)/i.test(uri) && !/undefined|null/i.test(uri);
}

export function PetImage({ species, photoUri, style, accessibilityLabel }: { species: string; photoUri?: string | null; style: StyleProp<ViewStyle>; accessibilityLabel?: string }) {
  const custom = Boolean(photoUri?.trim());
  const valid = Boolean(photoUri && isValidCustomUri(photoUri));
  const svg = illustrations[speciesKey(species)] || illustrations.otro;
  const sourceUri = custom && valid ? photoUri! : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const [failedUri, setFailedUri] = useState('');
  const failed = (custom && !valid) || failedUri === sourceUri;

  if (failed) return <View style={[styles.fallback, style]} accessible accessibilityLabel={accessibilityLabel || 'Avatar genérico de mascota'}><Ionicons name="paw" size={34} color="#fff" /></View>;
  return <Image key={sourceUri} source={{ uri: sourceUri }} style={style as StyleProp<ImageStyle>} contentFit="cover" accessibilityLabel={accessibilityLabel || `Imagen de ${species || 'mascota'}`} onError={() => setFailedUri(sourceUri)} />;
}

const styles = StyleSheet.create({ fallback: { backgroundColor: '#8060C6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' } });

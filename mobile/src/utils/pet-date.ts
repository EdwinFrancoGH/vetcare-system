export function parsePetDate(value: string): Date | null {
  const raw = value.trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  const dmy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!iso && !dmy) return null;
  if (iso && raw.includes('T') && !Number.isFinite(Date.parse(raw))) return null;
  const year = Number(iso ? iso[1] : dmy![3]);
  const month = Number(iso ? iso[2] : dmy![2]);
  const day = Number(iso ? iso[3] : dmy![1]);
  const parsed = new Date(year, month - 1, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

export function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculatePetAge(value: string, today = new Date()): number | null {
  const birth = parsePetDate(value);
  if (!birth) return null;
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (birth > current) return null;
  let years = current.getFullYear() - birth.getFullYear();
  if (current.getMonth() < birth.getMonth() || (current.getMonth() === birth.getMonth() && current.getDate() < birth.getDate())) years -= 1;
  return Math.max(0, years);
}

export function formatPetDate(value: string): string {
  const date = parsePetDate(value);
  if (!date) return '';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

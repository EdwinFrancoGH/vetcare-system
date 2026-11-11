import { API_URL } from '@/config/api';
import { apiFetch } from '@/lib/api-client';
import { crearServicioPagosCitas } from '@/features/pagos-citas/utils/pagos-admin.service';

export type { PagoPendienteRevision, EventoPagoRevision, DetallePagoRevision } from '@/features/pagos-citas/utils/pagos-admin.service';

export const pagosCitasService = crearServicioPagosCitas((url, init) => apiFetch(url, init), API_URL);

import { auth } from '@/config/firebase';

/** Adds the current Firebase ID token to requests when the caller has not supplied one. */
export async function apiFetch(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1] = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const user = auth.currentUser;

  if (user && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
  }

  return fetch(input, { ...init, headers });
}

import type { User } from 'firebase/auth';

/**
 * Asks our server for a Stream (video + chat) token for the signed-in user.
 *
 * We send the user's Firebase ID token so the server can prove who is asking.
 * The server ignores any user ID we could send and only issues a token for
 * the account the ID token belongs to, so nobody can impersonate another user.
 */
export async function fetchStreamToken(user: User): Promise<string> {
  const idToken = await user.getIdToken();
  const response = await fetch('/api/stream/token', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch Stream token (${response.status})`);
  }
  const { token } = (await response.json()) as { token: string };
  return token;
}

/**
 * Dhan credentials are read from environment variables ONLY.
 * The API key is expected to rotate (~every 24h); because it is read at
 * request time (not cached at build), updating the env var takes effect
 * without any code change or redeploy of application logic.
 *
 *   DHAN_CLIENT_ID  - your Dhan client id
 *   DHAN_API_KEY    - the daily access token
 */
export function getDhanCredentials(): { clientId: string; accessToken: string } | null {
  const clientId = process.env.DHAN_CLIENT_ID
  const accessToken = process.env.DHAN_API_KEY
  if (!clientId || !accessToken) return null
  return { clientId, accessToken }
}

export function isDhanConfigured(): boolean {
  return getDhanCredentials() !== null
}

export const DHAN_BASE_URL = "https://api.dhan.co/v2"

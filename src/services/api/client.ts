import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '../../config/env';
import { useAuthStore } from '../../store/authStore';

// The app never holds provider keys. Every AI request goes through our backend with
// the user's JWT; the gateway attaches provider credentials server-side.
export const api = axios.create({ baseURL: env.apiBaseUrl, timeout: 30_000 });

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const { refreshToken, setTokens } = useAuthStore.getState();
  if (!refreshToken) return false;
  try {
    const { data } = await axios.post(`${env.apiBaseUrl}/auth/refresh`, {
      refreshToken,
    });
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

/** Single-flight refresh shared by Axios and the chat SSE stream. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= refreshTokens().finally(() => (refreshing = null));
  return refreshing;
}

/** Shows the backend's message (e.g. "Incorrect email or password") instead of Axios's. */
function withServerMessage(error: AxiosError) {
  const message = (error.response?.data as { message?: unknown } | undefined)
    ?.message;
  if (typeof message === 'string') error.message = message;
  else if (Array.isArray(message)) error.message = message.join('\n');
  else if (!error.response) error.message = 'Cannot reach the server';
  return error;
}

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const isAuthCall = original?.url?.startsWith('/auth/');
    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      isAuthCall
    )
      throw withServerMessage(error);

    original._retry = true;
    if (await refreshSession()) return api(original);

    useAuthStore.getState().logout();
    throw withServerMessage(error);
  },
);

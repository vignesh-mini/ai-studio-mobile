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

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    if (error.response?.status !== 401 || !original || original._retry)
      throw error;

    original._retry = true;
    refreshing ??= refreshTokens().finally(() => (refreshing = null));
    if (await refreshing) return api(original);

    useAuthStore.getState().logout();
    throw error;
  },
);

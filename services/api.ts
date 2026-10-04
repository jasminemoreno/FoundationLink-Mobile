import axios from 'axios';
import * as storage from '../utils/storage';

// Use your machine's LAN IP, not localhost — e.g. http://192.168.100.10:8000
// Expo Go on your phone needs the LAN IP; the web build can use it too.
const HOST = 'http://192.168.100.10:8000';
const BASE_URL = `${HOST}/api`;
const STORAGE_BASE_URL = `${HOST}/storage/`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await storage.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.deleteItemAsync('token');
      await storage.deleteItemAsync('user');
    }
    return Promise.reject(error);
  }
);

export function getImageUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return STORAGE_BASE_URL + clean;
}

export function formatMoney(v: number | string | null | undefined): string {
  return Number(v || 0).toLocaleString();
}

export function formatDate(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default api;
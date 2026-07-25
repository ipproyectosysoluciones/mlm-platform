/**
 * @fileoverview Axios HTTP client configuration
 * @description Centralized API client for backend communication with interceptors
 *               Cliente HTTP centralizado para comunicación con el backend
 * @module services/api/client
 */

import axios from 'axios';

/** @constant {string} API_URL - Backend base URL / URL base del backend */
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

/** @constant {string} CF_ACCESS_CLIENT_ID - Cloudflare Access Client ID */
const CF_ACCESS_CLIENT_ID = import.meta.env.VITE_CF_ACCESS_CLIENT_ID;

/** @constant {string} CF_ACCESS_CLIENT_SECRET - Cloudflare Access Client Secret */
const CF_ACCESS_CLIENT_SECRET = import.meta.env.VITE_CF_ACCESS_CLIENT_SECRET;

/**
 * Axios instance with default config and interceptors
 * Instancia de Axios con configuración por defecto e interceptores
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    // Cloudflare Access headers (if configured)
    ...(CF_ACCESS_CLIENT_ID &&
      CF_ACCESS_CLIENT_SECRET && {
        'CF-Access-Client-Id': CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': CF_ACCESS_CLIENT_SECRET,
      }),
  },
});

/**
 * Request interceptor to add auth token
 * Interceptor de requests para agregar token de auth
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

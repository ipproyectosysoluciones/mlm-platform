/**
 * @fileoverview Auth service - Authentication API methods
 * @module services/api/auth
 */
import api from './client';
import type { LoginRequest, RegisterRequest, AuthResponse, AuthLoginResponse } from '../../types';

/**
 * @namespace authService
 * @description Authentication API methods / Métodos de API de autenticación
 */
export const authService = {
  /**
   * Login user
   * Iniciar sesión de usuario
   * @param {LoginRequest} data - Login credentials / Credenciales de login
   * @returns {Promise<AuthResponse>} Auth response with token and user / Respuesta con token y usuario
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', data);
    return response.data.data!;
  },

  /**
   * Register new user — always returns token + user (no 2FA on registration)
   * Registrar nuevo usuario — siempre retorna token + usuario (no 2FA en registro)
   * @param {RegisterRequest} data - Registration data / Datos de registro
   * @returns {Promise<AuthLoginResponse>} Auth response with token and user / Respuesta con token y usuario
   */
  register: async (data: RegisterRequest): Promise<AuthLoginResponse> => {
    const response = await api.post<{ success: boolean; data: AuthLoginResponse }>(
      '/auth/register',
      data
    );
    return response.data.data!;
  },

  /**
   * Get current user profile
   * Obtener perfil del usuario actual
   * @returns {Promise} API response with user data / Respuesta de API con datos de usuario
   */
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: { firstName?: string; lastName?: string; phone?: string }) => {
    const response = await api.patch('/users/me', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/users/me/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  deleteAccount: async (password: string) => {
    const response = await api.post('/users/me/delete', { password });
    return response.data;
  },
};

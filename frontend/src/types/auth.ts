/** Domain types for authentication / Tipos de dominio para autenticación. @module types/auth */

export interface User {
  id: string;
  email: string;
  referralCode: string;
  level: number;
  levelName?: string;
  role?: 'admin' | 'user';
  sponsorId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  sponsorReferralCode?: string;
}

/**
 * Normal login response — token + user data
 * Respuesta de login normal — token + datos de usuario
 */
export interface AuthLoginResponse {
  token: string;
  user: User;
}

/**
 * 2FA required response — indicates a second factor is needed before login completes
 * Respuesta de 2FA requerido — indica que se necesita un segundo factor antes de completar el login
 */
export interface Auth2FARequiredResponse {
  requires2FA: true;
  tempToken: string;
  userId: string;
}

/**
 * Discriminated union for auth login outcomes.
 * When `requires2FA` is `true`, the user must complete 2FA verification with a temp token.
 * Otherwise, the response contains the final token and user data.
 *
 * Unión discriminada para resultados del login de auth.
 * Cuando `requires2FA` es `true`, el usuario debe completar la verificación 2FA con un token temporal.
 * De lo contrario, la respuesta contiene el token final y los datos de usuario.
 */
export type AuthResponse = AuthLoginResponse | Auth2FARequiredResponse;

/**
 * Type guard to check if an auth response requires 2FA verification.
 * Guarda de tipo para verificar si una respuesta de auth requiere verificación 2FA.
 *
 * @param response - The auth response to check / La respuesta de auth a verificar
 * @returns `true` if 2FA is required, narrowing the type to `Auth2FARequiredResponse`
 *          `true` si se requiere 2FA, estrechando el tipo a `Auth2FARequiredResponse`
 */
export function is2FARequired(response: AuthResponse): response is Auth2FARequiredResponse {
  return 'requires2FA' in response && response.requires2FA === true;
}

/**
 * SessionStorage key for the temporary JWT token during 2FA login flow.
 * Clave de sessionStorage para el token JWT temporal durante el flujo de login 2FA.
 */
export const TWO_FA_TEMP_TOKEN_KEY = '2fa_temp_token';

/**
 * SessionStorage key for the user ID during 2FA login flow.
 * Clave de sessionStorage para el ID de usuario durante el flujo de login 2FA.
 */
export const TWO_FA_USER_ID_KEY = '2fa_user_id';

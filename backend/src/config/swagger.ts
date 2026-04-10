import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Swagger/OpenAPI Configuration for Nexo Real API
 * Configuración Swagger/OpenAPI para la API de Nexo Real
 *
 * v2.4.0: Sprint 8 - RBAC 9 roles (super_admin, admin, finance, sales, advisor, vendor, user, guest, bot),
 *          register/guest endpoint, updateUserRole endpoint, Seed Nexo Real colombiano (Unilevel)
 * v2.3.5: Sprint 7 patch - ReservationFlowPage unhandled rejection fix, CD pipeline Docker context fix, lint fixes
 * v2.2.0: Sprint 6 - Admin Dashboard CRUD, Nexo Bot flows, i18n cleanup, binary_balance migration, build hardening
 * v2.1.0: Sprint 5 - Real Estate Frontend, Tourism Frontend, Reservation Wizard, Security fixes
 * v2.0.0: Sprint 4 - Nexo Bot (WhatsApp AI), n8n Automation, Frontend tests 210+, Gamification
 * v1.10.0: Sprint 2 - Gift Cards, Abandoned Cart Recovery, Email Automation
 * v1.9.0: Gamification + Dynamic Commissions
 * v1.8.0: PayPal + MercadoPago Payment Gateways
 * v1.7.0: PWA Landing Pages + Push Notifications
 * v1.6.0: PWA + Offline pages, icons multi-size
 * v1.5.0: Backend controllers refactoring (modular structure)
 * v1.4.0: Wallet digital + 2FA
 * v1.0.0: MVP - Auth, Tree, Commissions, CRM, RBAC
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nexo Real API',
      version: '2.4.0',
      description: `
## API REST para plataforma Nexo Real — Servicios Inmobiliarios, Turismo y Afiliaciones Unilevel

### Autenticación / Authentication
Esta API usa JWT Bearer tokens. Incluye el token en el header:
\`Authorization: Bearer <tu_token>\`

### Códigos de Estado / Status Codes
| Código | Descripción / Description |
|--------|--------------------------|
| 200 | Éxito / Success |
| 201 | Creado / Created |
| 400 | Error de validación / Validation Error |
| 401 | No autenticado / Not Authenticated |
| 403 | Acceso denegado / Access Denied |
| 404 | No encontrado / Not Found |
| 429 | Rate limit excedido / Rate Limit Exceeded |

### Versiones / Versions
- **v2.4.0** (2026-04-10): Sprint 8 - RBAC 9 roles, register/guest, updateUserRole, Seed Nexo Real colombiano
- **v2.3.5** (2026-04-09): Sprint 7 patch - ReservationFlowPage unhandled rejection fix, CD pipeline Docker context fix, lint cleanup
- **v2.2.0** (2026-04-07): Sprint 6 - Admin Dashboard CRUD, Nexo Bot flows, i18n cleanup, network_balance migration, build hardening
- **v2.1.0** (2026-04-07): Sprint 5 - Real Estate Frontend, Tourism Frontend, Reservation Wizard, Security fixes (CodeQL CWE-843, Dependabot file-type)
- **v2.0.0** (2026-04-06): Sprint 4 - Nexo Bot (WhatsApp AI), n8n Automation, Frontend tests 210+, Gamification
- **v1.10.0** (2026-04-04): Sprint 2 - Gift Cards, Abandoned Cart Recovery, Email Automation
- **v1.9.0** (2026-04-03): Gamification + Dynamic Commissions
- **v1.8.0** (2026-04-03): PayPal + MercadoPago Payment Gateways
- **v1.7.0** (2026-04-02): PWA Landing Pages + Push Notifications
- **v1.6.0** (2026-04-01): PWA, Offline pages, Backend refactoring completo
- **v1.5.0** (2026-03-31): Controllers modulares, Notificaciones Email
- **v1.4.0** (2026-03-28): Wallet Digital, 2FA TOTP
- **v1.0.0** (2026-03-15): MVP - Auth, Tree, Commissions, CRM, RBAC
      `,
      contact: {
        name: 'Nexo Real Support',
        email: 'support@nexoreal.com', // TODO: domain pending
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor de Desarrollo / Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /auth/login or /auth/register',
        },
        botSecret: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Bot-Secret',
          description:
            'Bot secret key from BOT_SECRET env variable — used by Nexo Bot to authenticate / Clave secreta del bot desde la variable BOT_SECRET — usada por el Nexo Bot para autenticarse',
        },
      },
      schemas: {
        // ============================================================
        // COMMON / COMUNES
        // ============================================================
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description:
                'Indica si la petición fue exitosa / Indicates if request was successful',
            },
            data: {
              type: 'object',
              description: 'Datos de respuesta / Response data',
              nullable: true,
            },
            message: {
              type: 'string',
              description: 'Mensaje opcional / Optional message',
              nullable: true,
            },
            error: {
              oneOf: [
                { type: 'string' },
                {
                  type: 'object',
                  properties: {
                    code: { type: 'string', description: 'Código de error / Error code' },
                    message: { type: 'string', description: 'Mensaje de error / Error message' },
                  },
                },
              ],
              description: 'Error si success es false / Error if success is false',
              nullable: true,
            },
          },
        },

        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              oneOf: [
                { type: 'string' },
                {
                  type: 'object',
                  properties: {
                    code: { type: 'string' },
                    message: { type: 'string' },
                  },
                },
              ],
            },
          },
        },

        PaginationMeta: {
          type: 'object',
          description: 'Metadatos de paginación / Pagination metadata',
          properties: {
            total: { type: 'integer', description: 'Total de elementos / Total items' },
            page: { type: 'integer', description: 'Página actual / Current page' },
            limit: { type: 'integer', description: 'Elementos por página / Items per page' },
            hasMore: {
              type: 'boolean',
              description: 'Indica si hay más páginas / Indicates if there are more pages',
            },
          },
        },

        PaginationQuery: {
          type: 'object',
          description: 'Parámetros de paginación / Pagination parameters',
          properties: {
            page: {
              type: 'integer',
              minimum: 1,
              default: 1,
              description: 'Número de página / Page number',
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20,
              description: 'Elementos por página / Items per page',
            },
          },
        },

        // ============================================================
        // AUTH / AUTENTICACIÓN
        // ============================================================

        // ============================================================
        // 2FA / AUTENTICACIÓN DE DOS FACTORES (Phase 5)
        // ============================================================
        TwoFactorStatus: {
          type: 'object',
          description: 'Estado de 2FA del usuario / 2FA status for user',
          properties: {
            enabled: {
              type: 'boolean',
              description: 'Indica si 2FA está habilitado / Indicates if 2FA is enabled',
            },
            enabledAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha de habilitación / Enable date',
            },
            method: {
              type: 'string',
              enum: ['totp'],
              description: 'Método de 2FA / 2FA method',
            },
          },
        },

        TwoFactorSetupResponse: {
          type: 'object',
          description: 'Respuesta de configuración de 2FA / 2FA setup response',
          properties: {
            qrCodeUrl: {
              type: 'string',
              description: 'URL del código QR para escanear / QR code URL to scan',
            },
            secret: {
              type: 'string',
              description: 'Secreto TOTP / TOTP secret',
            },
            expiresIn: {
              type: 'integer',
              description: 'Tiempo de expiración en segundos / Expiration time in seconds',
            },
          },
        },

        TwoFactorVerifyRequest: {
          type: 'object',
          required: ['code'],
          properties: {
            code: {
              type: 'string',
              description: 'Código TOTP de 6 dígitos / 6-digit TOTP code',
              minLength: 6,
              maxLength: 6,
            },
          },
        },

        TwoFactorVerifySetupResponse: {
          type: 'object',
          description: 'Respuesta de verificación de setup / Setup verification response',
          properties: {
            success: {
              type: 'boolean',
              description:
                'Indica si la verificación fue exitosa / Indicates if verification was successful',
            },
            recoveryCodes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Códigos de recuperación / Recovery codes',
            },
            message: {
              type: 'string',
              description: 'Mensaje de respuesta / Response message',
            },
          },
        },

        TwoFactorVerifyResponse: {
          type: 'object',
          description: 'Respuesta de verificación de código / Code verification response',
          properties: {
            verified: {
              type: 'boolean',
              description: 'Indica si el código es válido / Indicates if code is valid',
            },
          },
        },

        TwoFactorDisableResponse: {
          type: 'object',
          description: 'Respuesta al deshabilitar 2FA / 2FA disable response',
          properties: {
            success: {
              type: 'boolean',
              description:
                'Indica si se deshabilitó correctamente / Indicates if disabled successfully',
            },
            message: {
              type: 'string',
              description: 'Mensaje de respuesta / Response message',
            },
          },
        },
        User: {
          type: 'object',
          description: 'Usuario / User',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del usuario / Unique user ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario / User email',
            },
            referralCode: {
              type: 'string',
              example: 'MLM-XXXX-XXXX',
              description: 'Código de referido único / Unique referral code',
            },
            level: {
              type: 'integer',
              minimum: 1,
              description: 'Nivel en el árbol / Level in tree',
            },
            currency: {
              type: 'string',
              enum: ['USD', 'COP', 'MXN'],
              default: 'USD',
              description: 'Moneda preferida / Preferred currency',
            },
            role: {
              type: 'string',
              enum: [
                'super_admin',
                'admin',
                'finance',
                'sales',
                'advisor',
                'vendor',
                'user',
                'guest',
                'bot',
              ],
              default: 'user',
              description: 'Rol del usuario / User role',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              default: 'active',
              description: 'Estado del usuario / User status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación / Creation date',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Última actualización / Last update',
            },
          },
        },

        UserProfile: {
          type: 'object',
          description: 'Perfil de usuario (para /users/me) / User profile (for /users/me)',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            referralCode: { type: 'string' },
            level: { type: 'integer' },
            levelName: {
              type: 'string',
              description:
                'Nombre del nivel (ej: Starter, Bronze, Silver, Gold, Platinum) / Level name',
            },
            status: { type: 'string', enum: ['active', 'inactive'] },
            currency: { type: 'string', enum: ['USD', 'COP', 'MXN'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario / User email',
            },
            password: { type: 'string', format: 'password', description: 'Contraseña / Password' },
          },
        },

        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario / User email',
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 8,
              description: 'Contraseña (min 8 chars, 1 número) / Password',
            },
            sponsor_code: {
              type: 'string',
              description:
                'Código de referido del patrocinador (opcional) / Sponsor referral code (optional)',
            },
          },
        },

        RegisterGuestRequest: {
          type: 'object',
          required: ['email', 'password'],
          description:
            'Registro de usuario invitado (sin sponsor) / Guest user registration (no sponsor required)',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario invitado / Guest user email',
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 8,
              description: 'Contraseña (min 8 chars) / Password (min 8 chars)',
            },
          },
        },

        UpdateUserRoleRequest: {
          type: 'object',
          required: ['role'],
          description:
            'Solicitud para actualizar el rol de un usuario / Request to update user role (super_admin/admin only)',
          properties: {
            role: {
              type: 'string',
              enum: [
                'super_admin',
                'admin',
                'finance',
                'sales',
                'advisor',
                'vendor',
                'user',
                'guest',
                'bot',
              ],
              description: 'Nuevo rol para el usuario / New role for the user',
            },
          },
        },

        AuthToken: {
          type: 'object',
          description: 'Respuesta de autenticación / Authentication response',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            token: { type: 'string', description: 'JWT token' },
          },
        },

        ChangePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: {
              type: 'string',
              format: 'password',
              description: 'Contraseña actual / Current password',
            },
            newPassword: {
              type: 'string',
              format: 'password',
              minLength: 8,
              description: 'Nueva contraseña (min 8 chars, 1 número) / New password',
            },
          },
        },

        DeleteAccountRequest: {
          type: 'object',
          required: ['password'],
          properties: {
            password: {
              type: 'string',
              format: 'password',
              description: 'Contraseña para confirmar / Password to confirm',
            },
          },
        },

        UpdateProfileRequest: {
          type: 'object',
          properties: {
            firstName: { type: 'string', description: 'Nombre / First name' },
            lastName: { type: 'string', description: 'Apellido / Last name' },
            phone: { type: 'string', description: 'Teléfono / Phone' },
          },
        },

        // ============================================================
        // TREE / ÁRBOL (Phase 1 + Phase 3)
        // ============================================================
        TreeNode: {
          type: 'object',
          description: 'Nodo del árbol Unilevel / Unilevel tree node',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'ID del usuario / User ID' },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario / User email',
            },
            referralCode: { type: 'string', description: 'Código de referido / Referral code' },
            position: {
              type: 'string',
              nullable: true,
              description: 'Posición (null en Unilevel) / Position (null in Unilevel)',
            },
            level: { type: 'integer', description: 'Nivel en el árbol / Level in tree' },
            stats: {
              type: 'object',
              description: 'Estadísticas del nodo / Node statistics',
              properties: {
                directChildren: {
                  type: 'integer',
                  description: 'Hijos directos del nodo / Direct children of node',
                },
                totalDownline: {
                  type: 'integer',
                  description: 'Total de descendientes / Total downline members',
                },
              },
            },
            children: {
              type: 'array',
              description: 'Hijos directos / Direct children',
              items: { $ref: '#/components/schemas/TreeNode' },
            },
          },
        },

        TreeResponse: {
          type: 'object',
          description:
            'Respuesta del árbol Unilevel con estadísticas / Unilevel tree response with stats',
          properties: {
            tree: { $ref: '#/components/schemas/TreeNode' },
            stats: {
              type: 'object',
              properties: {
                directChildren: {
                  type: 'integer',
                  description: 'Hijos directos / Direct children',
                },
                totalDownline: {
                  type: 'integer',
                  description: 'Total downline / Total downline members',
                },
              },
            },
          },
        },

        TreePaginatedResponse: {
          type: 'object',
          description: 'Respuesta paginada del árbol / Paginated tree response (Phase 3)',
          properties: {
            tree: { $ref: '#/components/schemas/TreeNode' },
            pagination: { $ref: '#/components/schemas/PaginationMeta' },
            stats: { $ref: '#/components/schemas/TreeResponse/properties/stats' },
          },
        },

        // ============================================================
        // PHASE 3: USER DETAILS & SEARCH (Visual Tree UI)
        // ============================================================
        UserSearchResult: {
          type: 'object',
          description: 'Resultado de búsqueda de usuario / User search result (Phase 3)',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            referralCode: { type: 'string' },
            level: { type: 'integer' },
          },
        },

        UserStats: {
          type: 'object',
          description:
            'Estadísticas del usuario en el árbol Unilevel / User stats in Unilevel tree (Phase 3)',
          properties: {
            directChildren: {
              type: 'integer',
              description: 'Hijos directos del usuario / Direct children of user',
            },
            totalDownline: {
              type: 'integer',
              description: 'Total downline / Total downline',
            },
          },
        },

        UserDetails: {
          type: 'object',
          description:
            'Detalles extendidos de usuario para Visual Tree UI / Extended user details for Visual Tree UI (Phase 3)',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            referralCode: { type: 'string' },
            position: {
              type: 'string',
              nullable: true,
              description: 'null en Unilevel / null in Unilevel',
            },
            level: { type: 'integer' },
            status: { type: 'string', enum: ['active', 'inactive'] },
            stats: { $ref: '#/components/schemas/UserStats' },
          },
        },

        // ============================================================
        // DASHBOARD
        // ============================================================
        DashboardStats: {
          type: 'object',
          description: 'Estadísticas del dashboard / Dashboard statistics',
          properties: {
            totalReferrals: {
              type: 'integer',
              description: 'Total de referidos directos / Total direct referrals',
            },
            directChildren: {
              type: 'integer',
              description:
                'Hijos directos en la red Unilevel / Direct children in Unilevel network',
            },
            totalDownline: {
              type: 'integer',
              description: 'Total de miembros en la red / Total downline members',
            },
            totalEarnings: {
              type: 'number',
              format: 'float',
              description: 'Ganancias totales / Total earnings',
            },
            pendingEarnings: {
              type: 'number',
              format: 'float',
              description: 'Ganancias pendientes / Pending earnings',
            },
          },
        },

        Commission: {
          type: 'object',
          description: 'Comisión / Commission',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: {
              type: 'string',
              enum: ['direct', 'level_1', 'level_2', 'level_3', 'level_4'],
              description: 'Tipo de comisión / Commission type',
            },
            amount: {
              type: 'number',
              format: 'float',
              description: 'Monto de la comisión / Commission amount',
            },
            currency: { type: 'string', enum: ['USD', 'COP', 'MXN'] },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'paid', 'rejected'],
              description: 'Estado de la comisión / Commission status',
            },
            createdAt: { type: 'string', format: 'date-time' },
            fromUser: {
              type: 'object',
              nullable: true,
              properties: {
                email: { type: 'string' },
                referralCode: { type: 'string' },
              },
            },
          },
        },

        Referral: {
          type: 'object',
          description: 'Referido / Referral',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            position: { type: 'string', enum: ['left', 'right'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        DashboardData: {
          type: 'object',
          description: 'Datos completos del dashboard / Complete dashboard data',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            stats: { $ref: '#/components/schemas/DashboardStats' },
            referralLink: {
              type: 'string',
              format: 'uri',
              description: 'Link de referido / Referral link',
            },
            recentCommissions: {
              type: 'array',
              items: { $ref: '#/components/schemas/Commission' },
            },
            recentReferrals: {
              type: 'array',
              items: { $ref: '#/components/schemas/Referral' },
            },
          },
        },

        // ============================================================
        // COMMISSIONS
        // ============================================================
        CommissionStats: {
          type: 'object',
          description: 'Estadísticas de comisiones / Commission statistics',
          properties: {
            totalEarned: {
              type: 'number',
              format: 'float',
              description: 'Total ganado / Total earned',
            },
            pending: { type: 'number', format: 'float', description: 'Pendiente / Pending' },
            paid: { type: 'number', format: 'float', description: 'Pagado / Paid' },
            count: {
              type: 'integer',
              description: 'Cantidad de comisiones / Number of commissions',
            },
          },
        },

        PaginatedCommissions: {
          type: 'object',
          description: 'Comisiones paginadas / Paginated commissions',
          properties: {
            rows: {
              type: 'array',
              items: { $ref: '#/components/schemas/Commission' },
            },
            count: { type: 'integer', description: 'Total de comisiones / Total commissions' },
          },
        },

        CommissionQuery: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            type: {
              type: 'string',
              enum: ['direct', 'level_1', 'level_2', 'level_3', 'level_4'],
              description: 'Filtrar por tipo / Filter by type',
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'paid', 'rejected'],
              description: 'Filtrar por estado / Filter by status',
            },
          },
        },

        // ============================================================
        // ADMIN
        // ============================================================
        AdminStats: {
          type: 'object',
          description: 'Estadísticas globales de administrador / Global admin statistics',
          properties: {
            totalUsers: { type: 'integer', description: 'Total de usuarios / Total users' },
            activeUsers: { type: 'integer', description: 'Usuarios activos / Active users' },
            inactiveUsers: { type: 'integer', description: 'Usuarios inactivos / Inactive users' },
            totalCommissions: {
              type: 'number',
              format: 'float',
              description: 'Total en comisiones / Total in commissions',
            },
            totalEarnings: {
              type: 'number',
              format: 'float',
              description: 'Ganancias totales pagadas / Total earnings paid',
            },
          },
        },

        UserWithSponsor: {
          allOf: [
            { $ref: '#/components/schemas/User' },
            {
              type: 'object',
              properties: {
                sponsor: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                  },
                },
                sponsorId: { type: 'string', nullable: true },
                position: { type: 'string', nullable: true },
                firstName: { type: 'string', nullable: true },
                lastName: { type: 'string', nullable: true },
                phone: { type: 'string', nullable: true },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          ],
        },

        PaginatedUsers: {
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: { $ref: '#/components/schemas/UserWithSponsor' },
            },
            count: { type: 'integer' },
            page: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },

        AdminUserQuery: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            status: { type: 'string', enum: ['active', 'inactive'] },
            search: { type: 'string', description: 'Buscar por email / Search by email' },
          },
        },

        // ============================================================
        // CRM
        // ============================================================
        Lead: {
          type: 'object',
          description: 'Lead/Prospecto / Lead',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', nullable: true },
            status: {
              type: 'string',
              enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
            },
            source: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
            assignedTo: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        Task: {
          type: 'object',
          description: 'Tarea / Task',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            assignedTo: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        PaginatedLeads: {
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: { $ref: '#/components/schemas/Lead' },
            },
            count: { type: 'integer' },
          },
        },

        PaginatedTasks: {
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: { $ref: '#/components/schemas/Task' },
            },
            count: { type: 'integer' },
          },
        },

        // ============================================================
        // PRODUCTS (E-commerce / Streaming)
        // ============================================================
        Product: {
          type: 'object',
          description: 'Producto / Product - Streaming subscription or e-commerce product',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del producto / Unique product ID',
            },
            name: {
              type: 'string',
              description: 'Nombre del producto / Product name',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Descripción del producto / Product description',
            },
            type: {
              type: 'string',
              enum: ['subscription', 'one-time', 'streaming'],
              description: 'Tipo de producto / Product type',
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Precio del producto / Product price',
            },
            currency: {
              type: 'string',
              enum: ['USD', 'COP', 'MXN'],
              default: 'USD',
              description: 'Moneda / Currency',
            },
            interval: {
              type: 'string',
              enum: ['monthly', 'yearly', null],
              nullable: true,
              description: 'Intervalo de facturación / Billing interval',
            },
            features: {
              type: 'array',
              items: { type: 'string' },
              nullable: true,
              description: 'Características incluidas / Included features',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              default: 'active',
              description: 'Estado del producto / Product status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación / Creation date',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Última actualización / Last update',
            },
          },
        },

        ProductQuery: {
          type: 'object',
          description: 'Parámetros de consulta de productos / Product query parameters',
          properties: {
            page: {
              type: 'integer',
              minimum: 1,
              default: 1,
              description: 'Número de página / Page number',
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20,
              description: 'Elementos por página / Items per page',
            },
            platform: {
              type: 'string',
              enum: ['subscription', 'streaming', 'one-time'],
              description: 'Filtrar por tipo de producto / Filter by product type',
            },
          },
        },

        // ============================================================
        // ORDERS (E-commerce / Streaming)
        // ============================================================
        Order: {
          type: 'object',
          description: 'Pedido / Order - Order for products or subscriptions',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del pedido / Unique order ID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del usuario / User ID',
            },
            productId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'ID del producto / Product ID',
            },
            purchaseId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'ID de la compra asociada / Associated purchase ID',
            },
            amount: {
              type: 'number',
              format: 'float',
              description: 'Monto total del pedido / Total order amount',
            },
            currency: {
              type: 'string',
              enum: ['USD', 'COP', 'MXN'],
              description: 'Moneda / Currency',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'cancelled', 'refunded'],
              description: 'Estado del pedido / Order status',
            },
            paymentMethod: {
              type: 'string',
              nullable: true,
              description: 'Método de pago / Payment method',
            },
            transactionId: {
              type: 'string',
              nullable: true,
              description: 'ID de transacción / Transaction ID',
            },
            streamUrl: {
              type: 'string',
              nullable: true,
              description: 'URL de streaming (si aplica) / Streaming URL (if applicable)',
            },
            streamToken: {
              type: 'string',
              nullable: true,
              description: 'Token de streaming (si aplica) / Streaming token (if applicable)',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha de expiración / Expiration date',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación / Creation date',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Última actualización / Last update',
            },
          },
        },

        OrderItem: {
          type: 'object',
          description: 'Item de pedido / Order item',
          properties: {
            productId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del producto / Product ID',
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              default: 1,
              description: 'Cantidad / Quantity',
            },
          },
        },

        CreateOrderRequest: {
          type: 'object',
          required: ['items', 'paymentMethod'],
          description: 'Solicitud para crear pedido / Order creation request',
          properties: {
            items: {
              type: 'array',
              minItems: 1,
              description: 'Lista de items / Items list',
              items: { $ref: '#/components/schemas/OrderItem' },
            },
            paymentMethod: {
              type: 'string',
              description: 'Método de pago / Payment method',
            },
          },
        },

        OrderQuery: {
          type: 'object',
          description: 'Parámetros de consulta de pedidos / Order query parameters',
          properties: {
            page: {
              type: 'integer',
              minimum: 1,
              default: 1,
              description: 'Número de página / Page number',
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20,
              description: 'Elementos por página / Items per page',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'cancelled', 'refunded'],
              description: 'Filtrar por estado / Filter by status',
            },
          },
        },

        PaginatedOrders: {
          type: 'object',
          description: 'Pedidos paginados / Paginated orders',
          properties: {
            rows: {
              type: 'array',
              items: { $ref: '#/components/schemas/Order' },
            },
            count: { type: 'integer', description: 'Total de pedidos / Total orders' },
            page: { type: 'integer', description: 'Página actual / Current page' },
            totalPages: { type: 'integer', description: 'Total de páginas / Total pages' },
          },
        },

        // ============================================================
        // PUSH NOTIFICATIONS (Phase 6)
        // ============================================================
        PushSubscription: {
          type: 'object',
          description: 'Suscripción a notificaciones push / Push notification subscription',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único de la suscripción / Unique subscription ID',
            },
            endpoint: {
              type: 'string',
              description: 'URL del endpoint push / Push endpoint URL',
            },
            p256dh: {
              type: 'string',
              description: 'Clave pública P-256 / P-256 public key',
            },
            auth: {
              type: 'string',
              description: 'Clave de autenticación / Auth secret',
            },
            userAgent: {
              type: 'string',
              nullable: true,
              description: 'User agent del navegador / Browser user agent',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación / Creation date',
            },
          },
        },

        PushSubscribeRequest: {
          type: 'object',
          required: ['endpoint', 'keys'],
          description: 'Solicitud de suscripción a push / Push subscription request',
          properties: {
            endpoint: {
              type: 'string',
              description: 'URL del endpoint push / Push endpoint URL',
            },
            keys: {
              type: 'object',
              required: ['p256dh', 'auth'],
              description: 'Claves de suscripción / Subscription keys',
              properties: {
                p256dh: {
                  type: 'string',
                  description:
                    'Clave pública P-256 codificada en Base64 / Base64 encoded P-256 public key',
                },
                auth: {
                  type: 'string',
                  description:
                    'Secreto de autenticación codificado en Base64 / Base64 encoded auth secret',
                },
              },
            },
            userAgent: {
              type: 'string',
              nullable: true,
              description: 'User agent del navegador (opcional) / Browser user agent (optional)',
            },
          },
        },

        PushUnsubscribeRequest: {
          type: 'object',
          required: ['endpoint'],
          description: 'Solicitud de cancelación de push / Push unsubscription request',
          properties: {
            endpoint: {
              type: 'string',
              description: 'URL del endpoint push a cancelar / Push endpoint URL to remove',
            },
          },
        },

        VapidPublicKeyResponse: {
          type: 'object',
          description: 'Respuesta de clave pública VAPID / VAPID public key response',
          properties: {
            publicKey: {
              type: 'string',
              description: 'Clave pública VAPID para el cliente / VAPID public key for client',
            },
          },
        },

        // ============================================================
        // PUBLIC LANDING PAGES (Phase 6)
        // ============================================================
        ProductLanding: {
          type: 'object',
          description: 'Datos de landing page de producto / Product landing page data',
          properties: {
            product: {
              $ref: '#/components/schemas/Product',
            },
            affiliate: {
              type: 'object',
              nullable: true,
              properties: {
                referralCode: {
                  type: 'string',
                  description: 'Código de referido del afiliado / Affiliate referral code',
                },
                fullName: {
                  type: 'string',
                  description: 'Nombre del afiliado / Affiliate full name',
                },
              },
            },
          },
        },

        ProfileProducts: {
          type: 'object',
          description: 'Productos de perfil público / Public profile products',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            price: { type: 'number', format: 'float' },
            currency: { type: 'string', enum: ['USD', 'COP', 'MXN'] },
            platform: { type: 'string' },
            imageUrl: { type: 'string' },
          },
        },

        // ============================================================
        // GIFT CARDS (Sprint 2)
        // ============================================================
        GiftCard: {
          type: 'object',
          description: 'Gift card digital / Digital gift card',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único de la gift card / Unique gift card ID',
            },
            code: {
              type: 'string',
              description: 'Código único de la gift card / Unique gift card code',
            },
            qrCodeData: {
              type: 'string',
              nullable: true,
              description: 'Datos del código QR / QR code data',
            },
            balance: {
              type: 'number',
              format: 'float',
              description: 'Balance de la gift card / Gift card balance',
            },
            status: {
              type: 'string',
              enum: ['active', 'redeemed', 'expired'],
              description: 'Estado de la gift card / Gift card status',
            },
            isActive: {
              type: 'boolean',
              description: 'Indica si está activa / Indicates if active',
            },
            createdByUserId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del usuario que la creó / Creator user ID',
            },
            redeemedByUserId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'ID del usuario que la canjeó / Redeemer user ID',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de expiración / Expiration date',
            },
            redeemedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha de canje / Redemption date',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación / Creation date',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Última actualización / Last update',
            },
          },
        },

        GiftCardCreateRequest: {
          type: 'object',
          required: ['amount'],
          description: 'Solicitud para crear gift card / Gift card creation request',
          properties: {
            amount: {
              type: 'number',
              minimum: 0.01,
              description: 'Monto del balance / Balance amount',
            },
            expiresInDays: {
              type: 'integer',
              minimum: 1,
              maximum: 365,
              default: 30,
              description: 'Días hasta expiración / Days until expiration',
            },
          },
        },

        GiftCardRedeemRequest: {
          type: 'object',
          description: 'Solicitud para canjear gift card / Gift card redeem request',
          properties: {
            orderId: {
              type: 'string',
              format: 'uuid',
              description: 'ID de orden opcional a asociar / Optional order ID to associate',
            },
          },
        },

        GiftCardValidationResult: {
          type: 'object',
          description: 'Resultado de validación de gift card / Gift card validation result',
          properties: {
            valid: {
              type: 'boolean',
              description: 'Indica si la gift card es válida / Indicates if gift card is valid',
            },
            balance: {
              type: 'number',
              format: 'float',
              description: 'Balance disponible / Available balance',
            },
            status: {
              type: 'string',
              enum: ['active', 'redeemed', 'expired'],
              description: 'Estado actual / Current status',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de expiración / Expiration date',
            },
          },
        },

        GiftCardRedeemResponse: {
          type: 'object',
          description: 'Respuesta de canje de gift card / Gift card redeem response',
          properties: {
            id: { type: 'string', format: 'uuid' },
            giftCardId: {
              type: 'string',
              format: 'uuid',
              description: 'ID de la gift card canjeada / Redeemed gift card ID',
            },
            amountRedeemed: {
              type: 'number',
              format: 'float',
              description: 'Monto canjeado / Redeemed amount',
            },
            transactionType: {
              type: 'string',
              description: 'Tipo de transacción / Transaction type',
            },
            status: {
              type: 'string',
              description: 'Estado de la transacción / Transaction status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de la transacción / Transaction date',
            },
          },
        },

        PaginatedGiftCards: {
          type: 'object',
          description: 'Gift cards paginadas / Paginated gift cards',
          properties: {
            rows: {
              type: 'array',
              items: { $ref: '#/components/schemas/GiftCard' },
            },
            count: { type: 'integer', description: 'Total de gift cards / Total gift cards' },
          },
        },

        GiftCardQuery: {
          type: 'object',
          description: 'Parámetros de consulta de gift cards / Gift card query parameters',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            status: {
              type: 'string',
              enum: ['active', 'redeemed', 'expired', 'cancelled'],
              description: 'Filtrar por estado / Filter by status',
            },
          },
        },

        // ============================================================
        // CARTS & ABANDONED CART RECOVERY (Sprint 2)
        // ============================================================
        Cart: {
          type: 'object',
          description:
            'Carrito de compras con seguimiento de ciclo de vida / Shopping cart with lifecycle tracking',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del carrito / Unique cart ID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del usuario propietario / Owner user ID',
            },
            status: {
              type: 'string',
              enum: ['active', 'abandoned', 'recovered', 'checked_out', 'expired'],
              description: 'Estado del carrito / Cart status',
            },
            lastActivityAt: {
              type: 'string',
              format: 'date-time',
              description: 'Última actividad / Last activity',
            },
            abandonedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha de abandono / Abandonment date',
            },
            recoveredAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha de recuperación / Recovery date',
            },
            checkedOutAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha de checkout / Checkout date',
            },
            totalAmount: {
              type: 'number',
              format: 'float',
              description: 'Monto total del carrito / Cart total amount',
            },
            itemCount: {
              type: 'integer',
              description: 'Cantidad de items / Item count',
            },
            metadata: {
              type: 'object',
              description: 'Metadatos adicionales / Additional metadata',
            },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/CartItem' },
              description: 'Items del carrito / Cart items',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación / Creation date',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Última actualización / Last update',
            },
          },
        },

        CartItem: {
          type: 'object',
          description: 'Item del carrito / Cart item',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del item / Unique item ID',
            },
            cartId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del carrito / Cart ID',
            },
            productId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del producto / Product ID',
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              description: 'Cantidad / Quantity',
            },
            unitPrice: {
              type: 'number',
              format: 'float',
              description: 'Precio unitario / Unit price',
            },
            subtotal: {
              type: 'number',
              format: 'float',
              description: 'Subtotal del item / Item subtotal',
            },
            addedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha en que se agregó / Date added',
            },
            metadata: {
              type: 'object',
              description: 'Metadatos adicionales / Additional metadata',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación / Creation date',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Última actualización / Last update',
            },
          },
        },

        CartAddItemRequest: {
          type: 'object',
          required: ['productId', 'quantity'],
          description: 'Solicitud para agregar item al carrito / Add item to cart request',
          properties: {
            productId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del producto / Product ID',
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              description: 'Cantidad a agregar / Quantity to add',
            },
          },
        },

        CartUpdateQuantityRequest: {
          type: 'object',
          required: ['quantity'],
          description: 'Solicitud para actualizar cantidad / Update quantity request',
          properties: {
            quantity: {
              type: 'integer',
              minimum: 1,
              description: 'Nueva cantidad / New quantity',
            },
          },
        },

        CartRecoveryToken: {
          type: 'object',
          description:
            'Token de recuperación de carrito abandonado / Abandoned cart recovery token',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del token / Unique token ID',
            },
            cartId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del carrito asociado / Associated cart ID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del usuario / User ID',
            },
            tokenHash: {
              type: 'string',
              description: 'Hash bcrypt del token / Bcrypt hash of token',
            },
            status: {
              type: 'string',
              enum: ['pending', 'used', 'expired'],
              description: 'Estado del token / Token status',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de expiración / Expiration date',
            },
            usedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha de uso / Usage date',
            },
            emailSentAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha de envío de email / Email sent date',
            },
            clickCount: {
              type: 'integer',
              description: 'Cantidad de clics / Click count',
            },
            lastClickedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Último clic / Last click',
            },
            metadata: {
              type: 'object',
              description: 'Metadatos adicionales / Additional metadata',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación / Creation date',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Última actualización / Last update',
            },
          },
        },

        AbandonedCartsResponse: {
          type: 'object',
          description:
            'Respuesta de carritos abandonados con estadísticas / Abandoned carts response with stats',
          properties: {
            carts: {
              type: 'array',
              items: { $ref: '#/components/schemas/Cart' },
              description: 'Lista de carritos abandonados / Abandoned carts list',
            },
            stats: {
              type: 'object',
              properties: {
                totalAbandoned: {
                  type: 'integer',
                  description: 'Total de carritos abandonados / Total abandoned carts',
                },
                totalRecovered: {
                  type: 'integer',
                  description: 'Total de carritos recuperados / Total recovered carts',
                },
                recoveryRate: {
                  type: 'string',
                  description: 'Tasa de recuperación / Recovery rate',
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                limit: { type: 'integer' },
                offset: { type: 'integer' },
              },
            },
          },
        },

        // ============================================================
        // EMAIL TEMPLATES (Sprint 2)
        // ============================================================
        EmailTemplate: {
          type: 'object',
          description:
            'Template de email con soporte WYSIWYG / Email template with WYSIWYG support',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del template / Unique template ID',
            },
            createdByUserId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del usuario creador / Creator user ID',
            },
            name: {
              type: 'string',
              description: 'Nombre del template / Template name',
            },
            subjectLine: {
              type: 'string',
              description: 'Línea de asunto / Subject line',
            },
            htmlContent: {
              type: 'string',
              description: 'Contenido HTML / HTML content',
            },
            wysiwygState: {
              type: 'object',
              description: 'Estado del editor WYSIWYG / WYSIWYG editor state',
            },
            variablesUsed: {
              type: 'array',
              items: { type: 'string' },
              description: 'Variables utilizadas en el template / Variables used in template',
            },
            deletedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha de borrado suave / Soft delete date',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación / Creation date',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Última actualización / Last update',
            },
          },
        },

        EmailTemplateCreateRequest: {
          type: 'object',
          required: ['name', 'subjectLine', 'htmlContent'],
          description: 'Solicitud para crear template de email / Email template creation request',
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
              description: 'Nombre del template / Template name',
            },
            subjectLine: {
              type: 'string',
              minLength: 1,
              maxLength: 500,
              description: 'Línea de asunto / Subject line',
            },
            htmlContent: {
              type: 'string',
              minLength: 1,
              description: 'Contenido HTML / HTML content',
            },
            wysiwygState: {
              type: 'object',
              description: 'Estado del editor WYSIWYG (opcional) / WYSIWYG editor state (optional)',
            },
          },
        },

        PaginatedEmailTemplates: {
          type: 'object',
          description: 'Templates de email paginados / Paginated email templates',
          properties: {
            rows: {
              type: 'array',
              items: { $ref: '#/components/schemas/EmailTemplate' },
            },
            count: { type: 'integer', description: 'Total de templates / Total templates' },
          },
        },

        // ============================================================
        // EMAIL CAMPAIGNS (Sprint 2)
        // ============================================================
        EmailCampaign: {
          type: 'object',
          description:
            'Campaña de email con seguimiento de ciclo de vida / Email campaign with lifecycle tracking',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único de la campaña / Unique campaign ID',
            },
            createdByUserId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del usuario creador / Creator user ID',
            },
            emailTemplateId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del template de email / Email template ID',
            },
            name: {
              type: 'string',
              description: 'Nombre de la campaña / Campaign name',
            },
            status: {
              type: 'string',
              enum: ['draft', 'scheduled', 'sending', 'paused', 'completed', 'cancelled'],
              description: 'Estado de la campaña / Campaign status',
            },
            scheduledFor: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha programada de envío / Scheduled send date',
            },
            startedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha de inicio de envío / Send start date',
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha de completado / Completion date',
            },
            recipientSegment: {
              type: 'object',
              nullable: true,
              description: 'Segmento de destinatarios / Recipient segment filter',
            },
            recipientCount: {
              type: 'integer',
              description: 'Total de destinatarios / Total recipients',
            },
            sentCount: {
              type: 'integer',
              description: 'Emails enviados / Emails sent',
            },
            failedCount: {
              type: 'integer',
              description: 'Emails fallidos / Failed emails',
            },
            deferredCount: {
              type: 'integer',
              description: 'Emails diferidos / Deferred emails',
            },
            bounceCount: {
              type: 'integer',
              description: 'Emails rebotados / Bounced emails',
            },
            openCount: {
              type: 'integer',
              description: 'Aperturas / Opens',
            },
            clickCount: {
              type: 'integer',
              description: 'Clics / Clicks',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación / Creation date',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Última actualización / Last update',
            },
          },
        },

        EmailCampaignCreateRequest: {
          type: 'object',
          required: ['name', 'emailTemplateId'],
          description: 'Solicitud para crear campaña de email / Email campaign creation request',
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
              description: 'Nombre de la campaña / Campaign name',
            },
            emailTemplateId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del template de email / Email template ID',
            },
            recipientSegment: {
              type: 'object',
              description: 'Filtro de destinatarios (opcional) / Recipient filter (optional)',
            },
            scheduledFor: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de programación (opcional) / Schedule date (optional)',
            },
          },
        },

        EmailCampaignScheduleRequest: {
          type: 'object',
          required: ['scheduledFor'],
          description: 'Solicitud para programar campaña / Campaign schedule request',
          properties: {
            scheduledFor: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha futura para envío / Future date for sending',
            },
          },
        },

        EmailCampaignWithStats: {
          type: 'object',
          description:
            'Campaña de email con estadísticas de entrega / Email campaign with delivery stats',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            status: {
              type: 'string',
              enum: ['draft', 'scheduled', 'sending', 'paused', 'completed', 'cancelled'],
            },
            recipientCount: { type: 'integer' },
            stats: {
              type: 'object',
              properties: {
                sentCount: { type: 'integer' },
                failedCount: { type: 'integer' },
                deferredCount: { type: 'integer' },
                bounceCount: { type: 'integer' },
                openCount: { type: 'integer' },
                clickCount: { type: 'integer' },
                deliveryRate: {
                  type: 'string',
                  description: 'Tasa de entrega / Delivery rate',
                },
                openRate: {
                  type: 'string',
                  description: 'Tasa de apertura / Open rate',
                },
                clickRate: {
                  type: 'string',
                  description: 'Tasa de clics / Click rate',
                },
              },
            },
            scheduledFor: { type: 'string', format: 'date-time', nullable: true },
            startedAt: { type: 'string', format: 'date-time', nullable: true },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        EmailCampaignPreview: {
          type: 'object',
          description: 'Preview de email renderizado / Rendered email preview',
          properties: {
            subjectLine: {
              type: 'string',
              description: 'Asunto renderizado / Rendered subject',
            },
            htmlContent: {
              type: 'string',
              description: 'HTML renderizado / Rendered HTML',
            },
            previewFor: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'ID del usuario del preview / Preview user ID',
                },
              },
            },
          },
        },

        PaginatedEmailCampaigns: {
          type: 'object',
          description: 'Campañas de email paginadas / Paginated email campaigns',
          properties: {
            rows: {
              type: 'array',
              items: { $ref: '#/components/schemas/EmailCampaign' },
            },
            count: { type: 'integer', description: 'Total de campañas / Total campaigns' },
          },
        },

        CampaignRecipient: {
          type: 'object',
          description:
            'Destinatario de campaña con seguimiento individual / Campaign recipient with individual tracking',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del destinatario / Unique recipient ID',
            },
            campaignId: {
              type: 'string',
              format: 'uuid',
              description: 'ID de la campaña / Campaign ID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del usuario / User ID',
            },
            emailAddress: {
              type: 'string',
              format: 'email',
              description: 'Dirección de email / Email address',
            },
            status: {
              type: 'string',
              enum: ['pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'],
              description: 'Estado de entrega / Delivery status',
            },
            openedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha de apertura / Open date',
            },
            firstClickAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha del primer clic / First click date',
            },
            clickCount: {
              type: 'integer',
              description: 'Cantidad de clics / Click count',
            },
            sentAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha de envío / Send date',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación / Creation date',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Última actualización / Last update',
            },
          },
        },

        EmailQueue: {
          type: 'object',
          description:
            'Cola de envío de email con reintento exponencial / Email delivery queue with exponential backoff',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del item / Unique queue item ID',
            },
            campaignId: {
              type: 'string',
              format: 'uuid',
              description: 'ID de la campaña / Campaign ID',
            },
            campaignRecipientId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del destinatario de campaña / Campaign recipient ID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del usuario / User ID',
            },
            emailAddress: {
              type: 'string',
              format: 'email',
              description: 'Dirección de email / Email address',
            },
            subjectLine: {
              type: 'string',
              description: 'Línea de asunto / Subject line',
            },
            htmlContent: {
              type: 'string',
              description: 'Contenido HTML / HTML content',
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'sent', 'deferred', 'failed'],
              description: 'Estado del envío / Send status',
            },
            retryCount: {
              type: 'integer',
              description: 'Cantidad de reintentos / Retry count',
            },
            nextRetryAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Próximo reintento / Next retry',
            },
            lastError: {
              type: 'string',
              nullable: true,
              description: 'Último error / Last error',
            },
            brevoMessageId: {
              type: 'string',
              nullable: true,
              description: 'ID de mensaje Brevo / Brevo message ID',
            },
            brevoResponse: {
              type: 'object',
              nullable: true,
              description: 'Respuesta de Brevo / Brevo response',
            },
            processedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha de procesamiento / Processing date',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación / Creation date',
            },
          },
        },

        EmailCampaignLog: {
          type: 'object',
          description: 'Log de auditoría de campaña / Campaign audit log entry',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del log / Unique log ID',
            },
            campaignId: {
              type: 'string',
              format: 'uuid',
              description: 'ID de la campaña / Campaign ID',
            },
            campaignRecipientId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'ID del destinatario (opcional) / Recipient ID (optional)',
            },
            eventType: {
              type: 'string',
              description: 'Tipo de evento / Event type',
            },
            eventTimestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp del evento / Event timestamp',
            },
            details: {
              type: 'object',
              description: 'Detalles del evento / Event details',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación / Creation date',
            },
          },
        },

        PaginatedCampaignLogs: {
          type: 'object',
          description: 'Logs de campaña paginados / Paginated campaign logs',
          properties: {
            rows: {
              type: 'array',
              items: { $ref: '#/components/schemas/EmailCampaignLog' },
            },
            count: { type: 'integer', description: 'Total de logs / Total logs' },
          },
        },

        // ============================================================
        // PROPERTIES / PROPIEDADES (Sprint 5)
        // ============================================================
        Property: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', description: 'Property title / Título de la propiedad' },
            description: { type: 'string', nullable: true },
            type: {
              type: 'string',
              enum: ['rental', 'sale', 'management'],
              description: 'Property type / Tipo de propiedad',
            },
            status: { type: 'string', enum: ['active', 'inactive', 'sold', 'rented'] },
            price: { type: 'number', description: 'Price in USD / Precio en USD' },
            city: { type: 'string' },
            address: { type: 'string', nullable: true },
            bedrooms: { type: 'integer', nullable: true },
            bathrooms: { type: 'integer', nullable: true },
            area: { type: 'number', nullable: true, description: 'Area in m² / Área en m²' },
            images: {
              type: 'array',
              items: { type: 'string' },
              description: 'Image URLs / URLs de imágenes',
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ============================================================
        // TOUR PACKAGES / PAQUETES TURÍSTICOS (Sprint 5)
        // ============================================================
        TourPackage: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', description: 'Tour name / Nombre del tour' },
            description: { type: 'string', nullable: true },
            category: {
              type: 'string',
              enum: [
                'adventure',
                'cultural',
                'beach',
                'mountain',
                'city',
                'eco',
                'luxury',
                'family',
              ],
            },
            status: { type: 'string', enum: ['active', 'inactive', 'sold_out'] },
            price: { type: 'number' },
            duration: { type: 'integer', description: 'Duration in days / Duración en días' },
            maxCapacity: { type: 'integer' },
            images: { type: 'array', items: { type: 'string' } },
            itinerary: { type: 'array', items: { type: 'object' }, nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ============================================================
        // RESERVATIONS / RESERVAS (Sprint 5)
        // ============================================================
        Reservation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            reservableType: {
              type: 'string',
              enum: ['property', 'tour'],
              description: 'Type of reservable item / Tipo de elemento reservable',
            },
            reservableId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            guests: { type: 'integer' },
            totalPrice: { type: 'number' },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ============================================================
        // BOT SCHEMAS (Sprint 6)
        // ============================================================
        BotProperty: {
          type: 'object',
          description:
            'Simplified property for Nexo Bot responses / Propiedad simplificada para respuestas del Nexo Bot',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Property ID / ID de la propiedad' },
            type: {
              type: 'string',
              enum: ['rental', 'sale', 'management'],
              description: 'Property type / Tipo de propiedad',
            },
            title: { type: 'string', description: 'Listing title / Título del listado' },
            price: { type: 'number', description: 'Listing price / Precio del listado' },
            currency: {
              type: 'string',
              example: 'USD',
              description: 'Price currency / Moneda del precio',
            },
            city: {
              type: 'string',
              description: 'City where the property is located / Ciudad donde está la propiedad',
            },
            bedrooms: {
              type: 'integer',
              nullable: true,
              description: 'Number of bedrooms / Número de habitaciones',
            },
            bathrooms: {
              type: 'integer',
              nullable: true,
              description: 'Number of bathrooms / Número de baños',
            },
            areaM2: {
              type: 'number',
              nullable: true,
              description: 'Area in square meters / Área en metros cuadrados',
            },
          },
        },

        BotTour: {
          type: 'object',
          description:
            'Simplified tour package for Nexo Bot responses / Paquete turístico simplificado para respuestas del Nexo Bot',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Tour package ID / ID del paquete turístico',
            },
            type: {
              type: 'string',
              description: 'Tour type (adventure, cultural, etc.) / Tipo de tour',
            },
            title: { type: 'string', description: 'Package title / Título del paquete' },
            destination: {
              type: 'string',
              description: 'Main destination / Destino principal',
            },
            price: { type: 'number', description: 'Package price / Precio del paquete' },
            currency: {
              type: 'string',
              example: 'USD',
              description: 'Price currency / Moneda del precio',
            },
            durationDays: {
              type: 'integer',
              description: 'Duration in days / Duración en días',
            },
            maxCapacity: {
              type: 'integer',
              description: 'Maximum passenger capacity / Capacidad máxima de pasajeros',
            },
          },
        },
      },
    },

    // ============================================================
    // TAGS / ETIQUETAS
    // ============================================================
    tags: [
      { name: 'auth', description: 'Autenticación / Authentication - Login, register, tokens' },
      {
        name: '2fa',
        description:
          'Two-Factor Authentication / Autenticación de Dos Factores - TOTP setup, verify, disable',
      },
      {
        name: 'users',
        description: 'Gestión de usuarios / User Management - Profile, tree, search (Phase 3)',
      },
      { name: 'dashboard', description: 'Dashboard y estadísticas / Dashboard & Stats' },
      { name: 'commissions', description: 'Comisiones / Commissions - Earnings, history, stats' },
      {
        name: 'admin',
        description: 'Operaciones de administrador / Admin Operations - User management, reports',
      },
      {
        name: 'crm',
        description: 'CRM - Leads, tasks, communications / Leads, tareas, comunicaciones',
      },
      {
        name: 'products',
        description: 'Productos / Products - Streaming subscriptions, e-commerce products',
      },
      {
        name: 'orders',
        description: 'Pedidos / Orders - Order management and history',
      },
      {
        name: 'push',
        description:
          'Push Notifications / Notificaciones Push - Subscribe, unsubscribe, VAPID key (Phase 6)',
      },
      {
        name: 'public',
        description: 'Public Endpoints / Endpoints Públicos - Landing pages, profiles (Phase 6)',
      },
      {
        name: 'gift-cards',
        description:
          'Gift Cards / Tarjetas de Regalo - CRUD, validación, canje, balance (Sprint 2)',
      },
      {
        name: 'carts',
        description: 'Carritos / Shopping Carts - Cart CRUD, abandoned cart recovery (Sprint 2)',
      },
      {
        name: 'email-templates',
        description:
          'Templates de Email / Email Templates - CRUD de templates con soporte WYSIWYG (Sprint 2)',
      },
      {
        name: 'email-campaigns',
        description:
          'Campañas de Email / Email Campaigns - Envío, programación, estadísticas, logs (Sprint 2)',
      },
      {
        name: 'bot',
        description:
          'Nexo Bot API / API del Nexo Bot - Endpoints para el bot de WhatsApp: propiedades y tours (Sprint 6)',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

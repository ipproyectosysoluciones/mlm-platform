import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Swagger/OpenAPI Configuration for MLM Binary Affiliations API
 * Configuración Swagger/OpenAPI para la API MLM de Afiliaciones Binarias
 *
 * Phase 1 (v1.0): MVP - Auth, Tree, Commissions, CRM, RBAC ✅
 * Phase 2: Cancelado - Email & SMS Notifications ❌
 * Phase 3 (v1.1): Visual Tree UI - React Flow, búsqueda, panel de detalles ✅
 * Phase 4 (v1.2): E-commerce - Products, Orders, Streaming subscriptions ✅
 * Phase 5 (v1.3): Deployment - Docker, CI/CD, PostgreSQL, documentation ✅
 * Phase 6 (v1.4): Wallet & Payments - Balance, withdrawals, Stripe/PayPal (en desarrollo)
 * Phase 7 (v2.0): Enterprise - White-label, SSO, KYC, advanced commissions
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MLM Binary Affiliations API',
      version: '1.3.0',
      description: `
## API REST para plataforma MLM de Afiliaciones Binarias

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

### Fases / Phases
- **Phase 1** (v1.0.0): MVP - Auth, Tree, Commissions, CRM, RBAC ✅
- **Phase 2** (cancelado): Email & SMS Notifications ❌
- **Phase 3** (v1.1.0): Visual Tree UI - React Flow, búsqueda, panel de detalles ✅
- **Phase 4** (v1.2.0): E-commerce - Products, Orders, Streaming subscriptions ✅
- **Phase 5** (v1.3.0): Deployment - Docker, CI/CD, PostgreSQL ✅
- **Phase 6** (v1.4.0): Wallet & Payments - Balance, withdrawals, Stripe (en desarrollo)
- **Phase 7** (v2.0.0): Enterprise - White-label, SSO, KYC, advanced commissions
      `,
      contact: {
        name: 'MLM Support',
        email: 'support@mlm-platform.com',
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
        // 2FA / AUTENTICACIÓN DE DOS FACTORES (Phase 7 - v2.0)
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
              enum: ['user', 'admin'],
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
          description: 'Nodo del árbol binario / Binary tree node',
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
              enum: ['left', 'right'],
              description: 'Posición en el árbol (pierna) / Position in tree (leg)',
            },
            level: { type: 'integer', description: 'Nivel en el árbol / Level in tree' },
            stats: {
              type: 'object',
              description: 'Estadísticas del nodo / Node statistics',
              properties: {
                leftCount: {
                  type: 'integer',
                  description: 'Cantidad de miembros en pierna izquierda / Members in left leg',
                },
                rightCount: {
                  type: 'integer',
                  description: 'Cantidad de miembros en pierna derecha / Members in right leg',
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
          description: 'Respuesta del árbol con estadísticas / Tree response with stats',
          properties: {
            tree: { $ref: '#/components/schemas/TreeNode' },
            stats: {
              type: 'object',
              properties: {
                leftCount: { type: 'integer' },
                rightCount: { type: 'integer' },
                leftVolume: {
                  type: 'integer',
                  description: 'Volumen pierna izquierda (count * 100) / Left leg volume',
                },
                rightVolume: {
                  type: 'integer',
                  description: 'Volumen pierna derecha (count * 100) / Right leg volume',
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
          description: 'Estadísticas del usuario en el árbol / User stats in tree (Phase 3)',
          properties: {
            leftCount: {
              type: 'integer',
              description: 'Miembros en pierna izquierda / Members in left leg',
            },
            rightCount: {
              type: 'integer',
              description: 'Miembros en pierna derecha / Members in right leg',
            },
            totalDownline: { type: 'integer', description: 'Total downline / Total downline' },
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
            position: { type: 'string', enum: ['left', 'right'] },
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
            leftCount: {
              type: 'integer',
              description: 'Miembros pierna izquierda / Left leg members',
            },
            rightCount: {
              type: 'integer',
              description: 'Miembros pierna derecha / Right leg members',
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
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MLM Binary Affiliations API',
      version: '1.0.0',
      description: `
## API REST para plataforma MLM de Afiliaciones Binarias

### Autenticación / Authentication
Esta API usa JWT Bearer tokens. Incluye el token en el header:
\`Authorization: Bearer <tu_token>\`

### Códigos de Estado / Status Codes
- \`200\` - Éxito
- \`201\` - Creado
- \`400\` - Error de validación
- \`401\` - No autenticado
- \`403\` - Acceso denegado
- \`404\` - No encontrado
- \`429\` - Rate limit excedido
      `,
      contact: {
        name: 'MLM Support',
        email: 'support@mlm-platform.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor de Desarrollo / Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /auth/login or /auth/register'
        }
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', description: 'Response data / Datos de respuesta' },
            error: { 
              oneOf: [
                { type: 'string' },
                { 
                  type: 'object',
                  properties: {
                    code: { type: 'string' },
                    message: { type: 'string' }
                  }
                }
              ]
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            referralCode: { type: 'string', example: 'MLM-XXXX-XXXX' },
            level: { type: 'integer', minimum: 1 },
            currency: { type: 'string', enum: ['USD', 'COP', 'MXN'] },
            role: { type: 'string', enum: ['user', 'admin'] },
            status: { type: 'string', enum: ['active', 'inactive'] }
          }
        },
        AuthToken: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            token: { type: 'string' }
          }
        },
        TreeNode: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            referralCode: { type: 'string' },
            level: { type: 'integer' },
            children: { 
              type: 'array',
              items: { $ref: '#/components/schemas/TreeNode' }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' }
          }
        }
      }
    },
    tags: [
      { name: 'auth', description: 'Autenticación / Authentication' },
      { name: 'users', description: 'Gestión de usuarios / User Management' },
      { name: 'dashboard', description: 'Dashboard y estadísticas / Dashboard & Stats' },
      { name: 'admin', description: 'Operaciones de administrador / Admin Operations' },
      { name: 'commissions', description: 'Comisiones / Commissions' }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);

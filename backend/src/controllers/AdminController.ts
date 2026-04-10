/**
 * @fileoverview AdminController - Administrative operations and platform statistics
 * @description Handles admin-only operations including global statistics, user management,
 *              and platform-wide commission/purchase tracking.
 *              Gestiona operaciones solo de administrador incluyendo estadísticas globales,
 *              gestión de usuarios y seguimiento de comisiones/compras de toda la plataforma.
 * @module controllers/AdminController
 * @author MLM Development Team
 *
 * @note This file is now a barrel export that re-exports from sub-controllers
 * @note Este archivo ahora es un barrel export que re-exporta desde sub-controladores
 */

// Re-export from sub-controllers
export { getGlobalStats, getCommissionsReport } from './admin/StatsController';
export {
  getAllUsers,
  getUserById,
  updateUserStatus,
  promoteToAdmin,
  updateUserRole,
} from './admin/UsersAdminController';

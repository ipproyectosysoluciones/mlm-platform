/**
 * @fileoverview Routes barrel - Application route composition
 * @description Composes all domain route definitions (auth, landing, member, admin,
 *              e-commerce, real estate and error routes) into a single AppRoutes component.
 *              Compone todas las definiciones de rutas por dominio (auth, landing, member,
 *              admin, e-commerce, real estate y error) en un único componente AppRoutes.
 * @module routes/index
 */

import { AuthRoutes } from './auth.routes';
import { LandingRoutes } from './landing.routes';
import { MemberRoutes } from './member.routes';
import { AdminRoutes } from './admin.routes';
import { EcommerceRoutes } from './ecommerce.routes';
import { RealEstateRoutes } from './real-estate.routes';
import { ErrorRoutes } from './error.routes';

export function AppRoutes() {
  return (
    <>
      <AuthRoutes />
      <LandingRoutes />
      <MemberRoutes />
      <AdminRoutes />
      <EcommerceRoutes />
      <RealEstateRoutes />
      <ErrorRoutes />
    </>
  );
}

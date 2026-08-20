/**
 * @fileoverview Routes barrel - Application route composition
 * @description Composes all domain route definitions (auth, landing, member, admin,
 *              e-commerce, real estate and error routes) into a single appRoutes
 *              fragment consumed directly by <Routes>.
 *              Compone todas las definiciones de rutas por dominio (auth, landing, member,
 *              admin, e-commerce, real estate y error) en un único fragment appRoutes
 *              consumido directamente por <Routes>.
 * @module routes/index
 */

import { authRoutes } from './auth.routes';
import { landingRoutes } from './landing.routes';
import { memberRoutes } from './member.routes';
import { adminRoutes } from './admin.routes';
import { ecommerceRoutes } from './ecommerce.routes';
import { realEstateRoutes } from './real-estate.routes';
import { errorRoutes } from './error.routes';

/**
 * Application routes composed from domain fragments.
 * React Router v7 requires <Routes> children to be <Route> or <React.Fragment>
 * elements, so routes are composed as fragments instead of component indirection.
 */
export const appRoutes = (
  <>
    {authRoutes}
    {landingRoutes}
    {memberRoutes}
    {adminRoutes}
    {ecommerceRoutes}
    {realEstateRoutes}
    {errorRoutes}
  </>
);

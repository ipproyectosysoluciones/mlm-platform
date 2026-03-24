/**
 * @fileoverview LandingPageService - Landing page management
 * @description Manages landing pages for marketing campaigns including CRUD operations,
 *              analytics tracking (views, conversions), and template management.
 *              Gestiona páginas de destino para campañas de marketing incluyendo
 *              operaciones CRUD, seguimiento analítico y gestión de plantillas.
 * @module services/LandingPageService
 * @author MLM Development Team
 *
 * @example
 * // English: Create a landing page
 * const page = await landingPageService.create({ userId, title, template, content });
 *
 * // English: Get page stats
 * const stats = await landingPageService.getStats(userId);
 *
 * // Español: Crear una landing page
 * const page = await landingPageService.create({ userId, title, template, content });
 *
 * // Español: Obtener estadísticas de página
 * const stats = await landingPageService.getStats(userId);
 */
import { LandingPage, User } from '../models';
import type { LandingPageContent, LandingPageTemplate } from '../models/LandingPage';

/**
 * Input for creating a new landing page
 * Input para crear una nueva landing page
 */
interface CreateLandingPageInput {
  userId: string;
  title: string;
  description?: string;
  template: LandingPageTemplate;
  content: LandingPageContent;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
}

/**
 * Input for updating a landing page
 * Input para actualizar una landing page
 */
interface UpdateLandingPageInput {
  title?: string;
  description?: string;
  template?: LandingPageTemplate;
  content?: Partial<LandingPageContent>;
  metaTitle?: string;
  metaDescription?: string;
  isActive?: boolean;
}

/**
 * Filter options for landing page queries
 * Opciones de filtro para consultas de landing pages
 */
interface LandingPageFilters {
  userId?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50) +
    '-' +
    Date.now().toString(36)
  );
}

/**
 * Landing Page Service - Marketing campaign page management
 * Servicio de Landing Pages - Gestión de páginas de campañas de marketing
 */
export class LandingPageService {
  /**
   * Create a new landing page
   * Crear una nueva landing page
   * @param {CreateLandingPageInput} input - Page creation data / Datos de creación de página
   * @returns {Promise<LandingPage>} Created landing page / Landing page creada
   * @throws {Error} If slug already exists / Si el slug ya existe
   * @example
   * // English: Create a new landing page
   * const page = await landingPageService.create({
   *   userId: 'user-123',
   *   title: 'Summer Sale 2024',
   *   template: 'promo',
   *   content: { heroTitle: 'Summer Sale!', ctaText: 'Sign Up Now' }
   * });
   *
   * // Español: Crear una nueva landing page
   * const page = await landingPageService.create({
   *   userId: 'usuario-123',
   *   title: 'Oferta de Verano 2024',
   *   template: 'promo',
   *   content: { heroTitle: '¡Oferta de Verano!', ctaText: 'Regístrate Ahora' }
   * });
   */
  async create(input: CreateLandingPageInput): Promise<LandingPage> {
    const slug = input.slug || generateSlug(input.title);

    const existing = await LandingPage.findOne({ where: { slug } });
    if (existing) {
      throw new Error('Slug already exists');
    }

    const now = new Date();
    return LandingPage.create({
      userId: input.userId,
      slug,
      title: input.title,
      description: input.description || null,
      template: input.template,
      content: input.content,
      metaTitle: input.metaTitle || input.title,
      metaDescription: input.metaDescription || input.description || null,
      isActive: true,
      views: 0,
      conversions: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Find landing page by ID
   * Buscar landing page por ID
   * @param {string} id - Page ID / ID de la página
   * @returns {Promise<LandingPage | null>} Landing page or null / Landing page o null
   */
  async findById(id: string): Promise<LandingPage | null> {
    return LandingPage.findByPk(id);
  }

  /**
   * Find landing page by slug (public endpoint)
   * Buscar landing page por slug (endpoint público)
   * @param {string} slug - URL-friendly slug / Slug amigable para URL
   * @returns {Promise<LandingPage | null>} Landing page with owner info / Landing page con info del propietario
   */
  async findBySlug(slug: string): Promise<LandingPage | null> {
    return LandingPage.findOne({
      where: { slug, isActive: true },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'referralCode', 'email'],
        },
      ],
    });
  }

  /**
   * Find all landing pages for a user
   * Buscar todas las landing pages de un usuario
   * @param {string} userId - User ID / ID del usuario
   * @param {number} [limit=20] - Maximum results / Máximo de resultados
   * @param {number} [offset=0] - Results to skip / Resultados a omitir
   * @returns {Promise<LandingPage[]>} List of user's landing pages / Lista de landing pages del usuario
   */
  async findByUserId(userId: string, limit = 20, offset = 0): Promise<LandingPage[]> {
    return LandingPage.findAll({
      where: { userId },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Find multiple landing pages with filters
   * Buscar múltiples landing pages con filtros
   * @param {LandingPageFilters} filters - Filter options / Opciones de filtro
   * @returns {Promise<{pages: LandingPage[], total: number}>} Paginated results / Resultados paginados
   */
  async findMany(filters: LandingPageFilters): Promise<{ pages: LandingPage[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const [pages, total] = await Promise.all([
      LandingPage.findAll({
        where,
        limit: filters.limit || 20,
        offset: filters.offset || 0,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'referralCode', 'firstName', 'lastName'],
          },
        ],
      }),
      LandingPage.count({ where }),
    ]);

    return { pages, total };
  }

  /**
   * Update a landing page
   * Actualizar una landing page
   * @param {string} id - Page ID / ID de la página
   * @param {UpdateLandingPageInput} input - Update data / Datos de actualización
   * @returns {Promise<LandingPage | null>} Updated page / Página actualizada
   */
  async update(id: string, input: UpdateLandingPageInput): Promise<LandingPage | null> {
    const page = await LandingPage.findByPk(id);
    if (!page) return null;

    if (input.content) {
      input.content = { ...page.content, ...input.content } as LandingPageContent;
    }

    await page.update(input as Record<string, unknown>);
    return page.reload();
  }

  /**
   * Increment page view count
   * Incrementar contador de vistas de página
   * @param {string} id - Page ID / ID de la página
   * @returns {Promise<void>} Resolves when complete / Se resuelve al completar
   */
  async incrementViews(id: string): Promise<void> {
    await LandingPage.increment('views', { where: { id } });
  }

  /**
   * Increment page conversion count
   * Incrementar contador de conversiones de página
   * @param {string} id - Page ID / ID de la página
   * @returns {Promise<void>} Resolves when complete / Se resuelve al completar
   */
  async incrementConversions(id: string): Promise<void> {
    await LandingPage.increment('conversions', { where: { id } });
  }

  /**
   * Delete a landing page
   * Eliminar una landing page
   * @param {string} id - Page ID / ID de la página
   * @returns {Promise<boolean>} True if deleted / True si fue eliminada
   */
  async delete(id: string): Promise<boolean> {
    const deleted = await LandingPage.destroy({ where: { id } });
    return deleted > 0;
  }

  /**
   * Get aggregate statistics for user's landing pages
   * Obtener estadísticas agregadas de las landing pages del usuario
   * @param {string} userId - User ID / ID del usuario
   * @returns {Promise<Object>} Statistics including totals and conversion rate / Estadísticas incluyendo totales y tasa de conversión
   * @example
   * // English: Get page stats
   * const stats = await landingPageService.getStats(userId);
   * console.log(`Conversion rate: ${stats.conversionRate.toFixed(2)}%`);
   *
   * // Español: Obtener estadísticas de páginas
   * const stats = await landingPageService.getStats(userId);
   * console.log(`Tasa de conversión: ${stats.conversionRate.toFixed(2)}%`);
   */
  async getStats(userId: string): Promise<{
    totalPages: number;
    activePages: number;
    totalViews: number;
    totalConversions: number;
    conversionRate: number;
  }> {
    const pages = await LandingPage.findAll({
      where: { userId },
      attributes: ['isActive', 'views', 'conversions'],
    });

    const totalPages = pages.length;
    const activePages = pages.filter((p) => p.isActive).length;
    const totalViews = pages.reduce((sum, p) => sum + p.views, 0);
    const totalConversions = pages.reduce((sum, p) => sum + p.conversions, 0);
    const conversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;

    return {
      totalPages,
      activePages,
      totalViews,
      totalConversions,
      conversionRate,
    };
  }
}

export const landingPageService = new LandingPageService();

import { LandingPage, User } from '../models';
import type { LandingPageContent, LandingPageTemplate } from '../models/LandingPage';

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

interface UpdateLandingPageInput {
  title?: string;
  description?: string;
  template?: LandingPageTemplate;
  content?: Partial<LandingPageContent>;
  metaTitle?: string;
  metaDescription?: string;
  isActive?: boolean;
}

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

export class LandingPageService {
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

  async findById(id: string): Promise<LandingPage | null> {
    return LandingPage.findByPk(id);
  }

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

  async findByUserId(userId: string, limit = 20, offset = 0): Promise<LandingPage[]> {
    return LandingPage.findAll({
      where: { userId },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
  }

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

  async update(id: string, input: UpdateLandingPageInput): Promise<LandingPage | null> {
    const page = await LandingPage.findByPk(id);
    if (!page) return null;

    if (input.content) {
      input.content = { ...page.content, ...input.content } as LandingPageContent;
    }

    await page.update(input as Record<string, unknown>);
    return page.reload();
  }

  async incrementViews(id: string): Promise<void> {
    await LandingPage.increment('views', { where: { id } });
  }

  async incrementConversions(id: string): Promise<void> {
    await LandingPage.increment('conversions', { where: { id } });
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await LandingPage.destroy({ where: { id } });
    return deleted > 0;
  }

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

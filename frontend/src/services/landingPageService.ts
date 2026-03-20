import api from './api';

export type LandingPageTemplate = 'hero' | 'video' | 'testimonial' | 'minimal' | 'gradient';

export interface LandingPageContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaColor: string;
  backgroundColor: string;
  textColor: string;
  showReferralCode: boolean;
  showStats: boolean;
  videoUrl?: string;
  testimonialText?: string;
  testimonialAuthor?: string;
  features?: string[];
  backgroundImage?: string;
}

export interface LandingPage {
  id: string;
  userId: string;
  slug: string;
  title: string;
  description: string | null;
  template: LandingPageTemplate;
  content: LandingPageContent;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean;
  views: number;
  conversions: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    referralCode: string;
    firstName: string;
    lastName: string;
  };
}

export interface LandingPageStats {
  totalPages: number;
  activePages: number;
  totalViews: number;
  totalConversions: number;
  conversionRate: number;
}

export interface CreateLandingPageInput {
  title: string;
  slug?: string;
  template: LandingPageTemplate;
  content: LandingPageContent;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateLandingPageInput {
  title?: string;
  template?: LandingPageTemplate;
  content?: Partial<LandingPageContent>;
  metaTitle?: string;
  metaDescription?: string;
  isActive?: boolean;
}

export const landingPageService = {
  async create(input: CreateLandingPageInput): Promise<LandingPage> {
    const { data } = await api.post('/landing', input);
    return data.data;
  },

  async getMyPages(limit = 20, offset = 0): Promise<LandingPage[]> {
    const { data } = await api.get('/landing', { params: { limit, offset } });
    return data.data;
  },

  async getStats(): Promise<LandingPageStats> {
    const { data } = await api.get('/landing/stats');
    return data.data;
  },

  async getById(id: string): Promise<LandingPage> {
    const { data } = await api.get(`/landing/${id}`);
    return data.data;
  },

  async update(id: string, input: UpdateLandingPageInput): Promise<LandingPage> {
    const { data } = await api.put(`/landing/${id}`, input);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/landing/${id}`);
  },

  async getBySlug(slug: string): Promise<LandingPage> {
    const { data } = await api.get(`/public/landing/${slug}`);
    return data.data;
  },

  async trackConversion(slug: string): Promise<void> {
    await api.post(`/public/landing/${slug}/convert`);
  },
};

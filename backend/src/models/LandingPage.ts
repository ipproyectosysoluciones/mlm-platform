import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

interface LandingPageAttributes {
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
  createdAt: Date;
  updatedAt: Date;
}

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

class LandingPage extends Model<LandingPageAttributes> implements LandingPageAttributes {
  declare id: string;
  declare userId: string;
  declare slug: string;
  declare title: string;
  declare description: string | null;
  declare template: LandingPageTemplate;
  declare content: LandingPageContent;
  declare metaTitle: string | null;
  declare metaDescription: string | null;
  declare isActive: boolean;
  declare views: number;
  declare conversions: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

LandingPage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    template: {
      type: DataTypes.ENUM('hero', 'video', 'testimonial', 'minimal', 'gradient'),
      allowNull: false,
      defaultValue: 'hero',
    },
    content: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        headline: '',
        subheadline: '',
        ctaText: 'Registrarse Ahora',
        ctaColor: '#4F46E5',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        showReferralCode: true,
        showStats: true,
      },
    },
    metaTitle: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    metaDescription: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    conversions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'landing_pages',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['slug'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['isActive'],
      },
    ],
  }
);

export { LandingPage };

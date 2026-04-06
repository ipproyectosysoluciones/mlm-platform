import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'profile' | 'article';
  siteName?: string;
}

const DEFAULT_SEO: SEOProps = {
  title: 'Nexo Real - Plataforma de Afiliaciones',
  description:
    'Nexo Real — Conectamos tu negocio con el mundo. Sistema de afiliaciones binarias, comisiones automáticas y árbol genealógico.',
  image: '/og-image.png',
  type: 'website',
  siteName: 'Nexo Real',
};

export function useSEO(props: SEOProps = {}) {
  const location = useLocation();
  const seo = { ...DEFAULT_SEO, ...props };
  const url = seo.url || `https://nexoreal.com${location.pathname}`; // TODO: domain pending

  useEffect(() => {
    document.title = seo.title || DEFAULT_SEO.title || 'Nexo Real';

    const metaTags = [
      { name: 'description', content: seo.description },
      { property: 'og:title', content: seo.title },
      { property: 'og:description', content: seo.description },
      { property: 'og:type', content: seo.type },
      { property: 'og:url', content: url },
      { property: 'og:image', content: seo.image },
      { property: 'og:site_name', content: seo.siteName },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: seo.title },
      { name: 'twitter:description', content: seo.description },
      { name: 'twitter:image', content: seo.image },
    ];

    metaTags.forEach(({ name, property, content }) => {
      if (!content) return;

      const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;

      let element = document.querySelector(selector);
      if (element) {
        element.setAttribute('content', content);
      } else {
        element = document.createElement('meta');
        if (property) element.setAttribute('property', property);
        else element.setAttribute('name', name!);
        element.setAttribute('content', content);
        document.head.appendChild(element);
      }
    });

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', url);
    } else {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', url);
      document.head.appendChild(canonical);
    }
  }, [seo.title, seo.description, seo.image, url, seo.type, seo.siteName]);
}

export function useProfileSEO(user: { referralCode: string; level?: number; levelName?: string }) {
  useSEO({
    title: `${user.referralCode} - Nexo Real Affiliate`,
    description: `Únete al equipo de ${user.referralCode}. Nivel ${user.level || 1} - ${user.levelName || 'Starter'}. Afiliaciones binarias con comisiones automáticas.`,
    type: 'profile',
  });
}

import { useEffect, useState } from 'react';
import api from '../services/api';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  priority: string;
}

function generateSitemapXML(urls: SitemapUrl[]): string {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  const footer = '</urlset>';

  const urlElements = urls
    .map(
      (url) => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <priority>${url.priority}</priority>
  </url>`
    )
    .join('');

  return header + urlElements + footer;
}

function useSitemap() {
  const [sitemap, setSitemap] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateSitemap = async () => {
    setIsLoading(true);
    try {
      const baseUrl = window.location.origin;
      const today = new Date().toISOString().split('T')[0];

      const urls: SitemapUrl[] = [
        { loc: `${baseUrl}/`, lastmod: today, priority: '1.0' },
        { loc: `${baseUrl}/register`, lastmod: today, priority: '0.8' },
        { loc: `${baseUrl}/login`, lastmod: today, priority: '0.6' },
      ];

      // Fetch user profiles for sitemap
      try {
        const { data } = await api.get('/sitemap/users');
        if (data.success && data.data) {
          data.data.forEach((user: { referralCode: string; updatedAt: string }) => {
            urls.push({
              loc: `${baseUrl}/ref/${user.referralCode}`,
              lastmod: user.updatedAt || today,
              priority: '0.7',
            });
          });
        }
      } catch {
        // If endpoint doesn't exist yet, just use static URLs
      }

      setSitemap(generateSitemapXML(urls));
    } catch (error) {
      console.error('Failed to generate sitemap:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { sitemap, isLoading, generateSitemap };
}

export function SitemapXML() {
  const { sitemap, isLoading, generateSitemap } = useSitemap();

  useEffect(() => {
    generateSitemap();
  }, []);

  if (isLoading) return <p>Generating sitemap...</p>;

  return <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">{sitemap}</pre>;
}

export default SitemapXML;

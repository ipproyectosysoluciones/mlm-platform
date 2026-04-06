/**
 * @fileoverview ProductLanding - Landing page for products with referral support
 * @description Public landing page component for displaying product details with affiliate referral
 * @module pages/ProductLanding
 */

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { Product } from '../types';

/**
 * Product landing page data from the API
 */
interface ProductLandingData {
  product: Product;
  affiliate?: {
    referralCode: string;
    fullName: string;
  };
}

/**
 * SEO metadata for the product
 */
interface ProductMeta {
  title: string;
  description: string;
  ogImage?: string;
}

/**
 * Platform display names and icons
 */
const platformInfo: Record<string, { name: string; color: string; icon: string }> = {
  netflix: { name: 'Netflix', color: '#E50914', icon: '🎬' },
  disney_plus: { name: 'Disney+', color: '#113CCF', icon: '🏰' },
  spotify: { name: 'Spotify', color: '#1DB954', icon: '🎵' },
  hbo_max: { name: 'HBO Max', color: '#5822B4', icon: '🎥' },
  amazon_prime: { name: 'Amazon Prime', color: '#00A8E1', icon: '📦' },
  youtube_premium: { name: 'YouTube Premium', color: '#FF0000', icon: '▶️' },
  apple_tv_plus: { name: 'Apple TV+', color: '#000000', icon: '🍎' },
};

/**
 * Platform icons for display
 */
function PlatformIcon({ platform }: { platform: string }) {
  const info = platformInfo[platform];
  return (
    <span className="text-2xl" title={info?.name || platform}>
      {info?.icon || '📱'}
    </span>
  );
}

/**
 * Format price with currency
 */
function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(price);
}

/**
 * Format duration in days to human readable
 */
function formatDuration(days: number): string {
  if (days === 30) return '1 mes';
  if (days === 90) return '3 meses';
  if (days === 180) return '6 meses';
  if (days === 365) return '1 año';
  return `${days} días`;
}

export default function ProductLanding() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');

  const [data, setData] = useState<ProductLandingData | null>(null);
  const [meta, setMeta] = useState<ProductMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const params = refCode ? { ref: refCode } : {};
        const { data: response } = await api.get<{
          success: boolean;
          data: ProductLandingData;
          meta: ProductMeta;
        }>(`/public/landing/product/${id}`, { params });

        if (response.success) {
          setData(response.data);
          setMeta(response.meta);
        } else {
          setError('Producto no encontrado');
        }
      } catch (err) {
        console.error('Error fetching product landing:', err);
        setError('No se pudo cargar el producto');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, refCode]);

  // Set SEO metadata
  useEffect(() => {
    if (meta) {
      document.title = meta.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', meta.description);
      } else {
        const newMetaDesc = document.createElement('meta');
        newMetaDesc.name = 'description';
        newMetaDesc.content = meta.description;
        document.head.appendChild(newMetaDesc);
      }

      // Open Graph
      if (meta.ogImage) {
        let ogImage = document.querySelector('meta[property="og:image"]');
        if (!ogImage) {
          ogImage = document.createElement('meta');
          ogImage.setAttribute('property', 'og:image');
          document.head.appendChild(ogImage);
        }
        ogImage.setAttribute('content', meta.ogImage);
      }
    }
  }, [meta]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Producto no encontrado</h2>
          <p className="text-gray-600 mb-6">
            El producto que buscas no existe o no está disponible.
          </p>
          <Link
            to="/products"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Ver Catálogo
          </Link>
        </div>
      </div>
    );
  }

  const { product, affiliate } = data;
  const platform = platformInfo[product.platform];

  // Build the purchase link with referral code
  const purchaseLink = affiliate
    ? `/register?ref=${affiliate.referralCode}&product=${product.id}`
    : `/register?product=${product.id}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <PlatformIcon platform={product.platform} />
            <span className="text-indigo-200 font-medium">
              {platform?.name || product.platform}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{product.name}</h1>
          <p className="text-xl text-indigo-100 max-w-2xl">
            {product.description || 'Suscribete ahora y disfruta de todo el contenido sin límites'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Product Image & Price */}
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="bg-gray-100 flex items-center justify-center p-8">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-w-full max-h-64 object-contain rounded-lg"
                />
              ) : (
                <div className="text-8xl">{platform?.icon || '📱'}</div>
              )}
            </div>

            {/* Price & CTA */}
            <div className="p-8 flex flex-col justify-center">
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-1">Precio</div>
                <div className="text-4xl font-bold text-gray-900">
                  {formatPrice(product.price, product.currency)}
                  <span className="text-lg font-normal text-gray-500">
                    {' '}
                    / {formatDuration(product.durationDays)}
                  </span>
                </div>
              </div>

              {/* Buy Button */}
              <a
                href={purchaseLink}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-4 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg"
              >
                {affiliate ? `Comprar con ${affiliate.fullName}` : 'Comprar Ahora'}
              </a>

              {affiliate && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  Al comprar, apoyas a tu afiliado
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">¿Qué incluye?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">Acceso ilimitado</div>
                <div className="text-sm text-gray-500">Disfruta sin restricciones</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">Calidad HD</div>
                <div className="text-sm text-gray-500">La mejor experiencia visual</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">Multiple dispositivos</div>
                <div className="text-sm text-gray-500">Usa en hasta 3 dispositivos</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">Soporte 24/7</div>
                <div className="text-sm text-gray-500">Ayuda siempre disponible</div>
              </div>
            </div>
          </div>
        </div>

        {/* Affiliate Section */}
        {affiliate && (
          <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {affiliate.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Afiliado: {affiliate.fullName}</div>
                <div className="text-sm text-gray-500">
                  Código:{' '}
                  <span className="font-mono font-medium text-indigo-600">
                    {affiliate.referralCode}
                  </span>
                </div>
              </div>
              <Link
                to={`/ref/${affiliate.referralCode}`}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Ver perfil
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm pb-8">
          <p>© 2026 Nexo Real. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}

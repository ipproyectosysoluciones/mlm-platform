/**
 * @fileoverview CryptoPriceService - Fetch real-time cryptocurrency prices
 * @description Fetches prices from CoinGecko API with caching and fallback
 *              Obtiene precios de criptomonedas de CoinGecko API con cache
 * @module services/CryptoPriceService
 * @author MLM Development Team
 */

import axios from 'axios';

// CoinGecko API URL
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Supported cryptocurrencies
export const SUPPORTED_CRYPTOS = ['bitcoin', 'ethereum', 'tether'] as const;
export type SupportedCrypto = (typeof SUPPORTED_CRYPTOS)[number];

// Interface for price data
export interface CryptoPrice {
  usd: number;
  usd_24h_change?: number;
}

export interface CryptoPrices {
  bitcoin: CryptoPrice;
  ethereum: CryptoPrice;
  tether: CryptoPrice;
  lastUpdated: Date;
}

// Cache for prices (5 minutes TTL)
let priceCache: { data: CryptoPrices | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch current cryptocurrency prices from CoinGecko
 * Obtener precios actuales de criptomonedas
 *
 * @returns Promise with crypto prices or fallback prices
 */
export async function getCryptoPrices(): Promise<CryptoPrices> {
  const now = Date.now();

  // Return cached data if still valid
  if (priceCache.data && now - priceCache.timestamp < CACHE_TTL) {
    return priceCache.data;
  }

  try {
    const response = await axios.get<CryptoPrices>(`${COINGECKO_API}/simple/price`, {
      params: {
        ids: SUPPORTED_CRYPTOS.join(','),
        vs_currencies: 'usd',
        include_24hr_change: 'true',
      },
      timeout: 5000, // 5 second timeout
    });

    const prices: CryptoPrices = {
      bitcoin: {
        usd: response.data.bitcoin?.usd || FALLBACK_PRICES.bitcoin.usd,
        usd_24h_change: response.data.bitcoin?.usd_24h_change,
      },
      ethereum: {
        usd: response.data.ethereum?.usd || FALLBACK_PRICES.ethereum.usd,
        usd_24h_change: response.data.ethereum?.usd_24h_change,
      },
      tether: {
        usd: response.data.tether?.usd || FALLBACK_PRICES.tether.usd,
        usd_24h_change: response.data.tether?.usd_24h_change,
      },
      lastUpdated: new Date(),
    };

    // Update cache
    priceCache = { data: prices, timestamp: now };

    return prices;
  } catch (error) {
    console.error('Error fetching crypto prices:', error);

    // Return cached data if available, otherwise fallback
    if (priceCache.data) {
      return priceCache.data;
    }

    return FALLBACK_PRICES;
  }
}

/**
 * Fallback prices when API is unavailable
 * Precios de respaldo cuando la API no está disponible
 */
const FALLBACK_PRICES: CryptoPrices = {
  bitcoin: { usd: 65000, usd_24h_change: 0 },
  ethereum: { usd: 3200, usd_24h_change: 0 },
  tether: { usd: 1, usd_24h_change: 0 },
  lastUpdated: new Date(),
};

/**
 * Convert USD amount to crypto
 * Convertir monto USD a criptomoneda
 *
 * @param usdAmount - Amount in USD / Monto en USD
 * @param crypto - Target cryptocurrency / Criptomoneda objetivo
 * @returns Amount in crypto / Monto en criptomoneda
 */
export function usdToCrypto(usdAmount: number, crypto: SupportedCrypto): number {
  // Get synchronous price (from cache)
  const prices = priceCache.data || FALLBACK_PRICES;
  const cryptoPrice = prices[crypto].usd;

  if (cryptoPrice === 0) return 0;

  return usdAmount / cryptoPrice;
}

/**
 * Get specific crypto price
 * Obtener precio de una criptomoneda específica
 *
 * @param crypto - Cryptocurrency / Criptomoneda
 * @returns Price in USD / Precio en USD
 */
export function getCryptoPrice(crypto: SupportedCrypto): number {
  const prices = priceCache.data || FALLBACK_PRICES;
  return prices[crypto].usd;
}

// Export singleton instance
export const cryptoPriceService = {
  getPrices: getCryptoPrices,
  usdToCrypto,
  getPrice: getCryptoPrice,
};

export default cryptoPriceService;

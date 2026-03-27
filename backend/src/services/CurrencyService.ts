/**
 * @fileoverview CurrencyService - Exchange rate conversion using frankfurter.dev API
 * @description Provides currency conversion functionality with in-memory caching
 *              Proporciona conversión de divisas con caché en memoria
 * @module services/CurrencyService
 * @author MLM Development Team
 */

import { config } from '../config/env';

const FRANKFURTER_API = 'https://api.frankfurter.dev';

/**
 * Exchange rates cache
 */
interface ExchangeRates {
  rates: Record<string, number>;
  timestamp: number;
}

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

let cachedRates: ExchangeRates | null = null;

/**
 * Currency codes supported
 */
const CURRENCY = {
  EUR: 'EUR',
  USD: 'USD',
  CAD: 'CAD',
  MXN: 'MXN',
  COP: 'COP',
} as const;

type CurrencyCode = (typeof CURRENCY)[keyof typeof CURRENCY];

/**
 * Fetch latest exchange rates from frankfurter.dev API
 * Obtiene tasas de cambio del API de frankfurter.dev
 */
async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    const response = await fetch(
      `${FRANKFURTER_API}/latest?from=${CURRENCY.EUR}&to=${CURRENCY.USD},${CURRENCY.CAD},${CURRENCY.MXN},${CURRENCY.COP}`
    );

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();

    if (!data.rates) {
      throw new Error('Invalid API response - missing rates');
    }

    return {
      EUR: 1,
      ...data.rates,
    };
  } catch (error) {
    console.error('CurrencyService: Failed to fetch exchange rates:', error);
    throw error;
  }
}

/**
 * Get exchange rates with caching
 * Obtiene tasas de cambio con caché
 */
async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();

  // Return cached rates if still valid
  if (cachedRates && now - cachedRates.timestamp < CACHE_DURATION_MS) {
    return cachedRates.rates;
  }

  // Fetch new rates
  const rates = await fetchExchangeRates();

  // Update cache
  cachedRates = {
    rates,
    timestamp: now,
  };

  return rates;
}

/**
 * Convert amount from source currency to USD
 * Convierte monto de la divisa origen a USD
 *
 * @param amount - Amount to convert / Monto a convertir
 * @param fromCurrency - Source currency code (EUR, CAD, MXN, COP) / Código de divisa origen
 * @returns - Amount in USD / Monto en USD
 */
export async function convertToUSD(amount: number, fromCurrency: string): Promise<number> {
  try {
    // If already USD, return as-is
    if (fromCurrency.toUpperCase() === CURRENCY.USD) {
      return amount;
    }

    const rates = await getExchangeRates();
    const from = fromCurrency.toUpperCase();

    // If source is EUR, direct conversion
    if (from === CURRENCY.EUR) {
      const usdRate = rates[CURRENCY.USD];
      if (!usdRate) {
        console.warn('CurrencyService: USD rate not found, using 1:1 fallback');
        return amount;
      }
      return amount * usdRate;
    }

    // Convert through EUR (cross-rate calculation)
    // 1. Convert from source to EUR
    // 2. Convert from EUR to USD
    const sourceToEur = rates[from];
    const eurToUsd = rates[CURRENCY.USD];

    if (!sourceToEur || !eurToUsd) {
      console.warn(`CurrencyService: Missing rate for ${from} or USD, using 1:1 fallback`);
      return amount;
    }

    // amount in source / rate to EUR = amount in EUR
    // amount in EUR * rate to USD = amount in USD
    const amountInEur = amount / sourceToEur;
    const amountInUSD = amountInEur * eurToUsd;

    return Math.round(amountInUSD * 100) / 100;
  } catch (error) {
    console.error('CurrencyService: Conversion failed, using fallback:', error);
    // Fallback: return 1:1 if API fails
    return amount;
  }
}

/**
 * Convert amount from one currency to another
 * Convierte monto de una divisa a otra
 *
 * @param amount - Amount to convert / Monto a convertir
 * @param fromCurrency - Source currency code / Código de divisa origen
 * @param toCurrency - Target currency code / Código de divisa destino
 * @returns - Converted amount / Monto convertido
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  try {
    const rates = await getExchangeRates();
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    // Same currency - no conversion
    if (from === to) {
      return amount;
    }

    // Get rates
    const fromRate = rates[from];
    const toRate = rates[to];

    if (!fromRate || !toRate) {
      console.warn(`CurrencyService: Missing rate for ${from} or ${to}, using 1:1 fallback`);
      return amount;
    }

    // Convert: amount / fromRate * toRate
    const amountInUSD = amount / fromRate;
    const converted = amountInUSD * toRate;

    return Math.round(converted * 100) / 100;
  } catch (error) {
    console.error('CurrencyService: Conversion failed, using fallback:', error);
    return amount;
  }
}

/**
 * Get current exchange rates for display
 * Obtiene tasas de cambio actuales para mostrar
 */
export async function getRates(): Promise<{
  base: string;
  rates: Record<string, number>;
  timestamp: string;
}> {
  const rates = await getExchangeRates();

  return {
    base: 'EUR',
    rates,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Clear the exchange rate cache
 * Limpia el caché de tasas de cambio (for testing)
 */
export function clearCache(): void {
  cachedRates = null;
}

// Export as default service object
export const currencyService = {
  convertToUSD,
  convertCurrency,
  getRates,
  clearCache,
};

export default currencyService;

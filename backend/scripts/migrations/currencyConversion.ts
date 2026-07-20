/**
 * @fileoverview Currency Conversion Helper
 * @description Simple synchronous currency conversion for migration scripts
 *              Conversión de moneda simple para scripts de migración
 * @module database/migrations/currencyConversion
 */

// Fallback exchange rates (used when API is unavailable)
// Tasas de cambio de respaldo (usadas cuando API no está disponible)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 1.08, // 1 EUR = 1.08 USD
  COP: 0.00025, // 1 USD = 4000 COP
  MXN: 0.058, // 1 USD = 17.2 MXN
  CAD: 0.74, // 1 USD = 1.35 CAD
  GBP: 1.27, // 1 USD = 0.79 GBP
  BRL: 0.2, // 1 USD = 5.0 BRL
};

/**
 * Convert amount from any currency to USD
 * Convierte monto de cualquier moneda a USD
 *
 * @param amount - Amount to convert / Monto a convertir
 * @param fromCurrency - Source currency code (e.g., 'COP', 'MXN', 'USD') / Código de moneda origen
 * @returns Amount in USD / Monto en USD
 */
export function convertToUSD(amount: number, fromCurrency: string): number {
  const currency = fromCurrency.toUpperCase();
  const rate = EXCHANGE_RATES[currency] || 1;
  return amount * rate;
}

/**
 * Convert amount from USD to any currency
 * Convierte monto de USD a cualquier moneda
 *
 * @param amount - Amount in USD / Monto en USD
 * @param toCurrency - Target currency code / Código de moneda destino
 * @returns Amount in target currency / Monto en moneda destino
 */
export function convertFromUSD(amount: number, toCurrency: string): number {
  const currency = toCurrency.toUpperCase();
  const rate = EXCHANGE_RATES[currency] || 1;
  return amount / rate;
}

/**
 * Convert between any two currencies
 * Convierte entre dos monedas cualquiera
 *
 * @param amount - Amount to convert / Monto a convertir
 * @param fromCurrency - Source currency / Moneda de origen
 * @param toCurrency - Target currency / Moneda de destino
 * @returns Converted amount / Monto convertido
 */
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  // Convert to USD first, then to target currency
  const amountInUSD = convertToUSD(amount, fromCurrency);
  return convertFromUSD(amountInUSD, toCurrency);
}

/**
 * Get exchange rate for a currency
 * Obtener tasa de cambio para una moneda
 *
 * @param currency - Currency code / Código de moneda
 * @returns Rate to USD / Tasa respecto a USD
 */
export function getExchangeRate(currency: string): number {
  return EXCHANGE_RATES[currency.toUpperCase()] || 1;
}

/**
 * Get all supported currencies
 * Obtener todas las monedas soportadas
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(EXCHANGE_RATES);
}

export default {
  convertToUSD,
  convertFromUSD,
  convertCurrency,
  getExchangeRate,
  getSupportedCurrencies,
};

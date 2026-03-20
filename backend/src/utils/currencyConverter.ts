const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  USD: { USD: 1, COP: 4000, MXN: 17 },
  COP: { USD: 0.00025, COP: 1, MXN: 0.00425 },
  MXN: { USD: 0.059, COP: 235, MXN: 1 },
};

export function convertCurrency(
  amount: number,
  from: string,
  to: string
): number {
  if (from === to) return amount;
  
  const rate = EXCHANGE_RATES[from]?.[to];
  if (!rate) {
    throw new Error(`Exchange rate not found: ${from} to ${to}`);
  }
  
  return amount * rate;
}

export function formatCurrency(
  amount: number,
  currency: string
): string {
  const symbols: Record<string, string> = {
    USD: '$',
    COP: '$',
    MXN: '$',
  };
  
  const decimals = currency === 'COP' ? 0 : 2;
  const symbol = symbols[currency] || '';
  
  return `${symbol}${amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ${currency}`;
}

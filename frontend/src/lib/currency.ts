// Currency conversion service using exchangerate-api.com
export interface ExchangeRateResponse {
  base: string;
  date: string;
  time_last_updated: number;
  rates: Record<string, number>;
}

export interface ConversionResult {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  rate: number;
  lastUpdated: Date;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

// Popular currencies with their symbols
export const POPULAR_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
];

class CurrencyService {
  private static instance: CurrencyService;
  private cache: Map<string, { data: ExchangeRateResponse; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly API_BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

  static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  /**
   * Get exchange rates for a base currency
   */
  async getExchangeRates(baseCurrency: string): Promise<ExchangeRateResponse> {
    const cacheKey = baseCurrency.toUpperCase();
    const cached = this.cache.get(cacheKey);
    
    // Check if we have valid cached data
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/${baseCurrency.toUpperCase()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rates: ${response.status} ${response.statusText}`);
      }

      const data: ExchangeRateResponse = await response.json();
      
      // Cache the data
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      
      // If API fails and we have cached data (even if expired), use it
      if (cached) {
        console.warn('Using expired cached data due to API failure');
        return cached.data;
      }
      
      throw error;
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<ConversionResult> {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    // If same currency, no conversion needed
    if (from === to) {
      return {
        fromAmount: amount,
        fromCurrency: from,
        toAmount: amount,
        toCurrency: to,
        rate: 1,
        lastUpdated: new Date()
      };
    }

    try {
      const rates = await this.getExchangeRates(from);
      const rate = rates.rates[to];

      if (!rate) {
        throw new Error(`Exchange rate not found for ${from} to ${to}`);
      }

      const convertedAmount = amount * rate;

      return {
        fromAmount: amount,
        fromCurrency: from,
        toAmount: Number(convertedAmount.toFixed(2)),
        toCurrency: to,
        rate,
        lastUpdated: new Date(rates.time_last_updated * 1000)
      };
    } catch (error) {
      console.error('Currency conversion failed:', error);
      throw error;
    }
  }

  /**
   * Convert multiple amounts to a target currency
   */
  async convertMultiple(
    conversions: Array<{ amount: number; fromCurrency: string }>,
    targetCurrency: string
  ): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];
    
    // Group conversions by source currency to minimize API calls
    const groupedBySource: Record<string, Array<{ amount: number; index: number }>> = {};
    
    conversions.forEach((conversion, index) => {
      const key = conversion.fromCurrency.toUpperCase();
      if (!groupedBySource[key]) {
        groupedBySource[key] = [];
      }
      groupedBySource[key].push({ amount: conversion.amount, index });
    });

    // Process each source currency group
    for (const [sourceCurrency, amounts] of Object.entries(groupedBySource)) {
      try {
        for (const { amount, index } of amounts) {
          const result = await this.convertCurrency(amount, sourceCurrency, targetCurrency);
          results[index] = result;
        }
      } catch (error) {
        console.error(`Failed to convert ${sourceCurrency} to ${targetCurrency}:`, error);
        // Add error result
        for (const { amount, index } of amounts) {
          results[index] = {
            fromAmount: amount,
            fromCurrency: sourceCurrency,
            toAmount: amount, // Fallback to original amount
            toCurrency: targetCurrency,
            rate: 1,
            lastUpdated: new Date()
          };
        }
      }
    }

    return results;
  }

  /**
   * Get currency symbol for a currency code
   */
  getCurrencySymbol(currencyCode: string): string {
    const currency = POPULAR_CURRENCIES.find(
      c => c.code === currencyCode.toUpperCase()
    );
    return currency?.symbol || currencyCode.toUpperCase();
  }

  /**
   * Format amount with currency symbol
   */
  formatCurrency(amount: number, currencyCode: string, locale: string = 'en-US'): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode.toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback if currency code is not supported
      const symbol = this.getCurrencySymbol(currencyCode);
      return `${symbol}${amount.toFixed(2)}`;
    }
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): CurrencyInfo[] {
    return POPULAR_CURRENCIES;
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Check if a currency is supported
   */
  isCurrencySupported(currencyCode: string): boolean {
    return POPULAR_CURRENCIES.some(
      c => c.code === currencyCode.toUpperCase()
    );
  }
}

// Export singleton instance
export const currencyService = CurrencyService.getInstance();

// Utility functions for easy access
export const convertCurrency = (amount: number, from: string, to: string) =>
  currencyService.convertCurrency(amount, from, to);

export const formatCurrency = (amount: number, currency: string, locale?: string) =>
  currencyService.formatCurrency(amount, currency, locale);

export const getCurrencySymbol = (currency: string) =>
  currencyService.getCurrencySymbol(currency);

export const getSupportedCurrencies = () =>
  currencyService.getSupportedCurrencies();

export default currencyService;
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, ArrowUpDown } from 'lucide-react';
import { currencyService, ConversionResult, getSupportedCurrencies, formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';

interface CurrencyConverterProps {
  defaultFromCurrency?: string;
  defaultToCurrency?: string;
  defaultAmount?: number;
  onConversionResult?: (result: ConversionResult) => void;
  className?: string;
  compact?: boolean;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  defaultFromCurrency = 'USD',
  defaultToCurrency = 'EUR',
  defaultAmount = 100,
  onConversionResult,
  className = '',
  compact = false
}) => {
  const [fromCurrency, setFromCurrency] = useState(defaultFromCurrency);
  const [toCurrency, setToCurrency] = useState(defaultToCurrency);
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const currencies = getSupportedCurrencies();

  const performConversion = async () => {
    if (!amount || isNaN(Number(amount))) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      const conversionResult = await currencyService.convertCurrency(
        Number(amount),
        fromCurrency,
        toCurrency
      );
      
      setResult(conversionResult);
      setLastUpdated(conversionResult.lastUpdated);
      onConversionResult?.(conversionResult);
    } catch (error) {
      console.error('Conversion failed:', error);
      toast.error('Failed to convert currency. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    // Also swap the result if it exists
    if (result) {
      setAmount(result.toAmount.toString());
    }
  };

  // Auto-convert when currencies or amount change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (amount && Number(amount) > 0) {
        performConversion();
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [fromCurrency, toCurrency, amount]);

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-1">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-24"
            placeholder="Amount"
          />
          <Select value={fromCurrency} onValueChange={setFromCurrency}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        
        <div className="flex items-center space-x-1">
          <Input
            type="text"
            value={result ? result.toAmount.toFixed(2) : ''}
            readOnly
            className="w-24"
            placeholder="Result"
          />
          <Select value={toCurrency} onValueChange={setToCurrency}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Currency Converter
          <Button
            variant="outline"
            size="sm"
            onClick={performConversion}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* From Currency */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              step="0.01"
              min="0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="from-currency">From Currency</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger id="from-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono">{currency.code}</span>
                      <span className="text-muted-foreground">{currency.name}</span>
                      <span className="text-muted-foreground">({currency.symbol})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={swapCurrencies}
            className="rounded-full"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        {/* To Currency */}
        <div className="space-y-2">
          <Label htmlFor="to-currency">To Currency</Label>
          <Select value={toCurrency} onValueChange={setToCurrency}>
            <SelectTrigger id="to-currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono">{currency.code}</span>
                    <span className="text-muted-foreground">{currency.name}</span>
                    <span className="text-muted-foreground">({currency.symbol})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(result.toAmount, result.toCurrency)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {formatCurrency(result.fromAmount, result.fromCurrency)} = {formatCurrency(result.toAmount, result.toCurrency)}
              </div>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  Rate: 1 {result.fromCurrency} = {result.rate.toFixed(4)} {result.toCurrency}
                </Badge>
              </div>
              {lastUpdated && (
                <div className="text-xs text-muted-foreground mt-2">
                  Last updated: {lastUpdated.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const CurrencySelect: React.FC<CurrencySelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select currency",
  className = ""
}) => {
  const currencies = getSupportedCurrencies();

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-semibold">{currency.code}</span>
              <span className="text-muted-foreground">{currency.symbol}</span>
              <span className="text-sm text-muted-foreground">{currency.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  convertTo?: string;
  showOriginal?: boolean;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency,
  convertTo,
  showOriginal = true,
  className = ""
}) => {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (convertTo && convertTo !== currency) {
      const convert = async () => {
        try {
          setLoading(true);
          const result = await currencyService.convertCurrency(amount, currency, convertTo);
          setConvertedAmount(result.toAmount);
        } catch (error) {
          console.error('Currency conversion failed:', error);
          setConvertedAmount(null);
        } finally {
          setLoading(false);
        }
      };
      convert();
    } else {
      setConvertedAmount(null);
    }
  }, [amount, currency, convertTo]);

  if (!convertTo || convertTo === currency) {
    return (
      <span className={className}>
        {formatCurrency(amount, currency)}
      </span>
    );
  }

  return (
    <span className={className}>
      {loading ? (
        <span className="flex items-center space-x-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Converting...</span>
        </span>
      ) : convertedAmount !== null ? (
        <span>
          {formatCurrency(convertedAmount, convertTo)}
          {showOriginal && (
            <span className="text-muted-foreground text-sm ml-1">
              ({formatCurrency(amount, currency)})
            </span>
          )}
        </span>
      ) : (
        formatCurrency(amount, currency)
      )}
    </span>
  );
};

export default CurrencyConverter;
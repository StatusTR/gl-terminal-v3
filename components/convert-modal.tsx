'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ConvertModalProps {
  onClose: () => void;
  onSuccess: () => void;
  balances: Array<{ currency: string; amount: number }>;
}

export default function ConvertModal({
  onClose,
  onSuccess,
  balances,
}: ConvertModalProps) {
  const [fromCurrency, setFromCurrency] = useState<string>('EUR');
  const [toCurrency, setToCurrency] = useState<string>('USD');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Wechselkurse (können über API echt gemacht werden)
  const exchangeRates: Record<string, Record<string, number>> = {
    EUR: { USD: 1.09, GBP: 0.86, CHF: 0.95, USDC: 1.09 },
    USD: { EUR: 0.92, GBP: 0.79, CHF: 0.87, USDC: 1.00 },
    GBP: { EUR: 1.17, USD: 1.27, CHF: 1.10, USDC: 1.27 },
    CHF: { EUR: 1.05, USD: 1.15, GBP: 0.91, USDC: 1.15 },
    USDC: { EUR: 0.92, USD: 1.00, GBP: 0.79, CHF: 0.87 },
  };

  const currencyNames: Record<string, string> = {
    EUR: 'Euro',
    USD: 'US-Dollar',
    GBP: 'Britisches Pfund',
    CHF: 'Schweizer Franken',
    USDC: 'USD Coin',
  };

  const getAvailableBalance = (currency: string) => {
    const balance = balances.find((b) => b.currency === currency);
    return balance?.amount ?? 0;
  };

  const getConvertedAmount = () => {
    if (!amount || !fromCurrency || !toCurrency || fromCurrency === toCurrency) {
      return 0;
    }
    const rate = exchangeRates[fromCurrency]?.[toCurrency] ?? 1;
    return parseFloat(amount) * rate;
  };

  const handleConvert = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Geben Sie einen gültigen Betrag ein');
      return;
    }

    if (fromCurrency === toCurrency) {
      toast.error('Verschiedene Währungen auswählen');
      return;
    }

    const availableBalance = getAvailableBalance(fromCurrency);
    if (parseFloat(amount) > availableBalance) {
      toast.error('Nicht genügend Guthaben');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCurrency,
          toCurrency,
          amount: parseFloat(amount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Umtauschfehler');
      }

      toast.success(`Erfolgreich umgetauscht ${amount} ${fromCurrency} → ${getConvertedAmount().toFixed(2)} ${toCurrency}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Convert error:', error);
      toast.error(error.message || 'Fehler beim Umtausch');
    } finally {
      setLoading(false);
    }
  };

  const currencies = ['EUR', 'USD', 'GBP', 'CHF'];
  const availableBalance = getAvailableBalance(fromCurrency);
  const convertedAmount = getConvertedAmount();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Währungsumtausch
          </DialogTitle>
          <DialogDescription>
            Tauschen Sie eine Währung gegen eine andere zum aktuellen Kurs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Von Währung */}
          <div className="space-y-2">
            <Label>Von Währung</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr} value={curr}>
                    {curr} (Verfügbar: {getAvailableBalance(curr).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Betrag */}
          <div className="space-y-2">
            <Label>Betrag für den Umtausch</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
                className="pr-16"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                {fromCurrency}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Verfügbar: {availableBalance.toFixed(2)} {fromCurrency}
            </p>
          </div>

          {/* Стрілка */}
          <div className="flex justify-center">
            <ArrowRight className="w-6 h-6 text-gray-400" />
          </div>

          {/* Zu Währung */}
          <div className="space-y-2">
            <Label>Zu Währung</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr} value={curr}>
                    {curr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Konvertierungsergebnis */}
          {amount && parseFloat(amount) > 0 && fromCurrency !== toCurrency && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Sie erhalten:</div>
              <div className="text-2xl font-bold text-blue-600">
                {convertedAmount.toFixed(2)} {toCurrency}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Kurs: 1 {fromCurrency} = {exchangeRates[fromCurrency]?.[toCurrency]?.toFixed(4)} {toCurrency}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button
            onClick={handleConvert}
            disabled={loading || !amount || parseFloat(amount) <= 0 || fromCurrency === toCurrency}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Umtausch läuft...' : 'Umtauschen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

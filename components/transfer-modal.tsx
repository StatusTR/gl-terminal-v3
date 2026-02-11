'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Send, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Balance {
  currency: string;
  amount: number;
}

interface TransferModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function TransferModal({ onClose, onSuccess }: TransferModalProps) {
  const [transferType, setTransferType] = useState<'FIAT' | 'CRYPTO' | 'TRADE'>('FIAT');
  const [loading, setLoading] = useState(false);

  // Fiat fields
  const [fiatCurrency, setFiatCurrency] = useState('EUR');
  const [recipient, setRecipient] = useState('');
  const [iban, setIban] = useState('');
  const [purpose, setPurpose] = useState('');
  const [fiatAmount, setFiatAmount] = useState('');

  // Crypto fields
  const [cryptoCurrency, setCryptoCurrency] = useState('BTC');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');

  // Trade fields
  const [tradeCurrency, setTradeCurrency] = useState('EUR');
  const [tradeAmount, setTradeAmount] = useState('');
  const [balances, setBalances] = useState<Balance[]>([]);
  const [hasActiveTrade, setHasActiveTrade] = useState(false);

  // Fetch balances and check for active trade when switching to trade tab
  useEffect(() => {
    if (transferType === 'TRADE') {
      const fetchData = async () => {
        try {
          const [balRes, tradesRes] = await Promise.all([
            fetch('/api/balances'),
            fetch('/api/trades')
          ]);
          const balData = await balRes.json();
          const tradesData = await tradesRes.json();
          
          if (balRes.ok) setBalances(balData.balances || []);
          if (tradesRes.ok) {
            const activeTrade = (tradesData.trades || []).find((t: any) => t.status === 'ACTIVE');
            setHasActiveTrade(!!activeTrade);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
      fetchData();
    }
  }, [transferType]);

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Handle Trade type separately
      if (transferType === 'TRADE') {
        const amount = parseFloat(tradeAmount);
        if (!amount || amount <= 0) {
          toast.error('Bitte geben Sie einen gültigen Betrag ein');
          setLoading(false);
          return;
        }

        const balance = balances.find(b => b.currency === tradeCurrency);
        if (!balance || balance.amount < amount) {
          toast.error('Unzureichendes Guthaben');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency: tradeCurrency }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Fehler beim Starten des Handels');
        }

        toast.success('Handel erfolgreich gestartet!');
        onSuccess();
        return;
      }

      // Handle FIAT and CRYPTO transfers
      const payload: any = {
        type: transferType,
        amount: parseFloat(transferType === 'FIAT' ? fiatAmount : cryptoAmount),
      };

      if (transferType === 'FIAT') {
        if (!recipient || !iban || !fiatAmount) {
          toast.error('Alle Felder ausfüllen');
          setLoading(false);
          return;
        }
        payload.currency = fiatCurrency;
        payload.recipient = recipient;
        payload.iban = iban;
        payload.purpose = purpose || 'Geld überweisen';
      } else {
        if (!cryptoAddress || !cryptoAmount) {
          toast.error('Alle Felder ausfüllen');
          setLoading(false);
          return;
        }
        payload.cryptoCurrency = cryptoCurrency;
        payload.cryptoAddress = cryptoAddress;
      }

      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Erstellen der Überweisung');
      }

      toast.success('Überweisung erstellt! Status: In Bearbeitung');
      onSuccess();
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast.error(error.message || 'Fehler beim Erstellen der Überweisung');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency === 'USDC' ? 'USD' : currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl font-bold">Geld überweisen</DialogTitle>
        </DialogHeader>

        <Tabs value={transferType} onValueChange={(v) => setTransferType(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
            <TabsTrigger value="FIAT" className="px-2 sm:px-4">Fiat</TabsTrigger>
            <TabsTrigger value="CRYPTO" className="px-2 sm:px-4">Krypto</TabsTrigger>
            <TabsTrigger value="TRADE" className="text-amber-600 px-2 sm:px-4">Handel</TabsTrigger>
          </TabsList>

          {/* Fiat Tab */}
          <TabsContent value="FIAT" className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fiat-currency" className="text-sm">Währung</Label>
              <Select value={fiatCurrency} onValueChange={setFiatCurrency}>
                <SelectTrigger id="fiat-currency" className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="USD">US-Dollar (USD)</SelectItem>
                  <SelectItem value="GBP">Britisches Pfund (GBP)</SelectItem>
                  <SelectItem value="CHF">Schweizer Franken (CHF)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recipient" className="text-sm">Empfänger</Label>
              <Input
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Empfängername"
                disabled={loading}
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="iban" className="text-sm">IBAN</Label>
              <Input
                id="iban"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="DE89 3704 0044..."
                disabled={loading}
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fiat-amount" className="text-sm">Betrag</Label>
              <Input
                id="fiat-amount"
                type="number"
                step="0.01"
                value={fiatAmount}
                onChange={(e) => setFiatAmount(e.target.value)}
                placeholder="0.00"
                disabled={loading}
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purpose" className="text-sm">Verwendungszweck</Label>
              <Input
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Optional"
                disabled={loading}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </TabsContent>

          {/* Crypto Tab */}
          <TabsContent value="CRYPTO" className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="crypto-currency" className="text-sm">Kryptowährung</Label>
              <Select value={cryptoCurrency} onValueChange={setCryptoCurrency}>
                <SelectTrigger id="crypto-currency" className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                  <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                  <SelectItem value="LTC">Litecoin (LTC)</SelectItem>
                  <SelectItem value="XRP">Ripple (XRP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="crypto-address" className="text-sm">Krypto-Adresse</Label>
              <Input
                id="crypto-address"
                value={cryptoAddress}
                onChange={(e) => setCryptoAddress(e.target.value)}
                placeholder="0x..."
                disabled={loading}
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="crypto-amount" className="text-sm">Betrag</Label>
              <Input
                id="crypto-amount"
                type="number"
                step="0.00000001"
                value={cryptoAmount}
                onChange={(e) => setCryptoAmount(e.target.value)}
                placeholder="0.00000000"
                disabled={loading}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </TabsContent>

          {/* Trade Tab */}
          <TabsContent value="TRADE" className="space-y-3 sm:space-y-4">
            {hasActiveTrade ? (
              <div className="py-4 sm:py-6 text-center">
                <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-amber-500 mb-3 sm:mb-4" />
                <p className="text-gray-900 font-medium mb-2 text-sm sm:text-base">Aktiver Handel vorhanden</p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Schließen Sie den Handel zuerst.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-900 text-sm sm:text-base">Automatisches Handelssystem</p>
                      <p className="text-xs sm:text-sm text-amber-700 mt-1">
                        Gewinn wird bei Abschluss berechnet.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="trade-currency" className="text-sm">Währung</Label>
                  <Select value={tradeCurrency} onValueChange={setTradeCurrency}>
                    <SelectTrigger id="trade-currency" className="h-9 sm:h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {balances.filter(b => b.amount > 0).length > 0 ? (
                        balances.filter(b => b.amount > 0).map(b => (
                          <SelectItem key={b.currency} value={b.currency}>
                            {b.currency} - {formatCurrency(b.amount, b.currency)}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                          <SelectItem value="USD">US-Dollar (USD)</SelectItem>
                          <SelectItem value="GBP">Britisches Pfund (GBP)</SelectItem>
                          <SelectItem value="CHF">Schweizer Franken (CHF)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="trade-amount" className="text-sm">Betrag</Label>
                  <Input
                    id="trade-amount"
                    type="number"
                    step="0.01"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={loading}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-9 sm:h-10 text-sm"
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (transferType === 'TRADE' && hasActiveTrade)}
            className={`flex-1 h-9 sm:h-10 text-sm ${transferType === 'TRADE' ? 'bg-amber-500 hover:bg-amber-600 text-black' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                <span className="hidden sm:inline">Verarbeitung...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : transferType === 'TRADE' ? (
              <>
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Handel starten</span>
                <span className="sm:hidden">Starten</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Bestätigen</span>
                <span className="sm:hidden">OK</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(TransferModal);

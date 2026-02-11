'use client';

import { useEffect, useState, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConvertModal from './convert-modal';

interface Balance {
  currency: string;
  amount: number;
}

interface BalanceCardsProps {
  onTransferClick?: () => void;
  onRefresh?: () => void;
}

function BalanceCards({ onTransferClick, onRefresh }: BalanceCardsProps) {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConvertModal, setShowConvertModal] = useState(false);

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      const res = await fetch('/api/balances');
      const data = await res.json();
      if (data?.balances) {
        const sortedBalances = data.balances.sort((a: Balance, b: Balance) => 
          a.currency.localeCompare(b.currency)
        );
        setBalances(sortedBalances);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertSuccess = () => {
    fetchBalances();
    if (onRefresh) {
      onRefresh();
    }
  };

  // Exchange rates to EUR
  const exchangeRates: Record<string, number> = {
    EUR: 1,
    USD: 0.92,
    GBP: 1.17,
    CHF: 1.05,
    USDC: 0.92, // Stablecoin ~= USD
  };

  const totalBalance = balances.reduce((sum, b) => {
    const rate = exchangeRates[b.currency] || 1;
    return sum + b.amount * rate;
  }, 0);

  const currencyConfig: Record<string, { symbol: string; name: string; type: 'fiat' | 'crypto' }> = {
    EUR: { symbol: '€', name: 'Euro', type: 'fiat' },
    USD: { symbol: '$', name: 'US-Dollar', type: 'fiat' },
    GBP: { symbol: '£', name: 'Britisches Pfund', type: 'fiat' },
    CHF: { symbol: 'Fr.', name: 'Schweizer Franken', type: 'fiat' },
    USDC: { symbol: 'USDC', name: 'USD Coin', type: 'crypto' },
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
        </div>
      </div>
    );
  }

  // Separate fiat and crypto balances
  const fiatBalances = balances.filter(b => currencyConfig[b.currency]?.type === 'fiat');
  const cryptoBalances = balances.filter(b => currencyConfig[b.currency]?.type === 'crypto');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Total Balance - Professional Card */}
      <div className="bg-black rounded-lg p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-gray-400 text-xs sm:text-sm font-medium uppercase tracking-wider mb-1">Gesamtvermögen</p>
            <h2 className="text-2xl sm:text-4xl font-light tracking-tight">
              € {totalBalance.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-gray-500 text-xs mt-1 sm:mt-2">Konsolidierter Wert in Euro</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Button
              onClick={() => setShowConvertModal(true)}
              variant="outline"
              className="border-zinc-600 text-white hover:bg-zinc-800 hover:text-white bg-transparent text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Umtauschen
            </Button>
            {onTransferClick && (
              <Button
                onClick={onTransferClick}
                className="bg-amber-500 hover:bg-amber-600 text-black font-medium text-sm"
              >
                <Send className="w-4 h-4 mr-2" />
                Überweisung
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Currency Balances - Clean Table Style */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider">Kontostand</h3>
        </div>
        
        {/* Fiat Currencies */}
        {fiatBalances.length > 0 && (
          <div className="divide-y divide-gray-100">
            {fiatBalances.map((balance) => {
              const config = currencyConfig[balance.currency];
              const eurValue = balance.amount * (exchangeRates[balance.currency] || 1);
              
              return (
                <div key={balance.currency} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm sm:text-lg font-medium text-gray-700">{config?.symbol || balance.currency[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{config?.name || balance.currency}</p>
                      <p className="text-xs text-gray-500">{balance.currency}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-semibold text-gray-900 tabular-nums text-sm sm:text-base">
                      {balance.amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">
                      ≈ € {eurValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Crypto Section */}
        {cryptoBalances.length > 0 && (
          <>
            <div className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-50 border-t border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Digitale Vermögenswerte</p>
            </div>
            <div className="divide-y divide-gray-100">
              {cryptoBalances.map((balance) => {
                const config = currencyConfig[balance.currency];
                const eurValue = balance.amount * (exchangeRates[balance.currency] || 1);
                
                return (
                  <div key={balance.currency} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] sm:text-xs font-bold text-blue-700">{balance.currency}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{config?.name || balance.currency}</p>
                        <p className="text-xs text-gray-500">Stablecoin</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-semibold text-gray-900 tabular-nums text-sm sm:text-base">
                        {balance.amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500">
                        ≈ € {eurValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Convert Modal */}
      {showConvertModal && (
        <ConvertModal
          onClose={() => setShowConvertModal(false)}
          onSuccess={handleConvertSuccess}
          balances={balances}
        />
      )}
    </div>
  );
}

export default memo(BalanceCards);

'use client';

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, LogOut, TrendingUp, Square, Clock, CheckCircle, XCircle, Activity, Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Trade {
  id: string;
  amount: number;
  currency: string;
  status: 'ACTIVE' | 'CLOSED_BY_USER' | 'CLOSED_BY_ADMIN';
  profit: number | null;
  profitPercent: number | null;
  tradingPair: string | null;
  adminComment: string | null;
  createdAt: string;
  closedAt: string | null;
}

interface Balance {
  currency: string;
  amount: number;
}

function TradingClient() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Close trade confirmation
  const [closingTrade, setClosingTrade] = useState<Trade | null>(null);
  const [closing, setClosing] = useState(false);
  
  // Visual fluctuation for active trades
  const [visualPercent, setVisualPercent] = useState<Record<string, number>>({});

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/trades');
      const data = await res.json();
      if (res.ok) setTrades(data.trades || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoized active trade
  const activeTrade = useMemo(() => trades.find(t => t.status === 'ACTIVE'), [trades]);
  const closedTrades = useMemo(() => trades.filter(t => t.status !== 'ACTIVE'), [trades]);

  // Visual fluctuation effect for active trades
  useEffect(() => {
    if (!activeTrade) return;

    // Initialize
    setVisualPercent(prev => ({
      ...prev,
      [activeTrade.id]: prev[activeTrade.id] ?? (Math.random() * 2 - 0.5)
    }));

    const interval = setInterval(() => {
      setVisualPercent(prev => ({
        ...prev,
        [activeTrade.id]: Math.random() * 2 - 0.5
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [activeTrade]);

  const handleCloseTrade = async () => {
    if (!closingTrade) return;

    try {
      setClosing(true);
      const response = await fetch(`/api/trades/${closingTrade.id}`, {
        method: 'PATCH'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Handel geschlossen - Betrag zurückerstattet');
        setClosingTrade(null);
        fetchData();
      } else {
        toast.error(data.error || 'Fehler beim Schließen');
      }
    } catch (error) {
      toast.error('Verbindungsfehler');
    } finally {
      setClosing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency === 'USDC' ? 'USD' : currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = useCallback(async () => {
    await signOut({ callbackUrl: '/login' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-black border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link href="/dashboard" className="flex items-center space-x-2 sm:space-x-3">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded sm:w-10 sm:h-10" />
              <span className="text-base sm:text-xl font-bold text-white">German Lion S.A.</span>
            </Link>
            
            {/* Desktop Nav */}
            <div className="hidden sm:flex items-center space-x-4">
              <span className="text-sm text-gray-400 hidden md:block truncate max-w-[200px]">
                {session?.user?.email}
              </span>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-zinc-800">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-gray-300 hover:text-white hover:bg-zinc-800"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="sm:hidden text-gray-300 hover:text-white hover:bg-zinc-800 p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-zinc-800 py-3 space-y-2">
              <p className="text-xs text-gray-500 px-1 truncate">{session?.user?.email}</p>
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-gray-300 hover:text-white hover:bg-zinc-800">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück zum Dashboard
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-zinc-800"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Title Section */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Handel</h1>
          <p className="text-sm sm:text-base text-gray-500">Automatisches Handelssystem</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <div className="h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-zinc-400 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Active Trade */}
            {activeTrade && (
              <Card className="bg-black border-zinc-800">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-white">Aktiver Handel</h3>
                        <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Automatisches Handelssystem arbeitet</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-green-400 text-xs sm:text-sm flex-shrink-0">
                      <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                      Aktiv
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-zinc-900 rounded-lg p-3 sm:p-4 border border-zinc-800">
                      <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide mb-1">Investierter Betrag</p>
                      <p className="text-lg sm:text-xl font-bold text-white">
                        {formatCurrency(activeTrade.amount, activeTrade.currency)}
                      </p>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-3 sm:p-4 border border-zinc-800">
                      <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide mb-1">Aktuelle Entwicklung</p>
                      <p className={`text-lg sm:text-xl font-bold ${(visualPercent[activeTrade.id] || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(visualPercent[activeTrade.id] || 0) >= 0 ? '+' : ''}
                        {(visualPercent[activeTrade.id] || 0).toFixed(2)}%
                      </p>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-3 sm:p-4 border border-zinc-800">
                      <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide mb-1">Gestartet am</p>
                      <p className="text-base sm:text-lg font-medium text-white">
                        {formatDate(activeTrade.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Info Box - Hidden on smallest screens */}
                  <div className="p-3 sm:p-4 bg-zinc-900 rounded-lg border border-zinc-800 mb-4 sm:mb-6">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-300 text-sm sm:text-base">Automatisches Handelssystem</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          Der endgültige Gewinn wird bei Abschluss berechnet.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setClosingTrade(activeTrade)}
                      className="border-zinc-700 text-gray-300 hover:bg-zinc-800 hover:text-white text-xs sm:text-sm"
                    >
                      <Square className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Handel beenden
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No active trade message */}
            {!activeTrade && trades.length === 0 && (
              <Card className="bg-white border">
                <CardContent className="py-8 sm:py-12 text-center px-4">
                  <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-300 mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Kein aktiver Handel</h3>
                  <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto">
                    Um einen Handel zu starten, nutzen Sie die Überweisungsfunktion im Dashboard.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Closed Trades History */}
            {closedTrades.length > 0 && (
              <Card className="bg-white border">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 sm:mb-4 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Handelshistorie
                  </h3>
                  <div className="divide-y divide-gray-100">
                    {closedTrades.map((trade) => (
                      <div 
                        key={trade.id} 
                        className="flex items-center justify-between py-3 sm:py-4 gap-3"
                      >
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                          <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            trade.status === 'CLOSED_BY_ADMIN' && (trade.profit || 0) > 0
                              ? 'bg-green-50'
                              : trade.status === 'CLOSED_BY_USER'
                              ? 'bg-gray-100'
                              : 'bg-red-50'
                          }`}>
                            {trade.status === 'CLOSED_BY_ADMIN' && (trade.profit || 0) > 0 ? (
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                            ) : trade.status === 'CLOSED_BY_USER' ? (
                              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                            ) : (
                              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                              {formatCurrency(trade.amount, trade.currency)}
                              {trade.tradingPair && (
                                <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-400">({trade.tradingPair})</span>
                              )}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-400 truncate">
                              {formatDate(trade.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {trade.status === 'CLOSED_BY_ADMIN' ? (
                            <>
                              <p className={`font-semibold text-sm sm:text-base ${
                                (trade.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {(trade.profit || 0) >= 0 ? '+' : ''}
                                {formatCurrency(trade.profit || 0, trade.currency)}
                              </p>
                              <p className={`text-xs sm:text-sm ${
                                (trade.profitPercent || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                              }`}>
                                {(trade.profitPercent || 0) >= 0 ? '+' : ''}
                                {(trade.profitPercent || 0).toFixed(2)}%
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-gray-500 text-sm sm:text-base">
                                {formatCurrency(0, trade.currency)}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-400">Beendet</p>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Close Trade Confirmation */}
        <Dialog open={!!closingTrade} onOpenChange={() => setClosingTrade(null)}>
          <DialogContent className="max-w-[90vw] sm:max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Handel beenden?</DialogTitle>
              <DialogDescription className="text-sm">
                Sie erhalten nur Ihren ursprünglichen Einsatz zurück.
              </DialogDescription>
            </DialogHeader>
            <div className="py-3 sm:py-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                <p className="font-medium text-gray-900 text-sm sm:text-base">
                  Betrag: {closingTrade && formatCurrency(closingTrade.amount, closingTrade.currency)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1.5 sm:mt-2">
                  Kein Gewinn oder Verlust bei Selbstbeendigung.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <Button variant="outline" onClick={() => setClosingTrade(null)} disabled={closing} className="w-full sm:w-auto text-sm">
                Abbrechen
              </Button>
              <Button 
                onClick={handleCloseTrade}
                disabled={closing}
                className="bg-black hover:bg-zinc-800 text-white w-full sm:w-auto text-sm"
              >
                {closing ? 'Beenden...' : 'Ja, beenden'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default memo(TradingClient);

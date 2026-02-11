'use client';

import { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  LogOut,
  History,
  Plus,
  Minus,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Transaction {
  id: string;
  type: string;
  symbol: string;
  assetType: string;
  quantity: number;
  price: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
}

interface Transfer {
  id: string;
  type: 'FIAT' | 'CRYPTO';
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  amount: number;
  currency?: string;
  recipient?: string;
  iban?: string;
  purpose?: string;
  cryptoAddress?: string;
  cryptoCurrency?: string;
  createdAt: string;
}

type CombinedItem = {
  itemType: 'transaction' | 'transfer';
  data: Transaction | Transfer;
  createdAt: string;
};

const ITEMS_PER_PAGE = 20;

function TransactionsClient() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [txRes, transfersRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/transfers'),
      ]);
      
      const [txData, transfersData] = await Promise.all([
        txRes.json(),
        transfersRes.json()
      ]);
      
      if (txData?.transactions) setTransactions(txData.transactions);
      if (transfersData?.transfers) setTransfers(transfersData.transfers);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = useCallback(async () => {
    await signOut({ redirect: false });
    router.push('/login');
  }, [router]);

  // Combine and sort all items by date
  const combinedItems: CombinedItem[] = useMemo(() => {
    return [
      ...transactions.map(tx => ({
        itemType: 'transaction' as const,
        data: tx,
        createdAt: tx.createdAt,
      })),
      ...transfers.map(transfer => ({
        itemType: 'transfer' as const,
        data: transfer,
        createdAt: transfer.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactions, transfers]);

  // Пагінація
  const totalPages = Math.ceil(combinedItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = combinedItems.slice(startIndex, endIndex);

  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { icon: Clock, text: 'In Bearbeitung', className: 'bg-yellow-100 text-yellow-800' },
      COMPLETED: { icon: CheckCircle, text: 'Abgeschlossen', className: 'bg-green-100 text-green-800' },
      REJECTED: { icon: XCircle, text: 'Abgelehnt', className: 'bg-red-100 text-red-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;
    
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-black border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/home" className="flex items-center gap-2 sm:gap-3">
              <Image
                src="/logo.png"
                alt="German Lion S.A."
                width={32}
                height={32}
                className="object-contain sm:w-10 sm:h-10"
              />
              <div>
                <h1 className="text-base sm:text-xl font-semibold text-white tracking-tight">
                  German Lion S.A.
                </h1>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden sm:flex items-center gap-1">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-zinc-800">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Zurück
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-300 hover:text-white hover:bg-zinc-800"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Abmelden
              </Button>
            </nav>

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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
            Transaktionsverlauf
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Alle Kauf-, Verkaufs- und Überweisungsvorgänge
          </p>
        </div>

        <Card className="shadow-sm sm:shadow-lg">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <History className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Transaktionen</span>
                <span className="sm:hidden">Verlauf</span>
              </CardTitle>
              {combinedItems.length > 0 && (
                <div className="text-xs sm:text-sm text-gray-600">
                  {combinedItems.length} Einträge
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4">
            {loading ? (
              <div className="flex items-center justify-center py-10 sm:py-12">
                <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : combinedItems?.length === 0 ? (
              <div className="text-center py-10 sm:py-12 text-gray-500">
                <History className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm sm:text-base">Keine Transaktionen</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Datum</TableHead>
                        <TableHead className="text-xs">Typ</TableHead>
                        <TableHead className="text-xs">Details</TableHead>
                        <TableHead className="text-right text-xs">Betrag</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems?.map?.((item) => {
                        if (item.itemType === 'transaction') {
                          const tx = item.data as Transaction;
                          return (
                            <TableRow key={`tx-${tx?.id}`}>
                              <TableCell className="text-xs text-gray-600">
                                {new Date(tx?.createdAt ?? '')?.toLocaleDateString('de-DE', {
                                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                                }) ?? ''}
                              </TableCell>
                              <TableCell>
                                <div className={`flex items-center gap-1.5 text-xs ${tx?.type === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                                  {tx?.type === 'BUY' ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                  <span className="font-medium">{tx?.type === 'BUY' ? 'Kauf' : 'Verkauf'}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="font-medium text-sm">{tx?.symbol}</p>
                                <p className="text-xs text-gray-500">{tx?.quantity?.toFixed?.(2)} × {tx?.price?.toFixed?.(2)}</p>
                              </TableCell>
                              <TableCell className="text-right font-medium text-sm">
                                {tx?.currency} {tx?.totalAmount?.toFixed?.(2)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />OK
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        } else {
                          const transfer = item.data as Transfer;
                          return (
                            <TableRow key={`transfer-${transfer?.id}`}>
                              <TableCell className="text-xs text-gray-600">
                                {new Date(transfer?.createdAt ?? '')?.toLocaleDateString('de-DE', {
                                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                                }) ?? ''}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5 text-blue-600 text-xs">
                                  <Send className="w-3 h-3" />
                                  <span className="font-medium">Transfer</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="font-medium text-sm truncate max-w-[150px]">
                                  {transfer.type === 'FIAT' ? transfer?.recipient : transfer?.cryptoCurrency}
                                </p>
                                <p className="text-xs text-gray-500 truncate max-w-[150px]">
                                  {transfer.type === 'FIAT' ? transfer?.iban : transfer?.cryptoAddress}
                                </p>
                              </TableCell>
                              <TableCell className="text-right font-medium text-sm">
                                {transfer.type === 'FIAT' ? transfer?.currency : transfer?.cryptoCurrency}{' '}
                                {transfer?.amount?.toFixed?.(transfer.type === 'FIAT' ? 2 : 4)}
                              </TableCell>
                              <TableCell>{renderStatusBadge(transfer?.status)}</TableCell>
                            </TableRow>
                          );
                        }
                      }) ?? null}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {paginatedItems?.map?.((item) => {
                    if (item.itemType === 'transaction') {
                      const tx = item.data as Transaction;
                      return (
                        <div key={`tx-${tx?.id}`} className="bg-gray-50 rounded-lg p-3 border">
                          <div className="flex items-center justify-between mb-2">
                            <div className={`flex items-center gap-1.5 text-xs font-medium ${tx?.type === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx?.type === 'BUY' ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                              {tx?.type === 'BUY' ? 'Kauf' : 'Verkauf'}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(tx?.createdAt ?? '')?.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm">{tx?.symbol}</p>
                              <p className="text-xs text-gray-500">{tx?.quantity?.toFixed?.(2)} Stk</p>
                            </div>
                            <p className="font-semibold text-sm">{tx?.currency} {tx?.totalAmount?.toFixed?.(2)}</p>
                          </div>
                        </div>
                      );
                    } else {
                      const transfer = item.data as Transfer;
                      return (
                        <div key={`transfer-${transfer?.id}`} className="bg-gray-50 rounded-lg p-3 border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600">
                              <Send className="w-3 h-3" />
                              Transfer
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(transfer?.createdAt ?? '')?.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 mr-2">
                              <p className="font-semibold text-sm truncate">
                                {transfer.type === 'FIAT' ? transfer?.recipient : transfer?.cryptoCurrency}
                              </p>
                              {renderStatusBadge(transfer?.status)}
                            </div>
                            <p className="font-semibold text-sm flex-shrink-0">
                              {transfer.type === 'FIAT' ? transfer?.currency : transfer?.cryptoCurrency}{' '}
                              {transfer?.amount?.toFixed?.(2)}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  }) ?? null}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-xs sm:text-sm text-gray-600">
                      {currentPage}/{totalPages}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 px-2 sm:px-3 text-xs"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Zurück</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 px-2 sm:px-3 text-xs"
                      >
                        <span className="hidden sm:inline mr-1">Weiter</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default memo(TransactionsClient);

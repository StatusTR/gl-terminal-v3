'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Search, Users, Send, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import AdminTransfers from '@/components/admin-transfers';
import UsersTable from '@/components/admin/users-table';
import Pagination from '@/components/admin/pagination';

interface Balance {
  currency: string;
  amount: number;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  accountNumber: string | null;
  recipientName: string | null;
  iban: string | null;
  paymentPurpose: string | null;
  bic: string | null;
  bankAddress: string | null;
  walletAddress: string | null;
  createdAt: string;
  balances: Balance[];
  _count: {
    portfolio: number;
    transactions: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalUsers: number;
  totalPages: number;
}

interface Trade {
  id: string;
  userId: string;
  user: { email: string; name: string | null };
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

export default function AdminClient() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 15,
    totalUsers: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  // Balance editing state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [newAmount, setNewAmount] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Password editing state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editingPasswordUser, setEditingPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Profile editing state
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [editingProfileUser, setEditingProfileUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    accountNumber: '',
    recipientName: '',
    iban: '',
    paymentPurpose: '',
    bic: '',
    bankAddress: '',
  });

  // Portfolio editing state
  const [isPortfolioDialogOpen, setIsPortfolioDialogOpen] = useState(false);
  const [editingPortfolioUser, setEditingPortfolioUser] = useState<User | null>(null);
  const [portfolioSymbol, setPortfolioSymbol] = useState('');
  const [portfolioQuantity, setPortfolioQuantity] = useState('');
  const [portfolioPrice, setPortfolioPrice] = useState('');

  // Wallet editing state
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [editingWalletUser, setEditingWalletUser] = useState<User | null>(null);
  const [walletAddress, setWalletAddress] = useState('');

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Deposit/Transfer creation state
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [depositUser, setDepositUser] = useState<User | null>(null);
  const [depositType, setDepositType] = useState<'FIAT' | 'CRYPTO'>('FIAT');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositCurrency, setDepositCurrency] = useState('EUR');
  const [depositRecipient, setDepositRecipient] = useState('');
  const [depositIban, setDepositIban] = useState('');
  const [depositStatus, setDepositStatus] = useState<'PENDING' | 'COMPLETED' | 'REJECTED'>('PENDING');
  const [depositDate, setDepositDate] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);

  // Trades management state
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [isCloseTradeDialogOpen, setIsCloseTradeDialogOpen] = useState(false);
  const [closingTradeItem, setClosingTradeItem] = useState<Trade | null>(null);
  const [tradeProfit, setTradeProfit] = useState('');
  const [tradeTradingPair, setTradeTradingPair] = useState('');
  const [tradeComment, setTradeComment] = useState('');
  const [closingTradeLoading, setClosingTradeLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 })); // Скидаємо на 1 сторінку при пошуку
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users with pagination
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL('/api/admin/users', window.location.origin);
      url.searchParams.set('page', pagination.page.toString());
      url.searchParams.set('limit', pagination.limit.toString());
      if (debouncedSearch) {
        url.searchParams.set('search', debouncedSearch);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        toast.error(data.error || 'Ladefehler');
      }
    } catch (error) {
      toast.error('Verbindungsfehler');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch trades
  const fetchTrades = useCallback(async () => {
    try {
      setTradesLoading(true);
      const response = await fetch('/api/admin/trades');
      const data = await response.json();
      if (response.ok) {
        setTrades(data.trades || []);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setTradesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const handleEditBalance = useCallback((user: User) => {
    setEditingUser(user);
    const balance = user.balances.find((b) => b.currency === selectedCurrency);
    setNewAmount(balance?.amount.toString() || '0');
    setIsDialogOpen(true);
  }, [selectedCurrency]);

  const handleUpdateBalance = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}/balance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: selectedCurrency,
          amount: parseFloat(newAmount),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Saldo aktualisiert');
        setIsDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Aktualisierungsfehler');
      }
    } catch (error) {
      toast.error('Verbindungsfehler');
    }
  };

  const handleEditPassword = useCallback((user: User) => {
    setEditingPasswordUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordDialogOpen(true);
  }, []);

  const handleUpdatePassword = async () => {
    if (!editingPasswordUser) return;

    if (!newPassword || newPassword.length < 6) {
      toast.error('Passwort mindestens 6 Zeichen');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${editingPasswordUser.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Passwort geändert');
        setIsPasswordDialogOpen(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error || 'Aktualisierungsfehler');
      }
    } catch (error) {
      toast.error('Verbindungsfehler');
    }
  };

  const handleEditProfile = useCallback((user: User) => {
    setEditingProfileUser(user);
    setProfileData({
      name: user.name || '',
      phone: user.phone || '',
      accountNumber: user.accountNumber || '',
      recipientName: user.recipientName || '',
      iban: user.iban || '',
      paymentPurpose: user.paymentPurpose || '',
      bic: user.bic || '',
      bankAddress: user.bankAddress || '',
    });
    setIsProfileDialogOpen(true);
  }, []);

  const handleUpdateProfile = async () => {
    if (!editingProfileUser) return;

    try {
      const response = await fetch(`/api/admin/users/${editingProfileUser.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Profil aktualisiert');
        setIsProfileDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Aktualisierungsfehler');
      }
    } catch (error) {
      toast.error('Verbindungsfehler');
    }
  };

  // Manage portfolio
  const openPortfolioDialog = (user: User) => {
    setEditingPortfolioUser(user);
    setPortfolioSymbol('');
    setPortfolioQuantity('');
    setPortfolioPrice('');
    setIsPortfolioDialogOpen(true);
  };

  // Wallet editing
  const handleEditWallet = useCallback((user: User) => {
    setEditingWalletUser(user);
    setWalletAddress(user.walletAddress || '');
    setIsWalletDialogOpen(true);
  }, []);

  const handleUpdateWallet = async () => {
    if (!editingWalletUser) return;

    try {
      const response = await fetch(`/api/admin/users/${editingWalletUser.id}/wallet`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: walletAddress.trim() || null }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Wallet-Adresse aktualisiert');
        setIsWalletDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Aktualisierungsfehler');
      }
    } catch (error) {
      toast.error('Verbindungsfehler');
    }
  };

  // Delete user
  const handleDeleteUser = useCallback((user: User) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Benutzer erfolgreich gelöscht');
        setIsDeleteDialogOpen(false);
        setDeletingUser(null);
        fetchUsers();
      } else {
        toast.error(data.error || 'Löschfehler');
      }
    } catch (error) {
      toast.error('Verbindungsfehler');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Login as user (impersonation)
  const handleLoginAsUser = async (user: User) => {
    if (loginLoading) return;
    
    try {
      setLoginLoading(true);
      
      // Use NextAuth signIn with the user's credentials
      // We'll use a special admin impersonation flow
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (response.ok) {
        // Sign in as the target user
        const result = await signIn('credentials', {
          email: user.email,
          password: data.token, // Special admin token
          redirect: false,
          adminImpersonate: 'true',
        });

        if (result?.ok) {
          toast.success(`Angemeldet als ${user.email}`);
          router.push('/dashboard');
        } else {
          toast.error('Anmeldefehler');
        }
      } else {
        toast.error(data.error || 'Fehler beim Anmelden');
      }
    } catch (error) {
      toast.error('Verbindungsfehler');
    } finally {
      setLoginLoading(false);
    }
  };

  // Open deposit dialog for a user
  const handleOpenDeposit = (user: User) => {
    setDepositUser(user);
    setDepositType('FIAT');
    setDepositAmount('');
    setDepositCurrency('EUR');
    setDepositRecipient('');
    setDepositIban('');
    setDepositStatus('PENDING');
    setDepositDate('');
    setIsDepositDialogOpen(true);
  };

  // Create deposit/transfer entry
  const handleCreateDeposit = async () => {
    if (!depositUser || !depositAmount) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    try {
      setDepositLoading(true);
      const response = await fetch('/api/admin/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: depositUser.id,
          type: depositType,
          amount: depositAmount,
          currency: depositCurrency,
          recipientName: depositRecipient || null,
          iban: depositIban || null,
          status: depositStatus,
          createdAt: depositDate || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Transaktion erfolgreich erstellt');
        setIsDepositDialogOpen(false);
        setDepositUser(null);
      } else {
        toast.error(data.error || 'Fehler beim Erstellen');
      }
    } catch (error) {
      toast.error('Verbindungsfehler');
    } finally {
      setDepositLoading(false);
    }
  };

  // Open close trade dialog
  const handleOpenCloseTrade = (trade: Trade) => {
    setClosingTradeItem(trade);
    setTradeProfit('');
    setTradeTradingPair('');
    setTradeComment('');
    setIsCloseTradeDialogOpen(true);
  };

  // Close trade by admin
  const handleCloseTrade = async () => {
    if (!closingTradeItem) return;

    try {
      setClosingTradeLoading(true);
      const response = await fetch(`/api/admin/trades/${closingTradeItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profit: tradeProfit,
          tradingPair: tradeTradingPair || null,
          adminComment: tradeComment || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Handel erfolgreich geschlossen');
        setIsCloseTradeDialogOpen(false);
        setClosingTradeItem(null);
        fetchTrades();
      } else {
        toast.error(data.error || 'Fehler beim Schließen');
      }
    } catch (error) {
      toast.error('Verbindungsfehler');
    } finally {
      setClosingTradeLoading(false);
    }
  };

  const handleUpdatePortfolio = async () => {
    if (!editingPortfolioUser) return;

    const quantity = parseFloat(portfolioQuantity);
    const price = parseFloat(portfolioPrice);

    if (!portfolioSymbol || isNaN(quantity) || isNaN(price)) {
      toast.error('Alle Felder korrekt ausfüllen');
      return;
    }

    if (quantity < 0 || price < 0) {
      toast.error('Menge und Preis müssen positiv sein');
      return;
    }

    try {
      const response = await fetch(`/api/admin/portfolio/${editingPortfolioUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: portfolioSymbol.toUpperCase(),
          quantity,
          averageBuyPrice: price,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(quantity === 0 ? 'Vermögenswert entfernt' : 'Portfolio aktualisiert');
        setIsPortfolioDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Aktualisierungsfehler');
      }
    } catch (error) {
      toast.error('Verbindungsfehler');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8" />
              Verwaltungspanel
            </h1>
            <p className="text-gray-600 mt-1">
              Verwaltung von Benutzern, Salden und Überweisungen
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2 border-gray-300 hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-xl">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Benutzer
            </TabsTrigger>
            <TabsTrigger value="trades">
              <TrendingUp className="w-4 h-4 mr-2" />
              Handel
            </TabsTrigger>
            <TabsTrigger value="transfers">
              <Send className="w-4 h-4 mr-2" />
              Überweisungen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Benutzerverwaltung</CardTitle>
                <CardDescription>
                  Gesamtzahl der Benutzer: {pagination.totalUsers}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Suche nach E-Mail oder Name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Users Table */}
                <UsersTable
                  users={users}
                  loading={loading}
                  onEditBalance={handleEditBalance}
                  onEditPassword={handleEditPassword}
                  onEditProfile={handleEditProfile}
                  onEditPortfolio={openPortfolioDialog}
                  onEditWallet={handleEditWallet}
                  onDeleteUser={handleDeleteUser}
                  onLoginAsUser={handleLoginAsUser}
                  onAddDeposit={handleOpenDeposit}
                />

                {/* Pagination */}
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
                  disabled={loading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                  Handel verwalten
                </CardTitle>
                <CardDescription>
                  Aktive und abgeschlossene Handelspositionenaller Benutzer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tradesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                  </div>
                ) : trades.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Keine Handelspositionenvorhanden
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Active Trades */}
                    {trades.filter(t => t.status === 'ACTIVE').length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                          Aktive Handelspositionenen ({trades.filter(t => t.status === 'ACTIVE').length})
                        </h3>
                        <div className="space-y-3">
                          {trades.filter(t => t.status === 'ACTIVE').map(trade => (
                            <div 
                              key={trade.id} 
                              className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {trade.user?.email || 'Unknown'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {trade.amount.toLocaleString('de-DE', { style: 'currency', currency: trade.currency })}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Gestartet: {new Date(trade.createdAt).toLocaleString('de-DE')}
                                </p>
                              </div>
                              <Button 
                                onClick={() => handleOpenCloseTrade(trade)}
                                className="bg-amber-500 hover:bg-amber-600 text-black"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Schließen
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Closed Trades */}
                    {trades.filter(t => t.status !== 'ACTIVE').length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">
                          Abgeschlossene Handelspositionenen ({trades.filter(t => t.status !== 'ACTIVE').length})
                        </h3>
                        <div className="space-y-2">
                          {trades.filter(t => t.status !== 'ACTIVE').map(trade => (
                            <div 
                              key={trade.id} 
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {trade.user?.email || 'Unknown'}
                                  {trade.tradingPair && (
                                    <span className="ml-2 text-sm text-gray-500">({trade.tradingPair})</span>
                                  )}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {trade.amount.toLocaleString('de-DE', { style: 'currency', currency: trade.currency })}
                                  {trade.status === 'CLOSED_BY_ADMIN' && (
                                    <span className={`ml-2 font-medium ${(trade.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {(trade.profit || 0) >= 0 ? '+' : ''}
                                      {(trade.profit || 0).toLocaleString('de-DE', { style: 'currency', currency: trade.currency })}
                                      ({(trade.profitPercent || 0).toFixed(2)}%)
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(trade.createdAt).toLocaleString('de-DE')}
                                  {trade.closedAt && ` → ${new Date(trade.closedAt).toLocaleString('de-DE')}`}
                                </p>
                              </div>
                              <div className="text-right">
                                {trade.status === 'CLOSED_BY_USER' ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-600">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Selbst beendet
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Admin geschlossen
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transfers">
            <AdminTransfers />
          </TabsContent>
        </Tabs>

        {/* Balance Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Saldo bearbeiten</DialogTitle>
              <DialogDescription>
                {editingUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Währung</Label>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CHF">CHF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Betrag</Label>
                <Input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleUpdateBalance}>Speichern</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Password Edit Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Passwort ändern</DialogTitle>
              <DialogDescription>
                {editingPasswordUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Neues Passwort</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                />
              </div>
              <div>
                <Label>Passwort bestätigen</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Passwort wiederholen"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleUpdatePassword}>Speichern</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Profile Edit Dialog */}
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Profil bearbeiten</DialogTitle>
              <DialogDescription>
                {editingProfileUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Telefon</Label>
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Kontonummer</Label>
                <Input
                  value={profileData.accountNumber}
                  onChange={(e) => setProfileData({ ...profileData, accountNumber: e.target.value })}
                  placeholder="Kontonummer eingeben"
                />
              </div>
              <div>
                <Label>Empfängername</Label>
                <Input
                  value={profileData.recipientName}
                  onChange={(e) => setProfileData({ ...profileData, recipientName: e.target.value })}
                />
              </div>
              <div>
                <Label>IBAN</Label>
                <Input
                  value={profileData.iban}
                  onChange={(e) => setProfileData({ ...profileData, iban: e.target.value })}
                />
              </div>
              <div>
                <Label>Verwendungszweck</Label>
                <Input
                  value={profileData.paymentPurpose}
                  onChange={(e) => setProfileData({ ...profileData, paymentPurpose: e.target.value })}
                />
              </div>
              <div>
                <Label>BIC</Label>
                <Input
                  value={profileData.bic}
                  onChange={(e) => setProfileData({ ...profileData, bic: e.target.value })}
                />
              </div>
              <div>
                <Label>Bankadresse</Label>
                <Input
                  value={profileData.bankAddress}
                  onChange={(e) => setProfileData({ ...profileData, bankAddress: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleUpdateProfile}>Speichern</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Portfolio Dialog */}
        <Dialog open={isPortfolioDialogOpen} onOpenChange={setIsPortfolioDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Portfolio-Verwaltung</DialogTitle>
              <DialogDescription>
                Додайте або оновіть актив для користувача {editingPortfolioUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Vermögenswert-Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="Zum Beispiel: ENER6Y, BTC, SAP"
                  value={portfolioSymbol}
                  onChange={(e) => setPortfolioSymbol(e.target.value.toUpperCase())}
                />
                <p className="text-xs text-gray-500">
                  Введіть WKN код для акцій або символ для криптовалют
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Menge</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={portfolioQuantity}
                  onChange={(e) => setPortfolioQuantity(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Введіть 0 щоб видалити актив з портфеля
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Durchschnittlicher Kaufpreis</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={portfolioPrice}
                  onChange={(e) => setPortfolioPrice(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Für Aktien - nach Marktpreis (EUR), für Kryptowährungen - in USD
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPortfolioDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleUpdatePortfolio}>
                {portfolioQuantity === '0' ? 'Видалити' : 'Speichern'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Wallet Edit Dialog */}
        <Dialog open={isWalletDialogOpen} onOpenChange={setIsWalletDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Wallet-Adresse bearbeiten</DialogTitle>
              <DialogDescription>
                {editingWalletUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="walletAddress">Wallet-Adresse</Label>
                <Input
                  id="walletAddress"
                  placeholder="z.B. 0x1234...abcd oder bc1q..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Ethereum, Bitcoin oder andere Wallet-Adresse eingeben. Leer lassen zum Entfernen.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsWalletDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleUpdateWallet} className="bg-amber-500 hover:bg-amber-600 text-black">
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">Benutzer löschen</DialogTitle>
              <DialogDescription>
                Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-medium text-gray-900">{deletingUser?.email}</p>
                {deletingUser?.name && (
                  <p className="text-sm text-gray-600">{deletingUser.name}</p>
                )}
                <p className="text-xs text-red-600 mt-2">
                  Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten des Benutzers (Salden, Portfolio, Transaktionen) werden gelöscht.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deleteLoading}
              >
                Nein, abbrechen
              </Button>
              <Button 
                onClick={confirmDeleteUser}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteLoading ? 'Löschen...' : 'Ja, löschen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Deposit/Transfer Dialog */}
        <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Transaktion hinzufügen</DialogTitle>
              <DialogDescription>
                {depositUser?.email} - Neue Transaktion erstellen
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Typ</Label>
                  <Select value={depositType} onValueChange={(v) => setDepositType(v as 'FIAT' | 'CRYPTO')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIAT">Überweisung</SelectItem>
                      <SelectItem value="CRYPTO">Krypto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Währung</Label>
                  <Select value={depositCurrency} onValueChange={setDepositCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CHF">CHF</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositAmount">Betrag *</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositRecipient">Empfänger / Details</Label>
                <Input
                  id="depositRecipient"
                  placeholder="z.B. Max Mustermann"
                  value={depositRecipient}
                  onChange={(e) => setDepositRecipient(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositIban">IBAN / Adresse</Label>
                <Input
                  id="depositIban"
                  placeholder="z.B. DE89..."
                  value={depositIban}
                  onChange={(e) => setDepositIban(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={depositStatus} onValueChange={(v) => setDepositStatus(v as 'PENDING' | 'COMPLETED' | 'REJECTED')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">In Bearbeitung</SelectItem>
                      <SelectItem value="COMPLETED">Abgeschlossen</SelectItem>
                      <SelectItem value="REJECTED">Abgelehnt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depositDate">Datum</Label>
                  <Input
                    id="depositDate"
                    type="datetime-local"
                    value={depositDate}
                    onChange={(e) => setDepositDate(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Leer = aktuelles Datum</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDepositDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button 
                onClick={handleCreateDeposit}
                disabled={depositLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {depositLoading ? 'Erstellen...' : 'Transaktion erstellen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Close Trade Dialog */}
        <Dialog open={isCloseTradeDialogOpen} onOpenChange={setIsCloseTradeDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Handel schließen</DialogTitle>
              <DialogDescription>
                {closingTradeItem?.user?.email} - {closingTradeItem?.amount.toLocaleString('de-DE', { style: 'currency', currency: closingTradeItem?.currency || 'EUR' })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Investierter Betrag:</strong> {closingTradeItem?.amount.toLocaleString('de-DE', { style: 'currency', currency: closingTradeItem?.currency || 'EUR' })}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Der Kunde erhält den investierten Betrag plus/minus den unten eingegebenen Gewinn/Verlust.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tradeProfit">Gewinn/Verlust ({closingTradeItem?.currency})</Label>
                <Input
                  id="tradeProfit"
                  type="number"
                  step="0.01"
                  placeholder="z.B. 10 für +10 EUR oder -5 für Verlust"
                  value={tradeProfit}
                  onChange={(e) => setTradeProfit(e.target.value)}
                />
                {tradeProfit && closingTradeItem && (
                  <p className="text-sm text-gray-600">
                    Auszahlung: <strong>{(closingTradeItem.amount + parseFloat(tradeProfit || '0')).toLocaleString('de-DE', { style: 'currency', currency: closingTradeItem.currency })}</strong>
                    {' '}({((parseFloat(tradeProfit || '0') / closingTradeItem.amount) * 100).toFixed(2)}%)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tradeTradingPair">Handelspaar (optional)</Label>
                <Input
                  id="tradeTradingPair"
                  placeholder="z.B. ETH/EUR, BTC/USD"
                  value={tradeTradingPair}
                  onChange={(e) => setTradeTradingPair(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tradeComment">Kommentar (optional)</Label>
                <Input
                  id="tradeComment"
                  placeholder="z.B. Marktanalyse erfolgreich"
                  value={tradeComment}
                  onChange={(e) => setTradeComment(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsCloseTradeDialogOpen(false)} disabled={closingTradeLoading}>
                Abbrechen
              </Button>
              <Button 
                onClick={handleCloseTrade}
                disabled={closingTradeLoading || !tradeProfit}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                {closingTradeLoading ? 'Schließen...' : 'Handel schließen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

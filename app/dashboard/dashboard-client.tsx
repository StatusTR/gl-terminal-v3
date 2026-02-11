'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  History,
  LogOut,
  Shield,
  UserCircle,
  Menu,
  X,
  TrendingUp,
} from 'lucide-react';
import Image from 'next/image';
import BalanceCards from '@/components/balance-cards';
import PortfolioTable from '@/components/portfolio-table';
import TradeModal from '@/components/trade-modal';
import TransferModal from '@/components/transfer-modal';
import Link from 'next/link';

export default function DashboardClient() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const handleTradeComplete = () => {
    setRefreshKey((prev) => prev + 1);
    setShowBuyModal(false);
    setShowSellModal(false);
    setShowTransferModal(false);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - Professional Black */}
      <header className="sticky top-0 z-40 w-full bg-black border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/home" className="flex items-center gap-2 sm:gap-3">
              <Image
                src="/logo.png"
                alt="German Lion S.A."
                width={36}
                height={36}
                className="object-contain sm:w-10 sm:h-10"
              />
              <div className="hidden xs:block">
                <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                  German Lion S.A.
                </h1>
                <p className="text-xs text-gray-400 truncate max-w-[150px] sm:max-w-none">
                  {session?.user?.email}
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/trading">
                <Button variant="ghost" size="sm" className="text-amber-500 hover:text-amber-400 hover:bg-zinc-800">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Handel
                </Button>
              </Link>
              <Link href="/transactions">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-zinc-800">
                  <History className="w-4 h-4 mr-1" />
                  Verlauf
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-zinc-800">
                  <UserCircle className="w-4 h-4 mr-1" />
                  Profil
                </Button>
              </Link>
              {session?.user?.role === 'ADMIN' && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="text-amber-500 hover:text-amber-400 hover:bg-zinc-800">
                    <Shield className="w-4 h-4 mr-1" />
                    Admin
                  </Button>
                </Link>
              )}
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
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-zinc-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-zinc-900 border-t border-zinc-800">
            <div className="px-4 py-3 space-y-1">
              <div className="pb-2 mb-2 border-b border-zinc-800">
                <p className="text-sm text-gray-400 truncate">{session?.user?.email}</p>
              </div>
              <Link href="/trading" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-amber-500 hover:text-amber-400 hover:bg-zinc-800">
                  <TrendingUp className="w-4 h-4 mr-3" />
                  Handel
                </Button>
              </Link>
              <Link href="/transactions" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-zinc-800">
                  <History className="w-4 h-4 mr-3" />
                  Verlauf
                </Button>
              </Link>
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-zinc-800">
                  <UserCircle className="w-4 h-4 mr-3" />
                  Profil
                </Button>
              </Link>
              {session?.user?.role === 'ADMIN' && (
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-amber-500 hover:text-amber-400 hover:bg-zinc-800">
                    <Shield className="w-4 h-4 mr-3" />
                    Admin
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-zinc-800"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Abmelden
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
            Portfolio-Übersicht
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Verwaltung Ihrer Vermögenswerte und Salden
          </p>
        </div>

        {/* Balances */}
        <BalanceCards 
          key={`balance-${refreshKey}`}
          onTransferClick={() => setShowTransferModal(true)}
          onRefresh={handleRefresh}
        />

        {/* Portfolio */}
        <div className="mt-8">
          <PortfolioTable
            key={`portfolio-${refreshKey}`}
            onBuy={() => setShowBuyModal(true)}
            onSell={() => setShowSellModal(true)}
            onSellClick={() => setShowSellModal(true)}
          />
        </div>
      </main>

      {/* Trade Modals */}
      {showBuyModal && (
        <TradeModal
          mode="buy"
          onClose={() => setShowBuyModal(false)}
          onSuccess={handleTradeComplete}
        />
      )}
      {showSellModal && (
        <TradeModal
          mode="sell"
          onClose={() => setShowSellModal(false)}
          onSuccess={handleTradeComplete}
        />
      )}
      {showTransferModal && (
        <TransferModal
          onClose={() => setShowTransferModal(false)}
          onSuccess={handleTradeComplete}
        />
      )}
    </div>
  );
}

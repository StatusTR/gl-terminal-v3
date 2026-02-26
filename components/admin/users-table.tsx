'use client';

import { memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Key, UserCog, Briefcase, Wallet, Trash2, LogIn, PlusCircle, UserCheck } from 'lucide-react';
import { getAdminIcon } from '@/lib/admin-icons';

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
  assignedAdminId: string | null;
  assignedAdmin: {
    id: string;
    email: string;
    name: string | null;
    adminIcon: string | null;
  } | null;
  createdAt: string;
  balances: Balance[];
  _count: {
    portfolio: number;
    transactions: number;
  };
}

interface UsersTableProps {
  users: User[];
  loading: boolean;
  isSuperAdmin?: boolean;
  onEditBalance: (user: User) => void;
  onEditPassword: (user: User) => void;
  onEditProfile: (user: User) => void;
  onEditPortfolio: (user: User) => void;
  onEditWallet: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onLoginAsUser: (user: User) => void;
  onAddDeposit: (user: User) => void;
  onAssignUser?: (user: User) => void;
}

function UsersTable({ users, loading, isSuperAdmin, onEditBalance, onEditPassword, onEditProfile, onEditPortfolio, onEditWallet, onDeleteUser, onLoginAsUser, onAddDeposit, onAssignUser }: UsersTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Keine Benutzer gefunden
      </div>
    );
  }

  // Helper function to truncate wallet address
  const truncateWallet = (address: string | null) => {
    if (!address) return null;
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>E-Mail</TableHead>
          <TableHead>Name</TableHead>
          {isSuperAdmin && <TableHead>Zugewiesen</TableHead>}
          <TableHead>Wallet</TableHead>
          <TableHead>Salden</TableHead>
          <TableHead className="text-right">Aktionen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const adminIcon = user.assignedAdmin ? getAdminIcon(user.assignedAdmin.adminIcon) : null;
          
          return (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>{user.name || '-'}</TableCell>
              {isSuperAdmin && (
                <TableCell>
                  {user.assignedAdmin ? (
                    <div className="flex items-center gap-1">
                      {adminIcon && <span title={adminIcon.name}>{adminIcon.emoji}</span>}
                      <span className="text-sm text-gray-600">
                        {user.assignedAdmin.name || user.assignedAdmin.email.split('@')[0]}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Nicht zugewiesen</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                {user.walletAddress ? (
                  <span className="font-mono text-xs text-gray-600" title={user.walletAddress}>
                    {truncateWallet(user.walletAddress)}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2 flex-wrap">
                  {user.balances.map((balance) => (
                    <Badge key={balance.currency} variant="outline" className="text-xs">
                      {balance.currency}: {balance.amount.toFixed(2)}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end flex-wrap">
                  {isSuperAdmin && onAssignUser && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAssignUser(user)}
                      title="Administrator zuweisen"
                      className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                    >
                      <UserCheck className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditBalance(user)}
                    title="Saldo bearbeiten"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditPassword(user)}
                    title="Passwort ändern"
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditProfile(user)}
                    title="Profil bearbeiten"
                  >
                    <UserCog className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditPortfolio(user)}
                    title="Portfolio verwalten"
                  >
                    <Briefcase className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditWallet(user)}
                    title="Wallet bearbeiten"
                  >
                    <Wallet className="h-4 w-4 text-amber-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddDeposit(user)}
                    title="Transaktion hinzufügen"
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLoginAsUser(user)}
                    title="Als Benutzer anmelden"
                    className="text-green-600 hover:text-green-800 hover:bg-green-50"
                  >
                    <LogIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteUser(user)}
                    title="Benutzer löschen"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default memo(UsersTable);

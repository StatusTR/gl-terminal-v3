'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Send, Clock, CheckCircle, XCircle, RefreshCcw, Filter } from 'lucide-react';

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
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export default function AdminTransfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<Transfer[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchTransfers();
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredTransfers(transfers);
    } else {
      setFilteredTransfers(transfers.filter(t => t.status === statusFilter));
    }
  }, [statusFilter, transfers]);

  const fetchTransfers = async () => {
    try {
      const res = await fetch('/api/admin/transfers');
      const data = await res.json();
      if (data?.transfers) {
        setTransfers(data.transfers);
        setFilteredTransfers(data.transfers);
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
      toast.error('Fehler beim Laden der Überweisungen');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStatus = (transfer: Transfer) => {
    setEditingTransfer(transfer);
    setNewStatus(transfer.status);
    setIsDialogOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!editingTransfer || !newStatus) return;

    try {
      const res = await fetch(`/api/admin/transfers/${editingTransfer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Aktualisieren des Status');
      }

      toast.success('Überweisungsstatus aktualisiert');
      setIsDialogOpen(false);
      setEditingTransfer(null);
      fetchTransfers(); // Refresh data
    } catch (error: any) {
      console.error('Error updating transfer status:', error);
      toast.error(error.message || 'Fehler beim Aktualisieren des Status');
    }
  };

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

  const pendingCount = transfers.filter(t => t.status === 'PENDING').length;
  const completedCount = transfers.filter(t => t.status === 'COMPLETED').length;
  const rejectedCount = transfers.filter(t => t.status === 'REJECTED').length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Bearbeitung</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Abgeschlossen</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Abgelehnt</p>
                <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Benutzerüberweisungen
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle ({transfers.length})</SelectItem>
                  <SelectItem value="PENDING">In Bearbeitung ({pendingCount})</SelectItem>
                  <SelectItem value="COMPLETED">Abgeschlossen ({completedCount})</SelectItem>
                  <SelectItem value="REJECTED">Abgelehnt ({rejectedCount})</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={fetchTransfers}>
                <RefreshCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransfers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Send className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Keine Überweisungen</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transfer.user.email}</p>
                        {transfer.user.name && (
                          <p className="text-xs text-gray-500">{transfer.user.name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(transfer.createdAt).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {transfer.type === 'FIAT' ? 'Fiat' : 'Krypto'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {transfer.type === 'FIAT' ? (
                        <div>
                          <p className="text-sm font-medium">{transfer.recipient}</p>
                          <p className="text-xs text-gray-500">IBAN: {transfer.iban}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium">{transfer.cryptoCurrency}</p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {transfer.cryptoAddress}
                          </p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {transfer.type === 'FIAT' ? transfer.currency : transfer.cryptoCurrency}{' '}
                      {transfer.amount.toFixed(transfer.type === 'FIAT' ? 2 : 8)}
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(transfer.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditStatus(transfer)}
                        disabled={transfer.status !== 'PENDING'}
                      >
                        Змінити
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Status Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Змінити статус переказу</DialogTitle>
            <DialogDescription>
              Оберіть новий статус для переказу
            </DialogDescription>
          </DialogHeader>
          {editingTransfer && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Benutzer:</span>
                  <span className="text-sm">{editingTransfer.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Betrag:</span>
                  <span className="text-sm font-medium">
                    {editingTransfer.type === 'FIAT' ? editingTransfer.currency : editingTransfer.cryptoCurrency}{' '}
                    {editingTransfer.amount.toFixed(editingTransfer.type === 'FIAT' ? 2 : 8)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Neuer Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={handleSaveStatus}>
              Зберегти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

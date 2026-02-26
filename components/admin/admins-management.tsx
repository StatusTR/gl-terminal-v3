'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Shield, Key, Trash2, Edit, Users, Crown, Eye, EyeOff } from 'lucide-react';
import { ADMIN_ICONS, getAdminIcon } from '@/lib/admin-icons';

interface Admin {
  id: string;
  email: string;
  name: string | null;
  role: string;
  adminIcon: string | null;
  createdAt: string;
  _count: {
    managedClients: number;
  };
}

interface AdminsManagementProps {
  currentAdminId: string;
}

export default function AdminsManagement({ currentAdminId }: AdminsManagementProps) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  // Create admin dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createIcon, setCreateIcon] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Edit admin dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editIcon, setEditIcon] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState<Admin | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/admins');
      const data = await res.json();
      if (res.ok) {
        setAdmins(data.admins || []);
      } else {
        toast.error(data.error || 'Fehler beim Laden der Administratoren');
      }
    } catch (error) {
      toast.error('Serverfehler');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleCreateAdmin = async () => {
    if (!createEmail || !createPassword) {
      toast.error('E-Mail und Passwort sind erforderlich');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: createEmail,
          password: createPassword,
          name: createName || null,
          adminIcon: createIcon || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Administrator erfolgreich erstellt');
        setIsCreateDialogOpen(false);
        setCreateEmail('');
        setCreatePassword('');
        setCreateName('');
        setCreateIcon('');
        fetchAdmins();
      } else {
        toast.error(data.error || 'Fehler beim Erstellen');
      }
    } catch {
      toast.error('Serverfehler');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditAdmin = async () => {
    if (!editingAdmin) return;

    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/admins/${editingAdmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName || null,
          password: editPassword || undefined,
          adminIcon: editIcon || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Administrator aktualisiert');
        setIsEditDialogOpen(false);
        setEditingAdmin(null);
        fetchAdmins();
      } else {
        toast.error(data.error || 'Fehler beim Aktualisieren');
      }
    } catch {
      toast.error('Serverfehler');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/admins/${deletingAdmin.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Administrator gelöscht');
        setIsDeleteDialogOpen(false);
        setDeletingAdmin(null);
        fetchAdmins();
      } else {
        toast.error(data.error || 'Fehler beim Löschen');
      }
    } catch {
      toast.error('Serverfehler');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditDialog = (admin: Admin) => {
    setEditingAdmin(admin);
    setEditName(admin.name || '');
    setEditPassword('');
    setEditIcon(admin.adminIcon || '');
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Administratoren verwalten
            </CardTitle>
            <CardDescription>
              Erstellen und verwalten Sie Administratoren für Ihr Team
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Administrator hinzufügen
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {admins.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Keine Administratoren vorhanden</p>
            ) : (
              <div className="grid gap-4">
                {admins.map((admin) => {
                  const icon = getAdminIcon(admin.adminIcon);
                  const isSuperAdmin = admin.role === 'SUPER_ADMIN';
                  const isCurrentUser = admin.id === currentAdminId;

                  return (
                    <div
                      key={admin.id}
                      className={`border rounded-lg p-4 flex items-center justify-between ${
                        isSuperAdmin ? 'bg-amber-50 border-amber-200' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                          {icon ? icon.emoji : <Shield className="h-6 w-6 text-gray-400" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{admin.name || admin.email}</span>
                            {isSuperAdmin && (
                              <Badge className="bg-amber-500 text-black">
                                <Crown className="h-3 w-3 mr-1" />
                                Hauptadmin
                              </Badge>
                            )}
                            {isCurrentUser && (
                              <Badge variant="outline">Sie</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{admin.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {admin._count.managedClients} Kunden zugewiesen
                            </span>
                          </div>
                        </div>
                      </div>

                      {!isSuperAdmin && !isCurrentUser && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(admin)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setDeletingAdmin(admin);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neuen Administrator erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Administrator für Ihr Team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>E-Mail *</Label>
              <Input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Passwort *</Label>
              <div className="relative">
                <Input
                  type={showCreatePassword ? 'text' : 'password'}
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Name (optional)</Label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Name des Administrators"
              />
            </div>

            <div className="space-y-2">
              <Label>Symbol wählen</Label>
              <div className="grid grid-cols-5 gap-2">
                {ADMIN_ICONS.map((iconItem) => (
                  <button
                    key={iconItem.id}
                    type="button"
                    onClick={() => setCreateIcon(iconItem.id)}
                    className={`p-3 rounded-lg border-2 text-2xl transition-all ${
                      createIcon === iconItem.id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={iconItem.name}
                  >
                    {iconItem.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateAdmin}
              disabled={createLoading}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {createLoading ? 'Erstellen...' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Administrator bearbeiten</DialogTitle>
            <DialogDescription>
              {editingAdmin?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Name des Administrators"
              />
            </div>

            <div className="space-y-2">
              <Label>Neues Passwort (leer lassen, um nicht zu ändern)</Label>
              <div className="relative">
                <Input
                  type={showEditPassword ? 'text' : 'password'}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Neues Passwort"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Symbol wählen</Label>
              <div className="grid grid-cols-5 gap-2">
                {ADMIN_ICONS.map((iconItem) => (
                  <button
                    key={iconItem.id}
                    type="button"
                    onClick={() => setEditIcon(iconItem.id)}
                    className={`p-3 rounded-lg border-2 text-2xl transition-all ${
                      editIcon === iconItem.id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={iconItem.name}
                  >
                    {iconItem.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleEditAdmin}
              disabled={editLoading}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {editLoading ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Administrator löschen?</DialogTitle>
            <DialogDescription>
              Möchten Sie den Administrator <strong>{deletingAdmin?.email}</strong> wirklich löschen?
              Alle zugewiesenen Kunden werden freigegeben.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAdmin}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Löschen...' : 'Löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Search, Key, UserCog, Users, Send } from 'lucide-react';
import Link from 'next/link';
import AdminTransfers from '@/components/admin-transfers';

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
  recipientName: string | null;
  iban: string | null;
  paymentPurpose: string | null;
  bic: string | null;
  bankAddress: string | null;
  createdAt: string;
  balances: Balance[];
  _count: {
    portfolio: number;
    transactions: number;
  };
}

export default function AdminClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [newAmount, setNewAmount] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editingPasswordUser, setEditingPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [editingProfileUser, setEditingProfileUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    recipientName: '',
    iban: '',
    paymentPurpose: '',
    bic: '',
    bankAddress: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredUsers(
        users.filter(
          (user) =>
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setFilteredUsers(data.users);
      } else {
        toast.error(data.error || 'Failed to fetch users');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBalance = (user: User) => {
    setEditingUser(user);
    const balance = user.balances.find((b) => b.currency === selectedCurrency);
    setNewAmount(balance?.amount.toString() || '0');
    setIsDialogOpen(true);
  };

  const handleUpdateBalance = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}/balance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: selectedCurrency,
          amount: parseFloat(newAmount),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Balance updated successfully');
        setIsDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to update balance');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleEditPassword = (user: User) => {
    setEditingPasswordUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordDialogOpen(true);
  };

  const handleUpdatePassword = async () => {
    if (!editingPasswordUser) return;

    if (!newPassword) {
      toast.error('Password is required');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${editingPasswordUser.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password updated successfully');
        setIsPasswordDialogOpen(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error || 'Failed to update password');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleEditProfile = (user: User) => {
    setEditingProfileUser(user);
    setProfileData({
      name: user.name || '',
      phone: user.phone || '',
      recipientName: user.recipientName || '',
      iban: user.iban || '',
      paymentPurpose: user.paymentPurpose || '',
      bic: user.bic || '',
      bankAddress: user.bankAddress || '',
    });
    setIsProfileDialogOpen(true);
  };

  const handleUpdateProfile = async () => {
    if (!editingProfileUser) return;

    try {
      const response = await fetch(`/api/admin/users/${editingProfileUser.id}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Profile updated successfully');
        setIsProfileDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const getBalance = (user: User, currency: string) => {
    const balance = user.balances.find((b) => b.currency === currency);
    return balance ? balance.amount.toFixed(2) : '0.00';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Admin Control Panel
          </h1>
          <p className="text-gray-600 mt-2">Manage users and their balances</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Користувачі
            </TabsTrigger>
            <TabsTrigger value="transfers" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Перекази
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by email or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
          <CardHeader>
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            <CardDescription>View and manage user accounts and balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">EUR</TableHead>
                    <TableHead className="text-right">USD</TableHead>
                    <TableHead className="text-right">GBP</TableHead>
                    <TableHead className="text-center">Portfolio</TableHead>
                    <TableHead className="text-center">Transactions</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.name || '-'}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.role === 'ADMIN'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        €{getBalance(user, 'EUR')}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${getBalance(user, 'USD')}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        £{getBalance(user, 'GBP')}
                      </TableCell>
                      <TableCell className="text-center">
                        {user._count.portfolio}
                      </TableCell>
                      <TableCell className="text-center">
                        {user._count.transactions}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditBalance(user)}
                            title="Edit Balance"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPassword(user)}
                            title="Change Password"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProfile(user)}
                            title="Edit Profile"
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Transfers Tab */}
          <TabsContent value="transfers">
            <AdminTransfers />
          </TabsContent>
        </Tabs>

        {/* Edit Balance Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Balance</DialogTitle>
              <DialogDescription>
                Update the balance for {editingUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">New Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              {editingUser && (
                <div className="text-sm text-gray-600">
                  Current balance: {getBalance(editingUser, selectedCurrency)} {selectedCurrency}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateBalance}>Update Balance</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Set a new password for {editingPasswordUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="text-sm text-gray-500">
                Password must be at least 6 characters long
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePassword}>Change Password</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Profile Dialog */}
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User Profile</DialogTitle>
              <DialogDescription>
                Update profile and banking details for {editingProfileUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Banking Details Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Banking Details</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Recipient Name</Label>
                    <Input
                      id="recipientName"
                      value={profileData.recipientName}
                      onChange={(e) => setProfileData({ ...profileData, recipientName: e.target.value })}
                      placeholder="Enter recipient name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      value={profileData.iban}
                      onChange={(e) => setProfileData({ ...profileData, iban: e.target.value })}
                      placeholder="Enter IBAN"
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bic">BIC/SWIFT Code</Label>
                    <Input
                      id="bic"
                      value={profileData.bic}
                      onChange={(e) => setProfileData({ ...profileData, bic: e.target.value })}
                      placeholder="Enter BIC/SWIFT code"
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentPurpose">Payment Purpose</Label>
                    <Input
                      id="paymentPurpose"
                      value={profileData.paymentPurpose}
                      onChange={(e) => setProfileData({ ...profileData, paymentPurpose: e.target.value })}
                      placeholder="Enter payment purpose"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAddress">Bank Address</Label>
                    <Input
                      id="bankAddress"
                      value={profileData.bankAddress}
                      onChange={(e) => setProfileData({ ...profileData, bankAddress: e.target.value })}
                      placeholder="Enter bank address"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProfile}>Update Profile</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

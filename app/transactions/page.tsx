import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import TransactionsClient from './transactions-client';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return <TransactionsClient />;
}

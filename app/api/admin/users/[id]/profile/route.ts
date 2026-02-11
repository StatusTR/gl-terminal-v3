import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, phone, accountNumber, recipientName, iban, paymentPurpose, bic, bankAddress } = body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name : user.name,
        phone: phone !== undefined ? phone : user.phone,
        accountNumber: accountNumber !== undefined ? accountNumber : user.accountNumber,
        recipientName: recipientName !== undefined ? recipientName : user.recipientName,
        iban: iban !== undefined ? iban : user.iban,
        paymentPurpose: paymentPurpose !== undefined ? paymentPurpose : user.paymentPurpose,
        bic: bic !== undefined ? bic : user.bic,
        bankAddress: bankAddress !== undefined ? bankAddress : user.bankAddress,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        accountNumber: true,
        recipientName: true,
        iban: true,
        paymentPurpose: true,
        bic: true,
        bankAddress: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

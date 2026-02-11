import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test user
  const hashedPassword = await bcrypt.hash('johndoe123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: hashedPassword,
      name: 'John Doe',
    },
  });

  console.log('✅ Created user:', user.email);

  // Create admin user
  const adminHashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@trading.com' },
    update: {},
    create: {
      email: 'admin@trading.com',
      password: adminHashedPassword,
      name: 'Admin',
      role: 'ADMIN',
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create initial balances for admin
  for (const bal of [
    { currency: 'EUR', amount: 1000000 },
    { currency: 'USD', amount: 1000000 },
    { currency: 'GBP', amount: 1000000 },
    { currency: 'CHF', amount: 1000000 },
  ]) {
    await prisma.balance.upsert({
      where: {
        userId_currency: {
          userId: adminUser.id,
          currency: bal.currency,
        },
      },
      update: { amount: bal.amount },
      create: {
        userId: adminUser.id,
        currency: bal.currency,
        amount: bal.amount,
      },
    });
  }

  console.log('✅ Created admin balances');

  // Create initial balances for the user
  const currencies = [
    { currency: 'EUR', amount: 10000 },
    { currency: 'USD', amount: 5000 },
    { currency: 'GBP', amount: 3000 },
    { currency: 'CHF', amount: 4000 },
  ];

  for (const bal of currencies) {
    await prisma.balance.upsert({
      where: {
        userId_currency: {
          userId: user.id,
          currency: bal.currency,
        },
      },
      update: { amount: bal.amount },
      create: {
        userId: user.id,
        currency: bal.currency,
        amount: bal.amount,
      },
    });
  }

  console.log('✅ Created initial balances');

  // Create sample portfolio items
  const portfolioItems = [
    {
      symbol: 'MSFT',
      assetType: 'STOCK',
      quantity: 1,
      averageBuyPrice: 478.56,
      currency: 'USD',
    },
    {
      symbol: 'BTC',
      assetType: 'CRYPTO',
      quantity: 0.5,
      averageBuyPrice: 45000,
      currency: 'EUR',
    },
    {
      symbol: 'ETH',
      assetType: 'CRYPTO',
      quantity: 2,
      averageBuyPrice: 2800,
      currency: 'EUR',
    },
  ];

  for (const item of portfolioItems) {
    await prisma.portfolio.upsert({
      where: {
        userId_symbol: {
          userId: user.id,
          symbol: item.symbol,
        },
      },
      update: {},
      create: {
        userId: user.id,
        ...item,
      },
    });
  }

  console.log('✅ Created sample portfolio');

  // Create sample transactions
  const transactions = [
    {
      type: 'BUY',
      symbol: 'MSFT',
      assetType: 'STOCK',
      quantity: 1,
      price: 478.56,
      totalAmount: 478.56,
      currency: 'USD',
      createdAt: new Date('2024-01-15'),
    },
    {
      type: 'BUY',
      symbol: 'BTC',
      assetType: 'CRYPTO',
      quantity: 0.5,
      price: 45000,
      totalAmount: 22500,
      currency: 'EUR',
      createdAt: new Date('2024-02-01'),
    },
    {
      type: 'BUY',
      symbol: 'ETH',
      assetType: 'CRYPTO',
      quantity: 2,
      price: 2800,
      totalAmount: 5600,
      currency: 'EUR',
      createdAt: new Date('2024-02-15'),
    },
  ];

  for (const tx of transactions) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        ...tx,
      },
    });
  }

  console.log('✅ Created sample transactions');
  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

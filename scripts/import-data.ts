import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Importing data from backup...');
  
  const data = JSON.parse(fs.readFileSync('/home/ubuntu/trading_terminal/db_backup.json', 'utf-8'));
  
  // Import users
  console.log(`\nImporting ${data.users.length} users...`);
  for (const user of data.users) {
    try {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          email: user.email,
          password: user.password,
          name: user.name,
          phone: user.phone,
          role: user.role,
          accountNumber: user.accountNumber,
          recipientName: user.recipientName,
          iban: user.iban,
          paymentPurpose: user.paymentPurpose,
          bic: user.bic,
          bankAddress: user.bankAddress,
          walletAddress: user.walletAddress,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        }
      });
    } catch (e: any) {
      console.log(`  Skip user ${user.email}: ${e.message?.substring(0, 50)}`);
    }
  }
  console.log('✅ Users imported');

  // Import balances
  console.log(`\nImporting ${data.balances.length} balances...`);
  for (const balance of data.balances) {
    try {
      await prisma.balance.upsert({
        where: { id: balance.id },
        update: {},
        create: {
          id: balance.id,
          userId: balance.userId,
          currency: balance.currency,
          amount: balance.amount,
          createdAt: new Date(balance.createdAt),
          updatedAt: new Date(balance.updatedAt),
        }
      });
    } catch (e: any) {
      console.log(`  Skip balance: ${e.message?.substring(0, 50)}`);
    }
  }
  console.log('✅ Balances imported');

  // Import portfolios
  console.log(`\nImporting ${data.portfolios.length} portfolios...`);
  for (const portfolio of data.portfolios) {
    try {
      await prisma.portfolio.upsert({
        where: { id: portfolio.id },
        update: {},
        create: {
          id: portfolio.id,
          userId: portfolio.userId,
          symbol: portfolio.symbol,
          assetType: portfolio.assetType,
          quantity: portfolio.quantity,
          averageBuyPrice: portfolio.averageBuyPrice,
          currency: portfolio.currency,
          createdAt: new Date(portfolio.createdAt),
          updatedAt: new Date(portfolio.updatedAt),
        }
      });
    } catch (e: any) {
      console.log(`  Skip portfolio: ${e.message?.substring(0, 50)}`);
    }
  }
  console.log('✅ Portfolios imported');

  // Import transactions
  console.log(`\nImporting ${data.transactions.length} transactions...`);
  for (const tx of data.transactions) {
    try {
      await prisma.transaction.upsert({
        where: { id: tx.id },
        update: {},
        create: {
          id: tx.id,
          userId: tx.userId,
          type: tx.type,
          symbol: tx.symbol,
          assetType: tx.assetType,
          quantity: tx.quantity,
          price: tx.price,
          totalAmount: tx.totalAmount,
          currency: tx.currency,
          createdAt: new Date(tx.createdAt),
        }
      });
    } catch (e: any) {
      console.log(`  Skip transaction: ${e.message?.substring(0, 50)}`);
    }
  }
  console.log('✅ Transactions imported');

  // Import transfers
  console.log(`\nImporting ${data.transfers.length} transfers...`);
  for (const transfer of data.transfers) {
    try {
      await prisma.transfer.upsert({
        where: { id: transfer.id },
        update: {},
        create: {
          id: transfer.id,
          userId: transfer.userId,
          type: transfer.type,
          status: transfer.status,
          amount: transfer.amount,
          currency: transfer.currency,
          recipient: transfer.recipient,
          iban: transfer.iban,
          purpose: transfer.purpose,
          cryptoAddress: transfer.cryptoAddress,
          cryptoCurrency: transfer.cryptoCurrency,
          createdAt: new Date(transfer.createdAt),
          updatedAt: new Date(transfer.updatedAt),
        }
      });
    } catch (e: any) {
      console.log(`  Skip transfer: ${e.message?.substring(0, 50)}`);
    }
  }
  console.log('✅ Transfers imported');

  // Import trades
  console.log(`\nImporting ${data.trades.length} trades...`);
  for (const trade of data.trades) {
    try {
      await prisma.trade.upsert({
        where: { id: trade.id },
        update: {},
        create: {
          id: trade.id,
          userId: trade.userId,
          amount: trade.amount,
          currency: trade.currency,
          status: trade.status,
          profit: trade.profit,
          profitPercent: trade.profitPercent,
          tradingPair: trade.tradingPair,
          adminComment: trade.adminComment,
          createdAt: new Date(trade.createdAt),
          closedAt: trade.closedAt ? new Date(trade.closedAt) : null,
        }
      });
    } catch (e: any) {
      console.log(`  Skip trade: ${e.message?.substring(0, 50)}`);
    }
  }
  console.log('✅ Trades imported');

  console.log('\n🎉 All data imported successfully!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

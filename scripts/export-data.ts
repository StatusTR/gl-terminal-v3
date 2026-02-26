import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Exporting all data...');
  
  const users = await prisma.user.findMany();
  const balances = await prisma.balance.findMany();
  const portfolios = await prisma.portfolio.findMany();
  const transactions = await prisma.transaction.findMany();
  const transfers = await prisma.transfer.findMany();
  const trades = await prisma.trade.findMany();
  
  const data = {
    users,
    balances,
    portfolios,
    transactions,
    transfers,
    trades,
    exportedAt: new Date().toISOString()
  };
  
  fs.writeFileSync('/home/ubuntu/trading_terminal/db_backup.json', JSON.stringify(data, null, 2));
  
  console.log('Exported:');
  console.log(`- Users: ${users.length}`);
  console.log(`- Balances: ${balances.length}`);
  console.log(`- Portfolios: ${portfolios.length}`);
  console.log(`- Transactions: ${transactions.length}`);
  console.log(`- Transfers: ${transfers.length}`);
  console.log(`- Trades: ${trades.length}`);
  console.log('\nSaved to /home/ubuntu/trading_terminal/db_backup.json');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking database connection...');
  
  try {
    // Перевіряємо користувачів
    const users = await prisma.user.findMany({
      select: { email: true, role: true, name: true }
    });
    
    console.log('\n=== Users in database ===');
    if (users.length === 0) {
      console.log('NO USERS FOUND! Database may be empty.');
    } else {
      users.forEach(u => console.log(`- ${u.email} (${u.role}) - ${u.name || 'no name'}`));
    }
    
    console.log(`\nTotal users: ${users.length}`);
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

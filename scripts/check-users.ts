import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking database...');
  
  const users = await prisma.user.findMany({
    select: { email: true, role: true, name: true }
  });
  
  console.log('\n=== Users in database ===');
  if (users.length === 0) {
    console.log('NO USERS FOUND! Need to run seed.');
  } else {
    users.forEach(u => console.log(`- ${u.email} (${u.role})`));
  }
  console.log(`\nTotal: ${users.length}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

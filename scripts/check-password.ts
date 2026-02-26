import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@trading.com' },
    select: { password: true, email: true }
  });
  
  console.log('Admin found:', admin?.email);
  console.log('Password hash:', admin?.password?.substring(0, 20) + '...');
  
  // Перевіримо пароль
  const testPasswords = ['admin123', 'Admin123!', 'admin', 'password'];
  
  for (const pwd of testPasswords) {
    const match = await bcrypt.compare(pwd, admin?.password || '');
    console.log(`Password "${pwd}": ${match ? '✅ MATCH' : '❌ no match'}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

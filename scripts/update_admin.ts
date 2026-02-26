import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: {
      email: {
        in: ['admin@trading.com', 'Retoadmin@german-lion-sa.eu']
      }
    },
    data: {
      role: 'SUPER_ADMIN'
    }
  });
  console.log('Updated admins to SUPER_ADMIN:', result.count);
}

main().then(() => prisma.$disconnect());

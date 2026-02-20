import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
  const name = process.env.SEED_ADMIN_NAME ?? 'Admin User';

  const hash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      password: hash,
      role: 'ADMIN',
    },
  });

  await prisma.budgetLine.upsert({
    where: { id: 'demo-budget-1' },
    update: {},
    create: {
      id: 'demo-budget-1',
      name: 'Q1 2025 Disbursement',
      totalAmount: 100000,
      usedAmount: 0,
    },
  });

  console.log('Seed completed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

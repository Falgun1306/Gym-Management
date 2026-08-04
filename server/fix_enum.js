import prisma from './src/config/prisma.js';

async function main() {
  await prisma.$executeRawUnsafe('ALTER TYPE "MembershipStatus" RENAME VALUE \'SUSPENDED\' TO \'FROZEN\';');
  console.log('Successfully renamed enum value');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

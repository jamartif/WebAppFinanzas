require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateAccumulated() {
  console.log('🔄 Starting accumulated amount migration...');

  // Get all investment categories
  const categories = await prisma.investmentCategory.findMany();

  for (const category of categories) {
    console.log(`\n📊 Processing category: ${category.name}`);

    // Get all snapshots with this category, ordered by date
    const snapshots = await prisma.monthlySnapshot.findMany({
      where: {
        investments: {
          some: { categoryId: category.id },
        },
      },
      orderBy: { month: 'asc' },
      include: {
        investments: {
          where: { categoryId: category.id },
        },
      },
    });

    let accumulated = 0;

    for (const snapshot of snapshots) {
      const investment = snapshot.investments[0];
      if (!investment) continue;

      // Add this month's investment to accumulated
      accumulated += Number(investment.investedAmount);

      // Update the record
      await prisma.investmentBalance.update({
        where: { id: investment.id },
        data: { accumulatedAmount: accumulated },
      });

      const date = new Date(snapshot.month).toLocaleDateString('es-ES', {
        month: 'short',
        year: 'numeric'
      });
      console.log(
        `  ✓ ${date}: Invested=${investment.investedAmount}, Accumulated=${accumulated.toFixed(2)}`
      );
    }
  }

  console.log('\n✅ Migration completed successfully!');
}

migrateAccumulated()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Seed banks
  const banks = [
    { name: 'Banco Principal', description: 'Cuenta nómina principal' },
    { name: 'Banco Ahorro', description: 'Cuenta de ahorro' },
    { name: 'Broker', description: 'Cuenta del broker de inversiones' },
  ];

  for (const bank of banks) {
    await prisma.bank.upsert({
      where: { id: banks.indexOf(bank) + 1 },
      update: {},
      create: bank,
    });
  }

  // Seed investment categories
  const categories = [
    { name: 'Fondos Indexados', type: 'FUND', description: 'Fondos indexados propios' },
    { name: 'Fondos Indexados Maria', type: 'FUND', description: 'Fondos indexados de Maria' },
    { name: 'Acciones', type: 'STOCK', description: 'Acciones individuales' },
    { name: 'Metales', type: 'COMMODITY', description: 'Inversión en metales preciosos' },
    { name: 'Equito', type: 'CROWDFUNDING', description: 'Plataforma de crowdfunding inmobiliario' },
    { name: 'Civislend', type: 'CROWDFUNDING', description: 'Plataforma de crowdlending' },
  ];

  for (const category of categories) {
    await prisma.investmentCategory.upsert({
      where: { id: categories.indexOf(category) + 1 },
      update: {},
      create: category,
    });
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

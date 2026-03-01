require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Crear/encontrar perfil "Javier"
  const profile = await prisma.profile.upsert({
    where: { name: 'Javier' },
    update: {},
    create: { name: 'Javier' },
  });

  // Seed banks asociados al perfil Javier
  const banks = [
    { name: 'Banco Principal', description: 'Cuenta nómina principal' },
    { name: 'Banco Ahorro', description: 'Cuenta de ahorro' },
    { name: 'Broker', description: 'Cuenta del broker de inversiones' },
  ];

  for (const bank of banks) {
    const existing = await prisma.bank.findFirst({
      where: { name: bank.name, profileId: profile.id },
    });
    if (!existing) {
      await prisma.bank.create({ data: { ...bank, profileId: profile.id } });
    }
  }

  // Seed investment categories asociadas al perfil Javier
  const categories = [
    { name: 'Fondos Indexados', type: 'FUND', description: 'Fondos indexados propios' },
    { name: 'Fondos Indexados Maria', type: 'FUND', description: 'Fondos indexados de Maria' },
    { name: 'Acciones', type: 'STOCK', description: 'Acciones individuales' },
    { name: 'Metales', type: 'COMMODITY', description: 'Inversión en metales preciosos' },
    { name: 'Equito', type: 'CROWDFUNDING', description: 'Plataforma de crowdfunding inmobiliario' },
    { name: 'Civislend', type: 'CROWDFUNDING', description: 'Plataforma de crowdlending' },
  ];

  for (const category of categories) {
    const existing = await prisma.investmentCategory.findFirst({
      where: { name: category.name, profileId: profile.id },
    });
    if (!existing) {
      await prisma.investmentCategory.create({ data: { ...category, profileId: profile.id } });
    }
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

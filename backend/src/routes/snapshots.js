const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const requireProfile = require('../middleware/requireProfile');

const router = Router();
const prisma = new PrismaClient();

/**
 * Recalculate accumulated amounts for a specific category+profile starting from a given date
 */
async function recalculateAccumulated(categoryId, profileId, fromDate) {
  const snapshots = await prisma.monthlySnapshot.findMany({
    where: {
      profileId,
      month: { gte: fromDate },
      investments: { some: { categoryId } },
    },
    orderBy: { month: 'asc' },
    include: {
      investments: { where: { categoryId } },
    },
  });

  for (let i = 0; i < snapshots.length; i++) {
    const snapshot = snapshots[i];
    const investment = snapshot.investments[0];

    if (!investment) continue;

    let previousAccumulated = 0;
    if (i > 0) {
      previousAccumulated = snapshots[i - 1].investments[0]?.accumulatedAmount || 0;
    } else {
      const previousSnapshot = await prisma.monthlySnapshot.findFirst({
        where: {
          profileId,
          month: { lt: snapshot.month },
          investments: { some: { categoryId } },
        },
        orderBy: { month: 'desc' },
        include: { investments: { where: { categoryId } } },
      });
      if (previousSnapshot && previousSnapshot.investments[0]) {
        previousAccumulated = Number(previousSnapshot.investments[0].accumulatedAmount);
      }
    }

    const newAccumulated = Number(previousAccumulated) + Number(investment.investedAmount);

    await prisma.investmentBalance.update({
      where: { id: investment.id },
      data: { accumulatedAmount: newAccumulated },
    });
  }
}

/**
 * Recalculate all categories for a profile from a given snapshot date
 */
async function recalculateAllFromDate(profileId, snapshotDate) {
  const investments = await prisma.investmentBalance.findMany({
    where: {
      snapshot: {
        profileId,
        month: { gte: snapshotDate },
      },
    },
    distinct: ['categoryId'],
    select: { categoryId: true },
  });

  const categoryIds = [...new Set(investments.map((inv) => inv.categoryId))];

  for (const categoryId of categoryIds) {
    await recalculateAccumulated(categoryId, profileId, snapshotDate);
  }
}

// GET /api/snapshots — List all monthly snapshots for a profile
router.get('/', requireProfile, async (req, res, next) => {
  try {
    const snapshots = await prisma.monthlySnapshot.findMany({
      where: { profileId: req.profileId },
      orderBy: { month: 'desc' },
      include: {
        banks: { include: { bank: true } },
        investments: { include: { category: true } },
        income: { include: { category: true } },
      },
    });
    res.json(snapshots);
  } catch (err) { next(err); }
});

// GET /api/snapshots/:id — Get snapshot detail
router.get('/:id', async (req, res, next) => {
  try {
    const snapshot = await prisma.monthlySnapshot.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        banks: { include: { bank: true } },
        investments: { include: { category: true } },
        income: { include: { category: true } },
      },
    });
    if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });
    res.json(snapshot);
  } catch (err) { next(err); }
});

// POST /api/snapshots — Create monthly snapshot with all data
router.post('/', requireProfile, async (req, res, next) => {
  try {
    const { month, notes, banks, investments, income } = req.body;
    const profileId = req.profileId;
    const snapshotDate = new Date(month);

    const investmentsWithAccumulated = await Promise.all(
      (investments || []).map(async (inv) => {
        const previousSnapshot = await prisma.monthlySnapshot.findFirst({
          where: {
            profileId,
            month: { lt: snapshotDate },
            investments: { some: { categoryId: inv.categoryId } },
          },
          orderBy: { month: 'desc' },
          include: { investments: { where: { categoryId: inv.categoryId } } },
        });

        const previousAccumulated = previousSnapshot?.investments[0]?.accumulatedAmount || 0;
        const accumulatedAmount = Number(previousAccumulated) + Number(inv.investedAmount);

        return {
          categoryId: inv.categoryId,
          investedAmount: inv.investedAmount,
          accumulatedAmount,
          currentValue: inv.currentValue,
        };
      })
    );

    // Upsert: si ya existe un snapshot para este perfil+mes, actualizar en lugar de crear
    const existing = await prisma.monthlySnapshot.findUnique({
      where: { profileId_month: { profileId, month: snapshotDate } },
    });

    let snapshot;

    if (existing) {
      const snapshotId = existing.id;

      await prisma.monthlySnapshot.update({
        where: { id: snapshotId },
        data: { notes },
      });

      await prisma.bankBalance.deleteMany({ where: { snapshotId } });
      await prisma.bankBalance.createMany({
        data: (banks || []).map((b) => ({ snapshotId, bankId: b.bankId, balance: b.balance })),
      });

      await prisma.investmentBalance.deleteMany({ where: { snapshotId } });
      await prisma.investmentBalance.createMany({
        data: investmentsWithAccumulated.map((inv) => ({ snapshotId, ...inv })),
      });

      await prisma.passiveIncome.deleteMany({ where: { snapshotId } });
      await prisma.passiveIncome.createMany({
        data: (income || []).map((inc) => ({
          snapshotId,
          categoryId: inc.categoryId,
          amount: inc.amount,
          source: inc.source,
          description: inc.description,
        })),
      });

      snapshot = await prisma.monthlySnapshot.findUnique({
        where: { id: snapshotId },
        include: {
          banks: { include: { bank: true } },
          investments: { include: { category: true } },
          income: { include: { category: true } },
        },
      });
    } else {
      snapshot = await prisma.monthlySnapshot.create({
        data: {
          month: snapshotDate,
          notes,
          profileId,
          banks: {
            create: (banks || []).map((b) => ({ bankId: b.bankId, balance: b.balance })),
          },
          investments: { create: investmentsWithAccumulated },
          income: {
            create: (income || []).map((inc) => ({
              categoryId: inc.categoryId,
              amount: inc.amount,
              source: inc.source,
              description: inc.description,
            })),
          },
        },
        include: {
          banks: { include: { bank: true } },
          investments: { include: { category: true } },
          income: { include: { category: true } },
        },
      });
    }

    await recalculateAllFromDate(profileId, new Date(snapshotDate.getTime() + 24 * 60 * 60 * 1000));

    res.status(existing ? 200 : 201).json(snapshot);
  } catch (err) { next(err); }
});

// PUT /api/snapshots/:id — Update snapshot
router.put('/:id', async (req, res, next) => {
  try {
    const snapshotId = parseInt(req.params.id);
    const { month, notes, banks, investments, income } = req.body;

    const currentSnapshot = await prisma.monthlySnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!currentSnapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    const profileId = currentSnapshot.profileId;
    const newDate = month ? new Date(month) : currentSnapshot.month;

    await prisma.monthlySnapshot.update({
      where: { id: snapshotId },
      data: { month: newDate, notes },
    });

    if (banks) {
      await prisma.bankBalance.deleteMany({ where: { snapshotId } });
      await prisma.bankBalance.createMany({
        data: banks.map((b) => ({
          snapshotId,
          bankId: b.bankId,
          balance: b.balance,
        })),
      });
    }

    if (investments) {
      await prisma.investmentBalance.deleteMany({ where: { snapshotId } });

      for (const inv of investments) {
        const previousSnapshot = await prisma.monthlySnapshot.findFirst({
          where: {
            profileId,
            month: { lt: newDate },
            investments: { some: { categoryId: inv.categoryId } },
          },
          orderBy: { month: 'desc' },
          include: { investments: { where: { categoryId: inv.categoryId } } },
        });

        const previousAccumulated = previousSnapshot?.investments[0]?.accumulatedAmount || 0;
        const accumulatedAmount = Number(previousAccumulated) + Number(inv.investedAmount);

        await prisma.investmentBalance.create({
          data: {
            snapshotId,
            categoryId: inv.categoryId,
            investedAmount: inv.investedAmount,
            accumulatedAmount,
            currentValue: inv.currentValue,
          },
        });
      }
    }

    if (income) {
      await prisma.passiveIncome.deleteMany({ where: { snapshotId } });
      await prisma.passiveIncome.createMany({
        data: income.map((inc) => ({
          snapshotId,
          categoryId: inc.categoryId,
          amount: inc.amount,
          source: inc.source,
          description: inc.description,
        })),
      });
    }

    await recalculateAllFromDate(profileId, newDate);

    const updated = await prisma.monthlySnapshot.findUnique({
      where: { id: snapshotId },
      include: {
        banks: { include: { bank: true } },
        investments: { include: { category: true } },
        income: { include: { category: true } },
      },
    });

    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/snapshots/:id — Delete snapshot
router.delete('/:id', async (req, res, next) => {
  try {
    const snapshotId = parseInt(req.params.id);

    const snapshot = await prisma.monthlySnapshot.findUnique({
      where: { id: snapshotId },
      select: { month: true, profileId: true },
    });

    if (!snapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    const { month: snapshotDate, profileId } = snapshot;

    await prisma.monthlySnapshot.delete({ where: { id: snapshotId } });

    await recalculateAllFromDate(profileId, snapshotDate);

    res.json({ message: 'Snapshot deleted' });
  } catch (err) { next(err); }
});

module.exports = router;

const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const router = Router();
const prisma = new PrismaClient();

/**
 * Recalculate accumulated amounts for a specific category starting from a given date
 * @param {number} categoryId - Investment category ID
 * @param {Date} fromDate - Starting date for recalculation
 */
async function recalculateAccumulated(categoryId, fromDate) {
  // Get all snapshots with this category from the given date onwards, ordered by month
  const snapshots = await prisma.monthlySnapshot.findMany({
    where: {
      month: { gte: fromDate },
      investments: {
        some: { categoryId },
      },
    },
    orderBy: { month: 'asc' },
    include: {
      investments: {
        where: { categoryId },
      },
    },
  });

  // Recalculate accumulated for each snapshot
  for (let i = 0; i < snapshots.length; i++) {
    const snapshot = snapshots[i];
    const investment = snapshot.investments[0]; // Should be only one per category per snapshot

    if (!investment) continue;

    // Get previous month's accumulated amount
    let previousAccumulated = 0;
    if (i > 0) {
      previousAccumulated = snapshots[i - 1].investments[0]?.accumulatedAmount || 0;
    } else {
      // This is the first snapshot in our range, check if there's a previous one
      const previousSnapshot = await prisma.monthlySnapshot.findFirst({
        where: {
          month: { lt: snapshot.month },
          investments: {
            some: { categoryId },
          },
        },
        orderBy: { month: 'desc' },
        include: {
          investments: {
            where: { categoryId },
          },
        },
      });
      if (previousSnapshot && previousSnapshot.investments[0]) {
        previousAccumulated = Number(previousSnapshot.investments[0].accumulatedAmount);
      }
    }

    // Calculate new accumulated: previous accumulated + this month's invested
    const newAccumulated = Number(previousAccumulated) + Number(investment.investedAmount);

    // Update the investment balance
    await prisma.investmentBalance.update({
      where: { id: investment.id },
      data: { accumulatedAmount: newAccumulated },
    });
  }
}

/**
 * Recalculate all categories from a given snapshot date
 */
async function recalculateAllFromDate(snapshotDate) {
  // Get all categories that have investments from this date onwards
  const investments = await prisma.investmentBalance.findMany({
    where: {
      snapshot: {
        month: { gte: snapshotDate },
      },
    },
    distinct: ['categoryId'],
    select: { categoryId: true },
  });

  const categoryIds = [...new Set(investments.map((inv) => inv.categoryId))];

  // Recalculate each category
  for (const categoryId of categoryIds) {
    await recalculateAccumulated(categoryId, snapshotDate);
  }
}

// GET /api/snapshots — List all monthly snapshots
router.get('/', async (req, res, next) => {
  try {
    const snapshots = await prisma.monthlySnapshot.findMany({
      orderBy: { month: 'desc' },
      include: {
        banks: { include: { bank: true } },
        investments: { include: { category: true } },
        income: { include: { category: true } },
      },
    });
    res.json(snapshots);
  } catch (err) {
    next(err);
  }
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
  } catch (err) {
    next(err);
  }
});

// POST /api/snapshots — Create monthly snapshot with all data
router.post('/', async (req, res, next) => {
  try {
    const { month, notes, banks, investments, income } = req.body;
    const snapshotDate = new Date(month);

    // Calculate accumulated amounts for each investment
    const investmentsWithAccumulated = await Promise.all(
      (investments || []).map(async (inv) => {
        // Get the previous month's accumulated amount for this category
        const previousSnapshot = await prisma.monthlySnapshot.findFirst({
          where: {
            month: { lt: snapshotDate },
            investments: {
              some: { categoryId: inv.categoryId },
            },
          },
          orderBy: { month: 'desc' },
          include: {
            investments: {
              where: { categoryId: inv.categoryId },
            },
          },
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

    const snapshot = await prisma.monthlySnapshot.create({
      data: {
        month: snapshotDate,
        notes,
        banks: {
          create: (banks || []).map((b) => ({
            bankId: b.bankId,
            balance: b.balance,
          })),
        },
        investments: {
          create: investmentsWithAccumulated,
        },
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

    // Recalculate all snapshots after this date (in case this was inserted in the past)
    await recalculateAllFromDate(new Date(snapshotDate.getTime() + 24 * 60 * 60 * 1000)); // +1 day

    res.status(201).json(snapshot);
  } catch (err) {
    next(err);
  }
});

// PUT /api/snapshots/:id — Update snapshot
router.put('/:id', async (req, res, next) => {
  try {
    const snapshotId = parseInt(req.params.id);
    const { month, notes, banks, investments, income } = req.body;

    // Get current snapshot to know its date
    const currentSnapshot = await prisma.monthlySnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!currentSnapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    const newDate = month ? new Date(month) : currentSnapshot.month;

    // Update base snapshot
    await prisma.monthlySnapshot.update({
      where: { id: snapshotId },
      data: { month: newDate, notes },
    });

    // Replace bank balances
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

    // Replace investment balances (we'll recalculate accumulated amounts after)
    if (investments) {
      await prisma.investmentBalance.deleteMany({ where: { snapshotId } });

      // For each investment, calculate accumulated based on previous month
      for (const inv of investments) {
        const previousSnapshot = await prisma.monthlySnapshot.findFirst({
          where: {
            month: { lt: newDate },
            investments: {
              some: { categoryId: inv.categoryId },
            },
          },
          orderBy: { month: 'desc' },
          include: {
            investments: {
              where: { categoryId: inv.categoryId },
            },
          },
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

    // Replace income
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

    // Recalculate all snapshots from this date onwards
    await recalculateAllFromDate(newDate);

    const updated = await prisma.monthlySnapshot.findUnique({
      where: { id: snapshotId },
      include: {
        banks: { include: { bank: true } },
        investments: { include: { category: true } },
        income: { include: { category: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/snapshots/:id — Delete snapshot
router.delete('/:id', async (req, res, next) => {
  try {
    const snapshotId = parseInt(req.params.id);

    // Get snapshot date before deleting
    const snapshot = await prisma.monthlySnapshot.findUnique({
      where: { id: snapshotId },
      select: { month: true },
    });

    if (!snapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    const snapshotDate = snapshot.month;

    // Delete the snapshot (cascade will delete related records)
    await prisma.monthlySnapshot.delete({ where: { id: snapshotId } });

    // Recalculate all snapshots from this date onwards
    await recalculateAllFromDate(snapshotDate);

    res.json({ message: 'Snapshot deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

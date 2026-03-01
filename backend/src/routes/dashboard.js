const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const requireProfile = require('../middleware/requireProfile');

const router = Router();
const prisma = new PrismaClient();

// GET /api/dashboard/summary — Current patrimony summary
router.get('/summary', requireProfile, async (req, res, next) => {
  try {
    const latestSnapshot = await prisma.monthlySnapshot.findFirst({
      where: { profileId: req.profileId },
      orderBy: { month: 'desc' },
      include: {
        banks: { include: { bank: true } },
        investments: { include: { category: true } },
        income: true,
      },
    });

    if (!latestSnapshot) {
      return res.json({
        totalPatrimony: 0,
        totalLiquidity: 0,
        totalInvested: 0,
        totalInvestmentValue: 0,
        globalReturn: 0,
        monthlyGrowth: 0,
        monthlyGrowthPercent: 0,
        passiveIncomeMonth: 0,
        month: null,
      });
    }

    const totalLiquidity = latestSnapshot.banks.reduce(
      (sum, b) => sum + Number(b.balance), 0
    );
    const totalInvested = latestSnapshot.investments.reduce(
      (sum, inv) => sum + Number(inv.accumulatedAmount), 0
    );
    const totalInvestmentValue = latestSnapshot.investments.reduce(
      (sum, inv) => sum + Number(inv.currentValue), 0
    );
    const totalPatrimony = totalLiquidity + totalInvestmentValue;
    const globalReturn = totalInvested > 0
      ? ((totalInvestmentValue - totalInvested) / totalInvested) * 100
      : 0;
    const passiveIncomeMonth = latestSnapshot.income.reduce(
      (sum, inc) => sum + Number(inc.amount), 0
    );

    // Previous month for growth calculation
    const previousSnapshot = await prisma.monthlySnapshot.findFirst({
      where: { profileId: req.profileId, month: { lt: latestSnapshot.month } },
      orderBy: { month: 'desc' },
      include: { banks: true, investments: true },
    });

    let monthlyGrowth = 0;
    let monthlyGrowthPercent = 0;
    if (previousSnapshot) {
      const prevLiquidity = previousSnapshot.banks.reduce(
        (sum, b) => sum + Number(b.balance), 0
      );
      const prevInvestmentValue = previousSnapshot.investments.reduce(
        (sum, inv) => sum + Number(inv.currentValue), 0
      );
      const prevPatrimony = prevLiquidity + prevInvestmentValue;
      monthlyGrowth = totalPatrimony - prevPatrimony;
      monthlyGrowthPercent = prevPatrimony > 0
        ? ((totalPatrimony - prevPatrimony) / prevPatrimony) * 100
        : 0;
    }

    res.json({
      totalPatrimony: Math.round(totalPatrimony * 100) / 100,
      totalLiquidity: Math.round(totalLiquidity * 100) / 100,
      totalInvested: Math.round(totalInvested * 100) / 100,
      totalInvestmentValue: Math.round(totalInvestmentValue * 100) / 100,
      globalReturn: Math.round(globalReturn * 100) / 100,
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
      monthlyGrowthPercent: Math.round(monthlyGrowthPercent * 100) / 100,
      passiveIncomeMonth: Math.round(passiveIncomeMonth * 100) / 100,
      month: latestSnapshot.month,
    });
  } catch (err) { next(err); }
});

// GET /api/dashboard/evolution — Monthly evolution data for charts
router.get('/evolution', requireProfile, async (req, res, next) => {
  try {
    const snapshots = await prisma.monthlySnapshot.findMany({
      where: { profileId: req.profileId },
      orderBy: { month: 'asc' },
      include: {
        banks: true,
        investments: { include: { category: true } },
      },
    });

    const evolution = snapshots.map((snap) => {
      const liquidity = snap.banks.reduce((s, b) => s + Number(b.balance), 0);
      const investmentValue = snap.investments.reduce((s, i) => s + Number(i.currentValue), 0);
      const invested = snap.investments.reduce((s, i) => s + Number(i.accumulatedAmount), 0);

      const byCategory = {};
      snap.investments.forEach((inv) => {
        byCategory[inv.category.name] = {
          invested: Number(inv.accumulatedAmount),
          value: Number(inv.currentValue),
        };
      });

      return {
        month: snap.month,
        liquidity: Math.round(liquidity * 100) / 100,
        investmentValue: Math.round(investmentValue * 100) / 100,
        invested: Math.round(invested * 100) / 100,
        patrimony: Math.round((liquidity + investmentValue) * 100) / 100,
        byCategory,
      };
    });

    res.json(evolution);
  } catch (err) { next(err); }
});

// GET /api/dashboard/income — Passive income summary
router.get('/income', requireProfile, async (req, res, next) => {
  try {
    const snapshots = await prisma.monthlySnapshot.findMany({
      where: { profileId: req.profileId },
      orderBy: { month: 'asc' },
      include: {
        income: { include: { category: true } },
      },
    });

    const monthly = snapshots.map((snap) => {
      const total = snap.income.reduce((s, i) => s + Number(i.amount), 0);
      const bySource = {};
      snap.income.forEach((inc) => {
        const key = inc.source;
        bySource[key] = (bySource[key] || 0) + Number(inc.amount);
      });
      return {
        month: snap.month,
        total: Math.round(total * 100) / 100,
        bySource,
      };
    });

    const totalAccumulated = monthly.reduce((s, m) => s + m.total, 0);

    res.json({
      monthly,
      totalAccumulated: Math.round(totalAccumulated * 100) / 100,
    });
  } catch (err) { next(err); }
});

module.exports = router;

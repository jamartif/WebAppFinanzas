const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const requireProfile = require('../middleware/requireProfile');

const router = Router();
const prisma = new PrismaClient();

// GET /api/income — List passive income for a profile
router.get('/', requireProfile, async (req, res, next) => {
  try {
    const where = { snapshot: { profileId: req.profileId } };
    if (req.query.snapshotId) {
      where.snapshotId = parseInt(req.query.snapshotId);
    }
    const income = await prisma.passiveIncome.findMany({
      where,
      include: { category: true, snapshot: true },
      orderBy: { id: 'desc' },
    });
    res.json(income);
  } catch (err) { next(err); }
});

// POST /api/income — Create passive income entry
router.post('/', async (req, res, next) => {
  try {
    const { snapshotId, categoryId, amount, source, description } = req.body;
    const income = await prisma.passiveIncome.create({
      data: { snapshotId, categoryId, amount, source, description },
      include: { category: true, snapshot: true },
    });
    res.status(201).json(income);
  } catch (err) { next(err); }
});

// PUT /api/income/:id — Update passive income entry
router.put('/:id', async (req, res, next) => {
  try {
    const { categoryId, amount, source, description } = req.body;
    const income = await prisma.passiveIncome.update({
      where: { id: parseInt(req.params.id) },
      data: { categoryId, amount, source, description },
      include: { category: true, snapshot: true },
    });
    res.json(income);
  } catch (err) { next(err); }
});

// DELETE /api/income/:id — Delete passive income entry
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.passiveIncome.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Income entry deleted' });
  } catch (err) { next(err); }
});

module.exports = router;

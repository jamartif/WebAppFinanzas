const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const requireProfile = require('../middleware/requireProfile');

const router = Router();
const prisma = new PrismaClient();

// GET /api/categories — List categories for a profile
router.get('/', requireProfile, async (req, res, next) => {
  try {
    const categories = await prisma.investmentCategory.findMany({
      where: { profileId: req.profileId },
      orderBy: { id: 'asc' },
    });
    res.json(categories);
  } catch (err) { next(err); }
});

// POST /api/categories — Create category
router.post('/', requireProfile, async (req, res, next) => {
  try {
    const { name, type, description } = req.body;
    const category = await prisma.investmentCategory.create({
      data: { name, type, description, profileId: req.profileId },
    });
    res.status(201).json(category);
  } catch (err) { next(err); }
});

// PUT /api/categories/:id — Update category
router.put('/:id', async (req, res, next) => {
  try {
    const { name, type, description } = req.body;
    const category = await prisma.investmentCategory.update({
      where: { id: parseInt(req.params.id) },
      data: { name, type, description },
    });
    res.json(category);
  } catch (err) { next(err); }
});

module.exports = router;

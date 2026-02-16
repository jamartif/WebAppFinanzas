const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const router = Router();
const prisma = new PrismaClient();

// GET /api/banks — List all banks
router.get('/', async (req, res, next) => {
  try {
    const banks = await prisma.bank.findMany({ orderBy: { id: 'asc' } });
    res.json(banks);
  } catch (err) { next(err); }
});

// POST /api/banks — Create bank
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const bank = await prisma.bank.create({ data: { name, description } });
    res.status(201).json(bank);
  } catch (err) { next(err); }
});

// PUT /api/banks/:id — Update bank
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const bank = await prisma.bank.update({
      where: { id: parseInt(req.params.id) },
      data: { name, description },
    });
    res.json(bank);
  } catch (err) { next(err); }
});

// DELETE /api/banks/:id — Delete bank
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.bank.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Bank deleted' });
  } catch (err) { next(err); }
});

module.exports = router;

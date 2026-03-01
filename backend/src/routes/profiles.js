const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const router = Router();
const prisma = new PrismaClient();

// GET /api/profiles — Listar todos los perfiles
router.get('/', async (req, res, next) => {
  try {
    const profiles = await prisma.profile.findMany({ orderBy: { id: 'asc' } });
    res.json(profiles);
  } catch (err) { next(err); }
});

// POST /api/profiles — Crear perfil
router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    const profile = await prisma.profile.create({ data: { name: name.trim() } });
    res.status(201).json(profile);
  } catch (err) { next(err); }
});

// PUT /api/profiles/:id — Renombrar perfil
router.put('/:id', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    const profile = await prisma.profile.update({
      where: { id: parseInt(req.params.id) },
      data: { name: name.trim() },
    });
    res.json(profile);
  } catch (err) { next(err); }
});

// DELETE /api/profiles/:id — Eliminar perfil (solo si hay más de uno)
router.delete('/:id', async (req, res, next) => {
  try {
    const count = await prisma.profile.count();
    if (count <= 1) {
      return res.status(400).json({ error: 'No se puede eliminar el único perfil existente' });
    }
    await prisma.profile.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Perfil eliminado' });
  } catch (err) { next(err); }
});

module.exports = router;

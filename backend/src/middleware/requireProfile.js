/**
 * Middleware que parsea profileId de query string o body
 * y lo adjunta a req.profileId como número.
 * Devuelve 400 si falta o no es un entero válido.
 */
function requireProfile(req, res, next) {
  const raw = req.query.profileId ?? req.body?.profileId;
  const profileId = parseInt(raw, 10);
  if (!raw || isNaN(profileId)) {
    return res.status(400).json({ error: 'profileId requerido' });
  }
  req.profileId = profileId;
  next();
}

module.exports = requireProfile;

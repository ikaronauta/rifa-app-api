const esAdmin = (req, res, next) => {
  if (!req.isAuthenticated() || req.user.tipo !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
  }
  next();
};

const isAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'No autenticado' });
  }
  next();
};

module.exports = { esAdmin, isAuthenticated };

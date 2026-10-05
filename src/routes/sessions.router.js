import { Router } from 'express';
import passport from 'passport';
import { register, login, current, logout } from '../controllers/sessions.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

const authenticate = (strategy) => (req, res, next) => {
  passport.authenticate(strategy, { session: false }, (err, user, info, status) => {
    if (err) return next(err);

    if (!user) {
      if (info?.statusCode) {
        return res.status(info.statusCode).json({ status: 'error', message: info.message });
      }

      const missingCredentials = info?.message === 'Missing credentials' || status === 400;
      if (missingCredentials) {
        if (strategy === 'register') {
          return res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios' });
        }
        if (strategy === 'login') {
          return res.status(401).json({ status: 'error', message: 'Credenciales inválidas' });
        }
      }

      return res.status(401).json({ status: 'error', message: 'No autenticado' });
    }

    req.user = user;
    next();
  })(req, res, next);
};

router.post('/register', authenticate('register'), register);
router.post('/login', authenticate('login'), login);
router.get('/current', authMiddleware, current);
router.post('/logout', logout);

export default router;

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { config } from './config.js';
import { registerUserService, loginUserService } from '../services/sessions.service.js';

const cookieExtractor = (req) => req?.cookies?.currentUser || null;

const asStrategyFailure = (error, done) => {
  if (error.statusCode) {
    return done(null, false, { message: error.message, statusCode: error.statusCode });
  }
  return done(error);
};

const initializeRegisterStrategy = () => {
  passport.use(
    'register',
    new LocalStrategy(
      { usernameField: 'email', passReqToCallback: true },
      async (req, email, password, done) => {
        try {
          const newUser = await registerUserService(req.body);
          return done(null, newUser);
        } catch (error) {
          return asStrategyFailure(error, done);
        }
      }
    )
  );
};

const initializeLoginStrategy = () => {
  passport.use(
    'login',
    new LocalStrategy(
      { usernameField: 'email', passReqToCallback: true },
      async (req, email, password, done) => {
        try {
          const user = await loginUserService({ email, password });
          return done(null, user);
        } catch (error) {
          return asStrategyFailure(error, done);
        }
      }
    )
  );
};

const initializeCurrentStrategy = () => {
  passport.use(
    'current',
    new JwtStrategy(
      {
        jwtFromRequest: cookieExtractor,
        secretOrKey: config.jwtSecret,
      },
      async (jwtPayload, done) => {
        try {
          return done(null, jwtPayload);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};

export const initializePassport = () => {
  initializeRegisterStrategy();
  initializeLoginStrategy();
  initializeCurrentStrategy();
};

export default passport;

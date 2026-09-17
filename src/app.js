import express from 'express';
import cookieParser from 'cookie-parser';
import passport, { initializePassport } from './config/passport.config.js';
import eventsRouter from './routes/events.router.js';
import sessionsRouter from './routes/sessions.router.js';
import usersRouter from './routes/users.router.js';
import ticketsRouter from './routes/tickets.router.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

const app = express();

initializePassport();

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Servidor activo' });
});

app.use('/api/events', eventsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/tickets', ticketsRouter);

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Recurso no encontrado' });
});

app.use(errorHandler);

export default app;

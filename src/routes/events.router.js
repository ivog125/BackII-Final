import { Router } from 'express';
import { getEvents, getEventById, createEvent, updateEvent, updateEventStatus } from '../controllers/events.controller.js';
import { createTicket, getEventTickets } from '../controllers/tickets.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const router = Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', authMiddleware, authorize('organizer', 'admin'), createEvent);
router.put('/:id', authMiddleware, authorize('organizer', 'admin'), updateEvent);
router.patch('/:id/status', authMiddleware, authorize('organizer', 'admin'), updateEventStatus);
router.post('/:eid/tickets', authMiddleware, createTicket);
router.get('/:eid/tickets', authMiddleware, getEventTickets);

export default router;

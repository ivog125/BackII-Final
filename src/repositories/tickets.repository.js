import {
  createTicket,
  findTicketById,
  findActiveTicketByUserAndEvent,
  findActiveTicketsByEvent,
  findTicketsByUser,
  findTicketsByEvent,
  updateTicketById,
  deleteAllTickets,
} from '../dao/tickets.dao.js';
import { generateReservationCode } from '../utils/reservationCode.js';

export const create = (ticketData) =>
  createTicket({
    ...ticketData,
    reservationCode: generateReservationCode(),
  });

export const findById = (id) => findTicketById(id);

export const findActiveByUserAndEvent = (userId, eventId) => findActiveTicketByUserAndEvent(userId, eventId);

export const findByUser = (userId) => findTicketsByUser(userId);

export const findByEvent = (eventId) => findTicketsByEvent(eventId);

export const countActiveQuantityForEvent = async (eventId) => {
  const activeTickets = await findActiveTicketsByEvent(eventId);
  return activeTickets.reduce((total, ticket) => total + ticket.quantity, 0);
};

export const cancelTicket = (ticketId) => updateTicketById(ticketId, { status: 'cancelled', cancelledAt: new Date() });

export const deleteAll = () => deleteAllTickets();

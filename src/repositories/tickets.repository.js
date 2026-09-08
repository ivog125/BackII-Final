import {
  createTicket,
  findTicketById,
  findActiveTicketByUserAndEvent,
  findActiveTicketsByEvent,
  findTicketsByUser,
  findTicketsByEvent,
  updateTicketById,
} from '../dao/tickets.dao.js';

export const create = (ticketData) => createTicket(ticketData);

export const findById = (id) => findTicketById(id);

export const findActiveByUserAndEvent = (userId, eventId) => findActiveTicketByUserAndEvent(userId, eventId);

export const findActiveByEvent = (eventId) => findActiveTicketsByEvent(eventId);

export const findByUser = (userId) => findTicketsByUser(userId);

export const findByEvent = (eventId) => findTicketsByEvent(eventId);

export const update = (id, updateData) => updateTicketById(id, updateData);

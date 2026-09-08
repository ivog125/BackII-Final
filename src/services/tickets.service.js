import mongoose from 'mongoose';
import { getEventByIdService } from './events.service.js';
import {
  create,
  findById,
  findActiveByUserAndEvent,
  findActiveByEvent,
  findByUser,
  findByEvent,
  update,
} from '../repositories/tickets.repository.js';
import { generateReservationCode } from '../models/Ticket.js';
import { mailer } from '../utils/mailer.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const notFoundError = (message) => {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
};

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const forbidden = (message) => {
  const error = new Error(message);
  error.statusCode = 403;
  return error;
};

const conflict = (message) => {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
};

const assertEventOwnerOrAdmin = (event, user) => {
  if (user.role === 'admin') {
    return;
  }

  const userId = (user.id ?? user._id)?.toString();
  if (event.organizer.toString() !== userId) {
    throw forbidden('No tenés permisos para realizar esta acción');
  }
};

const assertTicketOwnerOrAdmin = (ticket, user) => {
  if (user.role === 'admin') {
    return;
  }

  const userId = (user.id ?? user._id)?.toString();
  if (ticket.user.toString() !== userId) {
    throw forbidden('No tenés permisos para realizar esta acción');
  }
};

const sumActiveQuantity = (tickets) => tickets.reduce((total, ticket) => total + ticket.quantity, 0);

export const createTicketService = async (user, eventId, { quantity }) => {
  // 1. quantity es un número válido > 0
  const parsedQuantity = Number(quantity);
  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    throw badRequest('quantity debe ser un número mayor a 0');
  }

  // 2. el evento existe (id inválido cuenta como "no existe")
  const event = await getEventByIdService(eventId);

  // 3. el evento está publicado
  if (event.status !== 'published') {
    throw conflict('Solo se puede inscribir a eventos publicados');
  }

  // 4. no hay ya una inscripción activa del mismo usuario para este evento
  const existingActiveTicket = await findActiveByUserAndEvent(user.id, eventId);
  if (existingActiveTicket) {
    throw conflict('Ya tenés una inscripción activa para este evento');
  }

  // 5. hay cupo suficiente
  const activeTickets = await findActiveByEvent(eventId);
  const reservedQuantity = sumActiveQuantity(activeTickets);
  const availableSpots = event.capacity - reservedQuantity;
  if (parsedQuantity > availableSpots) {
    throw conflict(`Quedan ${availableSpots} cupos disponibles, pediste ${parsedQuantity}`);
  }

  const newTicket = await create({
    user: user.id,
    event: eventId,
    quantity: parsedQuantity,
    status: 'confirmed',
    reservationCode: generateReservationCode(),
  });

  try {
    await mailer.sendTicketConfirmationEmail({
      to: user.email,
      eventTitle: event.title,
      eventDate: event.date,
      quantity: parsedQuantity,
      reservationCode: newTicket.reservationCode,
    });
  } catch (error) {
    console.error('No se pudo enviar el email de confirmación del ticket:', error.message);
  }

  return newTicket;
};

export const listMyTicketsService = async (userId) => {
  const tickets = await findByUser(userId);
  return tickets;
};

export const listEventTicketsService = async (eventId, user) => {
  const event = await getEventByIdService(eventId);
  assertEventOwnerOrAdmin(event, user);

  const tickets = await findByEvent(eventId);
  return tickets;
};

export const cancelTicketService = async (ticketId, user) => {
  if (!isValidObjectId(ticketId)) {
    throw notFoundError('Ticket no encontrado');
  }

  const ticket = await findById(ticketId);
  if (!ticket) {
    throw notFoundError('Ticket no encontrado');
  }

  assertTicketOwnerOrAdmin(ticket, user);

  if (ticket.status === 'cancelled') {
    throw conflict('El ticket ya está cancelado');
  }

  const cancelledTicket = await update(ticketId, { status: 'cancelled', cancelledAt: new Date() });
  return cancelledTicket;
};

import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';

export const createTicket = (ticketData) => Ticket.create(ticketData);

export const findTicketById = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Promise.resolve(null);
  }
  return Ticket.findById(id);
};

export const findActiveTicketByUserAndEvent = (userId, eventId) =>
  Ticket.findOne({ user: userId, event: eventId, status: { $ne: 'cancelled' } });

export const findActiveTicketsByEvent = (eventId) => Ticket.find({ event: eventId, status: { $ne: 'cancelled' } });

export const findTicketsByUser = (userId) =>
  Ticket.find({ user: userId }).sort({ createdAt: -1 }).populate('event', 'title date location status');

export const findTicketsByEvent = (eventId) =>
  Ticket.find({ event: eventId }).sort({ createdAt: -1 }).populate('user', 'first_name last_name email');

export const updateTicketById = (id, updateData) => Ticket.findByIdAndUpdate(id, updateData, { new: true });

export const deleteAllTickets = () => Ticket.deleteMany({});

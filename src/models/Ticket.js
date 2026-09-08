import mongoose from 'mongoose';
import crypto from 'crypto';

export const TICKET_STATUSES = ['confirmed', 'pending', 'cancelled'];

export const generateReservationCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

const ticketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: TICKET_STATUSES, default: 'confirmed' },
    quantity: { type: Number, required: true, min: 1 },
    reservationCode: { type: String, required: true, unique: true },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;

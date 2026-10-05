import { EventDTO } from './event.dto.js';
import { UserDTO } from './user.dto.js';

const isPopulated = (value, discriminatorField) =>
  Boolean(value) && typeof value === 'object' && discriminatorField in value;

export const TicketDTO = (ticket) => {
  if (!ticket) return null;

  const event = isPopulated(ticket.event, 'title') ? EventDTO(ticket.event) : ticket.event?.toString?.() ?? ticket.event;

  const user = isPopulated(ticket.user, 'first_name') ? UserDTO(ticket.user) : ticket.user?.toString?.() ?? ticket.user;

  return {
    id: ticket.id ?? ticket._id,
    user,
    event,
    status: ticket.status,
    quantity: ticket.quantity,
    reservationCode: ticket.reservationCode,
    cancelledAt: ticket.cancelledAt,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
};

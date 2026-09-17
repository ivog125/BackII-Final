import { EventDTO } from './event.dto.js';

const isPopulated = (value, discriminatorField) =>
  Boolean(value) && typeof value === 'object' && discriminatorField in value;

// El user poblado nunca pasa por UserDTO a propósito: UserDTO renombra _id -> id
// (lo que hoy corresponde a /register y /current), pero el populate de tickets
// siempre devolvió _id crudo y ese es el comportamiento que se preserva acá.
const scrubPopulatedUser = (user) => ({
  _id: user._id,
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
});

export const TicketDTO = (ticket) => {
  if (!ticket) return null;

  const event = isPopulated(ticket.event, 'title') ? EventDTO(ticket.event) : ticket.event?.toString?.() ?? ticket.event;

  const user = isPopulated(ticket.user, 'first_name')
    ? scrubPopulatedUser(ticket.user)
    : ticket.user?.toString?.() ?? ticket.user;

  return {
    _id: ticket._id ?? ticket.id,
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

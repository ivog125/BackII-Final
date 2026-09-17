import {
  createTicketService,
  listMyTicketsService,
  listEventTicketsService,
  cancelTicketService,
} from '../services/tickets.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import { TicketDTO } from '../dto/ticket.dto.js';

export const createTicket = catchAsync(async (req, res) => {
  const { eid } = req.params;
  const newTicket = await createTicketService(req.user, eid, req.body);
  res.status(201).json({ status: 'success', payload: TicketDTO(newTicket) });
});

export const getMyTickets = catchAsync(async (req, res) => {
  const tickets = await listMyTicketsService(req.user.id);
  res.status(200).json({ status: 'success', payload: tickets.map(TicketDTO) });
});

export const getEventTickets = catchAsync(async (req, res) => {
  const { eid } = req.params;
  const tickets = await listEventTicketsService(eid, req.user);
  res.status(200).json({ status: 'success', payload: tickets.map(TicketDTO) });
});

export const cancelTicket = catchAsync(async (req, res) => {
  const { tid } = req.params;
  const cancelledTicket = await cancelTicketService(tid, req.user);
  res.status(200).json({ status: 'success', payload: TicketDTO(cancelledTicket) });
});

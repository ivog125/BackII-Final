import {
  createTicketService,
  listMyTicketsService,
  listEventTicketsService,
  cancelTicketService,
} from '../services/tickets.service.js';

export const createTicket = async (req, res) => {
  try {
    const { eid } = req.params;
    const newTicket = await createTicketService(req.user, eid, req.body);
    res.status(201).json({ status: 'success', payload: newTicket });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const tickets = await listMyTicketsService(req.user.id);
    res.status(200).json({ status: 'success', payload: tickets });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
};

export const getEventTickets = async (req, res) => {
  try {
    const { eid } = req.params;
    const tickets = await listEventTicketsService(eid, req.user);
    res.status(200).json({ status: 'success', payload: tickets });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
};

export const cancelTicket = async (req, res) => {
  try {
    const { tid } = req.params;
    const cancelledTicket = await cancelTicketService(tid, req.user);
    res.status(200).json({ status: 'success', payload: cancelledTicket });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
};

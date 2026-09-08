import {
  createEventService,
  listEventsService,
  getEventByIdService,
  updateEventService,
  updateEventStatusService,
} from '../services/events.service.js';

export const getEvents = async (req, res) => {
  try {
    const result = await listEventsService(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await getEventByIdService(id);
    res.status(200).json({ status: 'success', payload: event });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const newEvent = await createEventService(req.user.id, req.body);
    res.status(201).json({ status: 'success', payload: newEvent });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedEvent = await updateEventService(id, req.user, req.body);
    res.status(200).json({ status: 'success', payload: updatedEvent });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
};

export const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedEvent = await updateEventStatusService(id, req.user, req.body.status);
    res.status(200).json({ status: 'success', payload: updatedEvent });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
};

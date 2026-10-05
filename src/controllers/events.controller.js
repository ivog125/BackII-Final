import {
  createEventService,
  listEventsService,
  getEventByIdService,
  updateEventService,
  updateEventStatusService,
} from '../services/events.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import { EventDTO } from '../dto/event.dto.js';

export const getEvents = catchAsync(async (req, res) => {
  const result = await listEventsService(req.query);
  res.status(200).json({ status: 'success', ...result, data: result.data.map(EventDTO) });
});

export const getEventById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const event = await getEventByIdService(id);
  res.status(200).json({ status: 'success', payload: EventDTO(event) });
});

export const createEvent = catchAsync(async (req, res) => {
  const newEvent = await createEventService(req.user.id, req.body);
  res.status(201).json({ status: 'success', payload: EventDTO(newEvent) });
});

export const updateEvent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updatedEvent = await updateEventService(id, req.user, req.body);
  res.status(200).json({ status: 'success', payload: EventDTO(updatedEvent) });
});

export const updateEventStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updatedEvent = await updateEventStatusService(id, req.user, req.body.status);
  res.status(200).json({ status: 'success', payload: EventDTO(updatedEvent) });
});

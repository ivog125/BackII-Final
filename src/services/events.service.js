import mongoose from 'mongoose';
import { create, findAll, count, findById, update } from '../repositories/events.repository.js';
import { EVENT_STATUSES } from '../models/Event.js';

const REQUIRED_FIELDS = ['title', 'description', 'category', 'location', 'date', 'capacity', 'price'];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const isMissing = (value) => value === undefined || value === null || value === '';

const notFoundError = () => {
  const error = new Error('Evento no encontrado');
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

const assertOwnership = (event, user) => {
  if (user.role === 'admin') {
    return;
  }

  const userId = (user.id ?? user._id)?.toString();
  if (event.organizer.toString() !== userId) {
    throw forbidden('No podés modificar un evento que no te pertenece');
  }
};

const assertNotCancelled = (event) => {
  if (event.status === 'cancelled') {
    throw conflict('El evento está cancelado y no puede modificarse');
  }
};

const parseEventDate = (date) => {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    throw badRequest('La fecha del evento no es válida');
  }
  if (parsedDate < new Date()) {
    throw badRequest('La fecha del evento no puede ser en el pasado');
  }
  return parsedDate;
};

const validateEventInput = (eventData) => {
  const missing = REQUIRED_FIELDS.filter((field) => isMissing(eventData[field]));
  if (missing.length) {
    throw badRequest(`Faltan campos obligatorios: ${missing.join(', ')}`);
  }

  const { title, description, category, location, date, capacity, price } = eventData;

  const parsedDate = parseEventDate(date);

  if (Number(capacity) <= 0) {
    throw badRequest('La capacidad debe ser mayor a 0');
  }

  if (Number(price) < 0) {
    throw badRequest('El precio no puede ser negativo');
  }

  return {
    title,
    description,
    category,
    location,
    date: parsedDate,
    capacity: Number(capacity),
    price: Number(price),
  };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildDateRangeFilter = (dateFrom, dateTo) => {
  const range = {};

  if (dateFrom) {
    const from = new Date(dateFrom);
    if (!Number.isNaN(from.getTime())) range.$gte = from;
  }

  if (dateTo) {
    const to = new Date(dateTo);
    if (!Number.isNaN(to.getTime())) range.$lte = to;
  }

  return Object.keys(range).length ? range : undefined;
};

export const createEventService = async (organizerId, eventData) => {
  const validData = validateEventInput(eventData);

  const newEvent = await create({
    ...validData,
    organizer: organizerId,
    status: 'draft',
  });

  return newEvent;
};

export const listEventsService = async (query = {}) => {
  const { status, category, location, dateFrom, dateTo, sort } = query;

  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(query.limit, 10) || 10, 1);
  const skip = (page - 1) * limit;

  const filter = {};

  if (status) filter.status = status;
  if (category) filter.category = { $regex: new RegExp(`^${escapeRegex(category)}$`, 'i') };
  if (location) filter.location = { $regex: new RegExp(`^${escapeRegex(location)}$`, 'i') };

  const dateRange = buildDateRangeFilter(dateFrom, dateTo);
  if (dateRange) filter.date = dateRange;

  let sortOption = { createdAt: -1 };
  if (sort) {
    const direction = sort.startsWith('-') ? -1 : 1;
    const field = sort.replace(/^-/, '');
    sortOption = { [field]: direction };
  }

  const [data, total] = await Promise.all([findAll({ filter, skip, limit, sort: sortOption }), count(filter)]);

  return {
    data,
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
};

export const getEventByIdService = async (eventId) => {
  if (!isValidObjectId(eventId)) {
    throw notFoundError();
  }

  const event = await findById(eventId);
  if (!event) {
    throw notFoundError();
  }

  return event;
};

export const updateEventService = async (eventId, user, updateData) => {
  if (!isValidObjectId(eventId)) {
    throw notFoundError();
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'status')) {
    throw badRequest('usá PATCH /api/events/:id/status');
  }

  const event = await findById(eventId);
  if (!event) {
    throw notFoundError();
  }

  assertOwnership(event, user);
  assertNotCancelled(event);

  // organizer es inmutable: si viene en el body, se ignora silenciosamente
  const { organizer, ...safeUpdateData } = updateData;

  if (safeUpdateData.date !== undefined) {
    safeUpdateData.date = parseEventDate(safeUpdateData.date);
  }

  if (safeUpdateData.capacity !== undefined && Number(safeUpdateData.capacity) <= 0) {
    throw badRequest('La capacidad debe ser mayor a 0');
  }

  if (safeUpdateData.price !== undefined && Number(safeUpdateData.price) < 0) {
    throw badRequest('El precio no puede ser negativo');
  }

  const updatedEvent = await update(eventId, safeUpdateData);
  return updatedEvent;
};

export const updateEventStatusService = async (eventId, user, status) => {
  if (!isValidObjectId(eventId)) {
    throw notFoundError();
  }

  if (!EVENT_STATUSES.includes(status)) {
    throw badRequest(`Estado inválido. Valores permitidos: ${EVENT_STATUSES.join(', ')}`);
  }

  const event = await findById(eventId);
  if (!event) {
    throw notFoundError();
  }

  assertOwnership(event, user);
  assertNotCancelled(event);

  if (status === 'published' && event.status === 'finished') {
    throw conflict('No se puede publicar un evento ya finalizado');
  }

  const updatedEvent = await update(eventId, { status });
  return updatedEvent;
};

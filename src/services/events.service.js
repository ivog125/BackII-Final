import { create, searchEvents, findById, update } from '../repositories/events.repository.js';
import { countActiveQuantityForEvent } from '../repositories/tickets.repository.js';
import { EVENT_STATUSES } from '../constants/event.constants.js';
import { badRequest, forbidden, notFound, conflict } from '../utils/errors.js';

const REQUIRED_FIELDS = ['title', 'description', 'category', 'location', 'date', 'capacity', 'price'];
const SORTABLE_FIELDS = ['date', 'price', 'title', 'capacity', 'createdAt'];
const MAX_LIMIT = 50;

const isMissing = (value) => value === undefined || value === null || value === '';

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

const parsePositiveNumber = (value, message) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw badRequest(message);
  }
  return parsed;
};

const parseNonNegativeNumber = (value, message) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw badRequest(message);
  }
  return parsed;
};

const parseSort = (sort) => {
  if (!sort) return { createdAt: -1 };

  const direction = sort.startsWith('-') ? -1 : 1;
  const field = sort.replace(/^-/, '');

  if (!SORTABLE_FIELDS.includes(field)) {
    throw badRequest(`Campo de orden inválido. Valores permitidos: ${SORTABLE_FIELDS.join(', ')}`);
  }

  return { [field]: direction };
};

const validateEventInput = (eventData) => {
  const missing = REQUIRED_FIELDS.filter((field) => isMissing(eventData[field]));
  if (missing.length) {
    throw badRequest(`Faltan campos obligatorios: ${missing.join(', ')}`);
  }

  const { title, description, category, location, date, capacity, price } = eventData;

  const parsedDate = parseEventDate(date);
  const parsedCapacity = parsePositiveNumber(capacity, 'La capacidad debe ser mayor a 0');
  const parsedPrice = parseNonNegativeNumber(price, 'El precio no puede ser negativo');

  return {
    title,
    description,
    category,
    location,
    date: parsedDate,
    capacity: parsedCapacity,
    price: parsedPrice,
  };
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
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), MAX_LIMIT);
  const sortOption = parseSort(sort);

  const { data, total } = await searchEvents({
    status,
    category,
    location,
    dateFrom,
    dateTo,
    page,
    limit,
    sort: sortOption,
  });

  return {
    data,
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
};

export const getEventByIdService = async (eventId) => {
  const event = await findById(eventId);
  if (!event) {
    throw notFound('Evento no encontrado');
  }

  return event;
};

export const updateEventService = async (eventId, user, updateData) => {
  if (Object.prototype.hasOwnProperty.call(updateData, 'status')) {
    throw badRequest('usá PATCH /api/events/:id/status');
  }

  const event = await findById(eventId);
  if (!event) {
    throw notFound('Evento no encontrado');
  }

  assertOwnership(event, user);
  assertNotCancelled(event);

  // organizer es inmutable: si viene en el body, se ignora silenciosamente
  const { organizer, ...safeUpdateData } = updateData;

  if (safeUpdateData.date !== undefined) {
    safeUpdateData.date = parseEventDate(safeUpdateData.date);
  }

  if (safeUpdateData.capacity !== undefined) {
    safeUpdateData.capacity = parsePositiveNumber(safeUpdateData.capacity, 'La capacidad debe ser mayor a 0');

    const reservedQuantity = await countActiveQuantityForEvent(eventId);
    if (safeUpdateData.capacity < reservedQuantity) {
      throw conflict(`La capacidad no puede ser menor a los ${reservedQuantity} cupos ya reservados`);
    }
  }

  if (safeUpdateData.price !== undefined) {
    safeUpdateData.price = parseNonNegativeNumber(safeUpdateData.price, 'El precio no puede ser negativo');
  }

  const updatedEvent = await update(eventId, safeUpdateData);
  return updatedEvent;
};

export const updateEventStatusService = async (eventId, user, status) => {
  if (!EVENT_STATUSES.includes(status)) {
    throw badRequest(`Estado inválido. Valores permitidos: ${EVENT_STATUSES.join(', ')}`);
  }

  const event = await findById(eventId);
  if (!event) {
    throw notFound('Evento no encontrado');
  }

  assertOwnership(event, user);
  assertNotCancelled(event);

  if (status === 'published' && event.status === 'finished') {
    throw conflict('No se puede publicar un evento ya finalizado');
  }

  const updatedEvent = await update(eventId, { status });
  return updatedEvent;
};

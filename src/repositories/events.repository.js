import { createEvent, findEvents, countEvents, findEventById, updateEventById, deleteAllEvents } from '../dao/events.dao.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const exactCaseInsensitive = (value) => ({ $regex: new RegExp(`^${escapeRegex(value)}$`, 'i') });

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

const buildFilter = ({ status, category, location, dateFrom, dateTo }) => {
  const filter = {};

  if (status) filter.status = status;
  if (category) filter.category = exactCaseInsensitive(category);
  if (location) filter.location = exactCaseInsensitive(location);

  const dateRange = buildDateRangeFilter(dateFrom, dateTo);
  if (dateRange) filter.date = dateRange;

  return filter;
};

export const create = (eventData) => createEvent(eventData);

export const findById = (id) => findEventById(id);

export const update = (id, updateData) => updateEventById(id, updateData);

export const deleteAll = () => deleteAllEvents();

export const searchEvents = async ({ status, category, location, dateFrom, dateTo, page, limit, sort }) => {
  const filter = buildFilter({ status, category, location, dateFrom, dateTo });
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([findEvents(filter, { skip, limit, sort }), countEvents(filter)]);

  return { data, total };
};

import {
  createEvent,
  findEvents,
  countEvents,
  findEventById,
  updateEventById,
} from '../dao/events.dao.js';

export const create = (eventData) => createEvent(eventData);

export const findAll = ({ filter, skip, limit, sort }) => findEvents({ filter, skip, limit, sort });

export const count = (filter) => countEvents(filter);

export const findById = (id) => findEventById(id);

export const update = (id, updateData) => updateEventById(id, updateData);

import mongoose from 'mongoose';
import Event from '../models/Event.js';

export const createEvent = (eventData) => Event.create(eventData);

export const findEvents = (filter, { skip, limit, sort }) => Event.find(filter).sort(sort).skip(skip).limit(limit);

export const countEvents = (filter) => Event.countDocuments(filter);

export const findEventById = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Promise.resolve(null);
  }
  return Event.findById(id);
};

export const updateEventById = (id, updateData) =>
  Event.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

export const deleteAllEvents = () => Event.deleteMany({});

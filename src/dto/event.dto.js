export const EventDTO = (event) => {
  if (!event) return null;

  return {
    _id: event._id ?? event.id,
    title: event.title,
    description: event.description,
    category: event.category,
    date: event.date,
    location: event.location,
    capacity: event.capacity,
    price: event.price,
    status: event.status,
    organizer: event.organizer,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
};

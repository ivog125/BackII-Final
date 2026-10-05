export const EventDTO = (event) => {
  if (!event) return null;

  return {
    id: event.id ?? event._id,
    title: event.title,
    description: event.description,
    category: event.category,
    date: event.date,
    location: event.location,
    capacity: event.capacity,
    price: event.price,
    status: event.status,
    organizer: event.organizer ? event.organizer.toString() : event.organizer,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
};

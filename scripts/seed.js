import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.js';
import { config } from '../src/config/config.js';
import { hashPassword } from '../src/utils/hash.js';
import * as usersRepository from '../src/repositories/users.repository.js';
import * as eventsRepository from '../src/repositories/events.repository.js';
import * as ticketsRepository from '../src/repositories/tickets.repository.js';

if (config.nodeEnv === 'production') {
  console.error('[seed] Abortado: NODE_ENV=production. El seed no corre en producción.');
  process.exit(1);
}

const PASSWORD = 'Password123';

const CATEGORIES = ['Workshop', 'Conferencia', 'Meetup', 'Concierto', 'Festival', 'Curso'];
const LOCATIONS = ['CABA', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata'];

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const seedUsers = async () => {
  const hashedPassword = await hashPassword(PASSWORD);

  const usersToCreate = [
    { first_name: 'Ana', last_name: 'Admin', email: 'admin@eventos.com', role: 'admin' },
    { first_name: 'Oscar', last_name: 'Organizer', email: 'organizer1@eventos.com', role: 'organizer' },
    { first_name: 'Olivia', last_name: 'Organizer', email: 'organizer2@eventos.com', role: 'organizer' },
    { first_name: 'Uma', last_name: 'User', email: 'user1@eventos.com', role: 'user' },
    { first_name: 'Uriel', last_name: 'User', email: 'user2@eventos.com', role: 'user' },
  ];

  const created = {};
  for (const userData of usersToCreate) {
    const user = await usersRepository.create({ ...userData, password: hashedPassword });
    created[userData.email] = user;
  }

  return created;
};

const seedEventsForOrganizer1 = async (organizerId) => {
  const publishedVaried = [];
  for (let i = 0; i < 12; i++) {
    const event = await eventsRepository.create({
      title: `Evento ${i + 1} - ${CATEGORIES[i % CATEGORIES.length]}`,
      description: `Descripción del evento ${i + 1}, generado por el seed para pruebas de listado y paginación.`,
      category: CATEGORIES[i % CATEGORIES.length],
      location: LOCATIONS[i % LOCATIONS.length],
      date: daysFromNow(i + 3),
      capacity: 20 + i * 5,
      price: i % 3 === 0 ? 0 : 1500 + i * 100,
      status: 'published',
      organizer: organizerId,
    });
    publishedVaried.push(event);
  }

  const drafts = [];
  for (let i = 0; i < 2; i++) {
    const event = await eventsRepository.create({
      title: `Evento borrador ${i + 1}`,
      description: 'Evento todavía sin publicar, generado por el seed.',
      category: CATEGORIES[i % CATEGORIES.length],
      location: LOCATIONS[i % LOCATIONS.length],
      date: daysFromNow(10 + i),
      capacity: 30,
      price: 0,
      status: 'draft',
      organizer: organizerId,
    });
    drafts.push(event);
  }

  const soldOutEvent = await eventsRepository.create({
    title: 'Workshop cupo único',
    description: 'Evento publicado con un solo cupo, para probar el rechazo por falta de cupo.',
    category: 'Workshop',
    location: 'CABA',
    date: daysFromNow(5),
    capacity: 1,
    price: 500,
    status: 'published',
    organizer: organizerId,
  });

  return { publishedVaried, drafts, soldOutEvent };
};

const seedEventsForOrganizer2 = async (organizerId) => {
  const events = [];
  for (let i = 0; i < 2; i++) {
    const event = await eventsRepository.create({
      title: `Evento de organizer2 - ${i + 1}`,
      description: 'Evento publicado por organizer2, para probar permisos sobre recursos ajenos.',
      category: CATEGORIES[(i + 2) % CATEGORIES.length],
      location: LOCATIONS[(i + 2) % LOCATIONS.length],
      date: daysFromNow(i + 4),
      capacity: 15,
      price: 1000,
      status: 'published',
      organizer: organizerId,
    });
    events.push(event);
  }
  return events;
};

const printSummaryTable = (users) => {
  const rows = Object.values(users).map((user) => ({
    email: user.email,
    role: user.role,
    password: PASSWORD,
  }));

  console.log('\nUsuarios de prueba:');
  console.table(rows);
};

const run = async () => {
  await connectDB();

  console.log('[seed] Vaciando colecciones (users, events, tickets)...');
  await Promise.all([usersRepository.deleteAll(), eventsRepository.deleteAll(), ticketsRepository.deleteAll()]);

  console.log('[seed] Creando usuarios...');
  const users = await seedUsers();

  console.log('[seed] Creando eventos de organizer1...');
  await seedEventsForOrganizer1(users['organizer1@eventos.com'].id ?? users['organizer1@eventos.com']._id);

  console.log('[seed] Creando eventos de organizer2...');
  await seedEventsForOrganizer2(users['organizer2@eventos.com'].id ?? users['organizer2@eventos.com']._id);

  printSummaryTable(users);

  console.log('\n[seed] Listo.');
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('[seed] Error:', error);
  await mongoose.disconnect();
  process.exit(1);
});

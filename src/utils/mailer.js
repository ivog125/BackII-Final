import nodemailer from 'nodemailer';
import { config } from '../config/config.js';

const transporter = nodemailer.createTransport({
  host: config.mailHost,
  port: config.mailPort,
  auth: {
    user: config.mailUser,
    pass: config.mailPass,
  },
});

const buildConfirmationEmail = ({ to, eventTitle, eventDate, quantity, reservationCode }) => ({
  from: config.mailFrom,
  to,
  subject: `Confirmación de inscripción: ${eventTitle}`,
  text: [
    'Tu inscripción fue confirmada.',
    '',
    `Evento: ${eventTitle}`,
    `Fecha: ${new Date(eventDate).toLocaleString()}`,
    `Lugares reservados: ${quantity}`,
    `Código de reserva: ${reservationCode}`,
  ].join('\n'),
});

export const mailer = {
  sendTicketConfirmationEmail: (data) => transporter.sendMail(buildConfirmationEmail(data)),
};

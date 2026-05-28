const { google } = require('googleapis');
const { appendAppointmentRow } = require('./sheets');

const TIMEZONE = 'America/Bogota';
const BOGOTA_OFFSET = '-05:00';
const DAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function getCalendarClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: 'v3', auth });
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatBogotaTimestamp(year, month, day, hour, minute = 0) {
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00${BOGOTA_OFFSET}`;
}

function formatBogotaLabel(dateUTC, hour) {
  const dayName = DAYS_ES[dateUTC.getUTCDay()];
  const day = dateUTC.getUTCDate();
  const month = MONTHS_ES[dateUTC.getUTCMonth()];
  const suffix = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${dayName} ${day} de ${month} a las ${displayHour}:00 ${suffix}`;
}

function buildBogotaUTCDate(year, month, day, hour) {
  return new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
}

function getBogotaNowUTC() {
  return new Date(Date.now() - 5 * 60 * 60 * 1000);
}

function toBogotaISO(date) {
  return formatBogotaTimestamp(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes()
  );
}

/**
 * Consulta disponibilidad para los próximos 5 días
 */
async function getAvailableSlots() {
  try {
    const calendar = getCalendarClient();
    const now = getBogotaNowUTC();
    const end = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: toBogotaISO(now),
        timeMax: toBogotaISO(end),
        items: [{ id: process.env.GOOGLE_CALENDAR_ID }]
      }
    });

    const busyTimes = res.data.calendars[process.env.GOOGLE_CALENDAR_ID]?.busy || [];
    const workHours = [8, 9, 10, 11, 14, 15, 16, 17];
    const available = [];

    const baseYear = now.getUTCFullYear();
    const baseMonth = now.getUTCMonth() + 1;
    const baseDay = now.getUTCDate();

    for (let d = 0; d < 5; d++) {
      const slotDay = new Date(Date.UTC(baseYear, baseMonth - 1, baseDay + d, 0, 0, 0));
      const weekday = slotDay.getUTCDay();
      if (weekday === 0) continue; // Domingo

      const maxHour = weekday === 6 ? 13 : 18; // Sábado hasta 1PM

      for (const hour of workHours) {
        if (hour >= maxHour) continue;

        const slotStartUTC = buildBogotaUTCDate(slotDay.getUTCFullYear(), slotDay.getUTCMonth() + 1, slotDay.getUTCDate(), hour);
        const slotEndUTC = new Date(slotStartUTC.getTime() + 60 * 60 * 1000);

        const isBusy = busyTimes.some(b => {
          const busyStart = new Date(b.start);
          const busyEnd = new Date(b.end);
          return slotStartUTC < busyEnd && slotEndUTC > busyStart;
        });

        if (!isBusy && slotStartUTC > now) {
          available.push({
            label: formatBogotaLabel(slotStartUTC, hour),
            start: formatBogotaTimestamp(slotStartUTC.getUTCFullYear(), slotStartUTC.getUTCMonth() + 1, slotStartUTC.getUTCDate(), hour),
            end: formatBogotaTimestamp(slotEndUTC.getUTCFullYear(), slotEndUTC.getUTCMonth() + 1, slotEndUTC.getUTCDate(), slotEndUTC.getUTCHours())
          });
        }
      }
      if (available.length >= 6) break;
    }

    return available;

  } catch (err) {
    console.error('❌ Error Google Calendar:', err.message);

    const now = getBogotaNowUTC();
    const today15 = buildBogotaUTCDate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(), 15);
    const tomorrow8 = buildBogotaUTCDate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate() + 1, 8);
    const tomorrow10 = buildBogotaUTCDate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate() + 1, 10);

    return [
      {
        label: formatBogotaLabel(today15, 15),
        start: formatBogotaTimestamp(today15.getUTCFullYear(), today15.getUTCMonth() + 1, today15.getUTCDate(), 15),
        end: formatBogotaTimestamp(today15.getUTCFullYear(), today15.getUTCMonth() + 1, today15.getUTCDate(), 16)
      },
      {
        label: formatBogotaLabel(tomorrow8, 8),
        start: formatBogotaTimestamp(tomorrow8.getUTCFullYear(), tomorrow8.getUTCMonth() + 1, tomorrow8.getUTCDate(), 8),
        end: formatBogotaTimestamp(tomorrow8.getUTCFullYear(), tomorrow8.getUTCMonth() + 1, tomorrow8.getUTCDate(), 9)
      },
      {
        label: formatBogotaLabel(tomorrow10, 10),
        start: formatBogotaTimestamp(tomorrow10.getUTCFullYear(), tomorrow10.getUTCMonth() + 1, tomorrow10.getUTCDate(), 10),
        end: formatBogotaTimestamp(tomorrow10.getUTCFullYear(), tomorrow10.getUTCMonth() + 1, tomorrow10.getUTCDate(), 11)
      }
    ];
  }
}

/**
 * Crea un evento en Google Calendar con los datos de la cita
 */
async function createAppointment({ name, cedula, phone, service, dateLabel, startISO, endISO, history }) {
  try {
    if (!startISO || !endISO) {
      throw new Error('Fecha inicio y fin no están definidas para la cita.');
    }

    const calendar = getCalendarClient();

    const event = {
      summary: `🦷 ${service} — ${name}`,
      description: `Paciente: ${name}\nCédula: ${cedula}\nWhatsApp: ${phone}\nServicio: ${service}\nAgendado por SmileBot AI`,
      start: { dateTime: startISO, timeZone: TIMEZONE },
      end: { dateTime: endISO, timeZone: TIMEZONE },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 },
          { method: 'popup', minutes: 60 }
        ]
      }
    };

    const res = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: event
    });

    const calendarLink = res.data.htmlLink || '';
    console.log(`✅ Cita creada en Calendar: ${calendarLink}`);

    await appendAppointmentRow({
      createdAt: new Date().toLocaleString('es-CO', { timeZone: TIMEZONE }),
      name,
      cedula,
      phone,
      service,
      dateLabel,
      startISO,
      endISO,
      calendarLink,
      status: 'CREADA',
      history: Array.isArray(history) ? history.map(h => `${h.role}:${h.content}`).join(' | ') : ''
    });

    return res.data;

  } catch (err) {
    console.error('❌ Error creando evento:', err.message);

    await appendAppointmentRow({
      createdAt: new Date().toLocaleString('es-CO', { timeZone: TIMEZONE }),
      name,
      cedula,
      phone,
      service,
      dateLabel,
      startISO,
      endISO,
      calendarLink: '',
      status: 'FALLIDA',
      errorMessage: err.message,
      history: Array.isArray(history) ? history.map(h => `${h.role}:${h.content}`).join(' | ') : ''
    });

    return null;
  }
}

module.exports = { getAvailableSlots, createAppointment };

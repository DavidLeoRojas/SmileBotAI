const { google } = require('googleapis');

function getCalendarClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: 'v3', auth });
}

/**
 * Consulta disponibilidad para los próximos 5 días
 */
async function getAvailableSlots() {
  try {
    const calendar = getCalendarClient();
    const now = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 5);

    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: end.toISOString(),
        items: [{ id: process.env.GOOGLE_CALENDAR_ID }]
      }
    });

    const busyTimes = res.data.calendars[process.env.GOOGLE_CALENDAR_ID]?.busy || [];

    // Slots de trabajo disponibles (8AM-6PM, cada 1h)
    const workHours = [8, 9, 10, 11, 14, 15, 16, 17];
    const available = [];

    for (let d = 0; d < 5; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      if (date.getDay() === 0) continue; // Skip domingo

      const dayName = date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

      const maxHour = date.getDay() === 6 ? 13 : 18; // Sábado hasta 1PM

      for (const hour of workHours) {
        if (hour >= maxHour) continue;

        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1);

        const isBusy = busyTimes.some(b => {
          const bs = new Date(b.start);
          const be = new Date(b.end);
          return slotStart < be && slotEnd > bs;
        });

        if (!isBusy && slotStart > now) {
          available.push({
            label: `${dayName} a las ${hour}:00`,
            start: slotStart.toISOString(),
            end: slotEnd.toISOString()
          });
        }
      }
      if (available.length >= 6) break;
    }

    return available;

  } catch (err) {
    console.error('❌ Error Google Calendar:', err.message);
    // Slots de fallback si Calendar no responde
    return [
      { label: 'Hoy a las 15:00', start: null, end: null },
      { label: 'Mañana a las 8:00', start: null, end: null },
      { label: 'Mañana a las 10:00', start: null, end: null }
    ];
  }
}

/**
 * Crea un evento en Google Calendar con los datos de la cita
 */
async function createAppointment({ name, cedula, phone, service, startISO, endISO }) {
  try {
    const calendar = getCalendarClient();

    const event = {
      summary: `🦷 ${service} — ${name}`,
      description: `Paciente: ${name}\nCédula: ${cedula}\nWhatsApp: ${phone}\nServicio: ${service}\nAgendado por SmileBot AI`,
      start: { dateTime: startISO, timeZone: 'America/Bogota' },
      end:   { dateTime: endISO,   timeZone: 'America/Bogota' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 }, // 24h antes
          { method: 'popup', minutes: 60 }    // 1h antes
        ]
      }
    };

    const res = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: event
    });

    console.log(`✅ Cita creada en Calendar: ${res.data.htmlLink}`);
    return res.data;

  } catch (err) {
    console.error('❌ Error creando evento:', err.message);
    return null;
  }
}

module.exports = { getAvailableSlots, createAppointment };

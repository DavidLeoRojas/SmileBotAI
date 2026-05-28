const { google } = require('googleapis');

function getSheetsClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.sheets({ version: 'v4', auth });
}

function pad(value) {
  return String(value).padStart(2, '0');
}

async function appendAppointmentRow({ createdAt, name, cedula, phone, service, dateLabel, startISO, endISO, calendarLink, status, errorMessage, history }) {
  if (!process.env.GOOGLE_SHEETS_ID) {
    console.warn('⚠️ GOOGLE_SHEETS_ID no está configurado. No se puede guardar la cita en Sheets.');
    return;
  }

  try {
    const sheets = getSheetsClient();
    const values = [
      [
        createdAt,
        name || '',
        cedula || '',
        phone || '',
        service || '',
        dateLabel || '',
        startISO || '',
        endISO || '',
        calendarLink || '',
        status || 'DESCONOCIDO',
        errorMessage || '',
        history || ''
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'A:L',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values }
    });

    console.log('✅ Fila agregada a Google Sheets.');
  } catch (err) {
    console.error('❌ Error guardando en Google Sheets:', err.message);
  }
}

module.exports = { appendAppointmentRow };
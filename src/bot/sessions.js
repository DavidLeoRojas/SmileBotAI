/**
 * Manejo de sesiones en memoria por número de teléfono.
 * En producción esto se reemplaza por DynamoDB o Redis.
 */

const sessions = new Map();

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos de inactividad

function getSession(phone) {
  const now = Date.now();
  let session = sessions.get(phone);

  // Crear sesión nueva si no existe o expiró
  if (!session || (now - session.lastActivity) > SESSION_TIMEOUT_MS) {
    session = {
      phone,
      step: 'menu',          // Estado del flujo conversacional
      history: [],           // Historial para GPT-4o (últimos 10 mensajes)
      patientData: {},       // Datos recopilados para la cita
      createdAt: now,
      lastActivity: now
    };
    sessions.set(phone, session);
    console.log(`🆕 Nueva sesión: ${phone}`);
  } else {
    session.lastActivity = now;
  }

  return session;
}

function updateSession(phone, updates) {
  const session = getSession(phone);
  Object.assign(session, updates);
  sessions.set(phone, session);
}

function addToHistory(phone, role, content) {
  const session = getSession(phone);
  session.history.push({ role, content });
  // Mantener solo los últimos 10 mensajes para no exceder tokens
  if (session.history.length > 10) {
    session.history = session.history.slice(-10);
  }
  sessions.set(phone, session);
}

function clearSession(phone) {
  sessions.delete(phone);
}

// Limpieza periódica de sesiones expiradas (cada 10 min)
setInterval(() => {
  const now = Date.now();
  for (const [phone, session] of sessions.entries()) {
    if ((now - session.lastActivity) > SESSION_TIMEOUT_MS) {
      sessions.delete(phone);
      console.log(`🗑️ Sesión expirada limpiada: ${phone}`);
    }
  }
}, 10 * 60 * 1000);

module.exports = { getSession, updateSession, addToHistory, clearSession };

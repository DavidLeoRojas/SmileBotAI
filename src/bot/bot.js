const { getSession, updateSession, addToHistory } = require('./sessions');
const { getAIResponse } = require('../services/openai');
const { getAvailableSlots, createAppointment } = require('../services/calendar');
const { getLocalAIResponse } = require('../services/ai');

function detectIntent(text) {
  const t = text.toLowerCase().trim();

  if (t === '1') return 'FAQ_PRICE';
  if (t === '2') return 'FAQ_LOCATION';
  if (t === '3') return 'BOOK';
  if (t === '4') return 'FAQ_EPS';
  if (t === '5') return 'ESCALATE';
  if (t === '6') return 'FAQ_LIST';

  if (/^(hola|buenos|buenas|hi|hello|saludos|hey|buen dia|buen día)/.test(t)) return 'GREET';
  if (/agendar|cita|turno|reservar|quiero una cita|necesito cita/.test(t)) return 'BOOK';
  if (/humano|persona|recepcionista|agente|hablar con|operador/.test(t)) return 'ESCALATE';
  if (/precio|costo|cuesta|valor|cu[aá]nto|tarifa|vale/.test(t)) return 'FAQ_PRICE';
  if (/ubica|donde|d[oó]nde|direcci[oó]n|llegar|sede|mapa/.test(t)) return 'FAQ_LOCATION';
  if (/horario|hora|abren|cierran|atienden|d[ií]as/.test(t)) return 'FAQ_HOURS';
  if (/prepar|antes de|qu[eé] debo|c[oó]mo debo/.test(t)) return 'FAQ_PREP';
  if (/eps|seguro|convenio|aseguradora|sura|sanitas|compensar/.test(t)) return 'FAQ_EPS';
  if (/servicio|tratamiento|ofrecen|hacen|ortodoncia|implante|blanquea|limpieza/.test(t)) return 'FAQ_SERVICES';
  if (/disponib|tienen cita|hay cita|cu[aá]ndo me pueden/.test(t)) return 'AVAILABILITY';
  if (/gracias|muchas gracias|thank/.test(t)) return 'THANKS';
  if (/^(cancel|no quiero|salir|terminar|no gracias)/.test(t)) return 'CANCEL';
  if (/menu|menú|inicio|volver|regresar|opciones/.test(t)) return 'GREET';
  if (/preguntas frecuentes|faq|preguntas|frecuentes/.test(t)) return 'FAQ_LIST';

  return 'AI_FALLBACK';
}

const FAQ_RESPONSES = {
  GREET: `👋 ¡Hola! Soy *SmileBot*, el asistente virtual de la *Clínica Dental Sonrisa Perfecta* 🦷

¿En qué puedo ayudarle hoy?

1️⃣ Precios de servicios
2️⃣ Ubicación y horarios
3️⃣ Agendar una cita
4️⃣ Convenios EPS
5️⃣ Hablar con recepcionista
6️⃣ Preguntas frecuentes

_Responda con el número o escriba su consulta._`,

  FAQ_PRICE: `💰 *Precios de nuestros servicios:*

• Limpieza dental → $80.000 COP
• Blanqueamiento → $350.000 COP
• Valoración / Consulta → $50.000 COP
• Extracción simple → $120.000 COP
• Ortodoncia (mensual) → desde $180.000 COP
• Implante dental → desde $2.500.000 COP

_Los precios pueden variar según diagnóstico._
¿Desea agendar? Responda *3*.`,

  FAQ_LOCATION: `📍 *Nuestra ubicación:*

🏥 *Clínica Dental Sonrisa Perfecta*
Calle 20 # 10-45, Tunja, Boyacá

🕐 *Horarios:*
• Lunes a Viernes: 8:00 AM – 6:00 PM
• Sábados: 8:00 AM – 1:00 PM

📞 (608) 740-0000

_A 2 cuadras del Parque Santander._
¿Desea agendar? Responda *3*.`,

  FAQ_HOURS: `🕐 *Horarios de atención:*

• Lunes a Viernes: 8:00 AM – 6:00 PM
• Sábados: 8:00 AM – 1:00 PM
• Domingos y festivos: Cerrado

_SmileBot disponible 24/7 para agendar citas._
¿Necesita algo más? 1️⃣ Precios  3️⃣ Agendar`,

  FAQ_PREP: `📋 *Preparación según tipo de cita:*

🦷 *Limpieza:* Cepille antes, evite comer 30 min antes
🔬 *Valoración:* Traiga cédula y radiografías previas
💉 *Con anestesia:* Ayuno 2h, venga acompañado

¿Desea agendar? Responda *3*.`,

  FAQ_EPS: `🏥 *Convenios aceptados:*

✅ Sura  ✅ Sanitas  ✅ Nueva EPS
✅ Compensar  ✅ Colsanitas  ✅ Coomeva
✅ Particular (efectivo o tarjeta)

_Traiga carné y autorización vigente._
¿Desea agendar? Responda *3*.`,

  FAQ_SERVICES: `🦷 *Nuestros servicios:*

• Odontología general (limpiezas, caries, extracciones)
• Estética dental (blanqueamiento, carillas)
• Ortodoncia (brackets, Invisalign)
• Cirugía oral (implantes, tercer molar)
• Odontopediatría

¿Le interesa algún servicio? Responda *3* para agendar.`,

  FAQ_LIST: `📚 *Preguntas frecuentes* que puedo responder automáticamente:

1️⃣ ¿Qué servicios ofrecen?
2️⃣ ¿Cuál es el precio de la limpieza?
3️⃣ ¿Dónde están ubicados?
4️⃣ ¿Qué horarios tienen?
5️⃣ ¿Qué convenios EPS aceptan?
6️⃣ ¿Cómo puedo pagar la cita?
7️⃣ ¿Atienden urgencias dentales?
8️⃣ ¿Qué debo llevar a mi primera cita?
9️⃣ ¿Puedo cancelar o cambiar mi cita?
🔟 ¿Atienden niños?

Responda con el número o escriba su pregunta.`,

  FAQ_PAYMENT: `💳 *Formas de pago aceptadas:*

• Efectivo
• Tarjeta de crédito o débito
• Transferencia bancaria
• Pago en línea (según convenio)

Recuerde traer documentos y, si usa EPS, la autorización vigente.`,

  FAQ_EMERGENCY: `🚨 *Urgencias dentales:*

Sí, atendemos emergencias como dolor intenso, inflamación, infección o fractura dental.

Llame al 📞 (608) 740-0000 o responda *3* para agendar la atención.`,

  FAQ_FIRST_VISIT: `👋 *Primera cita:*

Traiga su cédula, cualquier radiografía previa y su carné EPS (si aplica).

Se realiza valoración inicial, diagnóstico y plan de tratamiento.`,

  FAQ_CANCELLATION: `❌ *Cancelar o cambiar una cita:*

Avise con al menos 24 horas de anticipación para reprogramar sin costo.

Escriba "cancelar cita" o responda *5* para hablar con recepcionista.`,

  FAQ_CHILDREN: `🧒 *Atendemos niños y adolescentes.*

Contamos con odontopediatría para evaluación, limpiezas y tratamientos infantiles.

Responda *3* para agendar la cita.`,

  THANKS: `😊 ¡Con mucho gusto! Disponible 24/7 para ayudarle.
¿Algo más? 1️⃣ Precios  2️⃣ Ubicación  3️⃣ Agendar cita`,

  ESCALATE: `👤 *Transfiriendo con un agente humano...*

Conectando su conversación con nuestra recepcionista.
⏱️ Tiempo estimado: 2-3 minutos
📞 O llame: *(608) 740-0000*
🕐 Atención: Lun-Vie 8AM-6PM / Sáb 8AM-1PM`,
};

async function handleBookingFlow(phone, text, session) {
  const step = session.step;
  const pd   = session.patientData;

  if (step === 'book_name') {
    updateSession(phone, { patientData: { ...pd, name: text }, step: 'book_cedula' });
    return `Gracias, *${text}*. 😊\n\n¿Cuál es su número de *cédula o documento*?`;
  }

  if (step === 'book_cedula') {
    updateSession(phone, { patientData: { ...pd, cedula: text }, step: 'book_phone' });
    return `Anotado. ¿Cuál es su *número de WhatsApp* para la confirmación?`;
  }

  if (step === 'book_phone') {
    updateSession(phone, { patientData: { ...pd, phone: text }, step: 'book_service' });
    return `¿Qué servicio necesita?\n\n1️⃣ Limpieza dental\n2️⃣ Blanqueamiento\n3️⃣ Valoración general\n4️⃣ Ortodoncia\n5️⃣ Extracción\n6️⃣ Implante\n7️⃣ Otro\n\n_Responda con el número._`;
  }

  if (step === 'book_service') {
    const servicios = { '1':'Limpieza dental','2':'Blanqueamiento','3':'Valoración general','4':'Ortodoncia','5':'Extracción','6':'Implante','7':'Otro' };
    const servicio = servicios[text.trim()] || text;
    updateSession(phone, { patientData: { ...pd, service: servicio }, step: 'book_date' });

    let slots = [];
    try { slots = await getAvailableSlots(); } catch(e) {}

    if (!slots.length) {
      slots = [
        { label: 'Hoy a las 3:00 PM',     start: null, end: null },
        { label: 'Hoy a las 5:00 PM',     start: null, end: null },
        { label: 'Mañana a las 8:00 AM',  start: null, end: null },
        { label: 'Mañana a las 10:00 AM', start: null, end: null },
        { label: 'Jueves a las 2:00 PM',  start: null, end: null },
      ];
    }

    updateSession(phone, { availableSlots: slots });
    const slotText = slots.slice(0, 5).map((s, i) => `${i + 1}️⃣ ${s.label}`).join('\n');
    return `📅 *Disponibilidad:*\n\n${slotText}\n\n_Responda con el número de la opción._`;
  }

  if (step === 'book_date') {
    const slots  = session.availableSlots || [];
    const choice = parseInt(text.trim()) - 1;
    const slot   = slots[choice];

    if (!slot) {
      return `Por favor responda con un número del *1 al ${Math.min(slots.length, 5)}*.`;
    }

    updateSession(phone, {
      patientData: { ...pd, date: slot.label, startISO: slot.start, endISO: slot.end },
      step: 'book_confirm'
    });

    return `📋 *Resumen de su cita:*\n\n👤 Nombre: *${pd.name}*\n🪪 Cédula: *${pd.cedula}*\n📱 WhatsApp: *${pd.phone}*\n🦷 Servicio: *${pd.service}*\n📅 Fecha: *${slot.label}*\n\n¿Confirma?\n✅ Responda *SI*\n❌ Responda *NO*`;
  }

  if (step === 'book_confirm') {
    const answer = text.toLowerCase().trim();
    const esConfirmar = ['si','sí','yes','confirmar','confirmo','ok','dale','listo','1'].includes(answer);

    if (esConfirmar) {
      try {
        await createAppointment({ name:pd.name, cedula:pd.cedula, phone:pd.phone, service:pd.service, startISO:pd.startISO, endISO:pd.endISO });
      } catch(e) { console.warn('Calendar no disponible:', e.message); }

      updateSession(phone, { step: 'menu', patientData: {}, availableSlots: [] });
      return `✅ *¡Cita confirmada!*\n\n¡Le esperamos, *${pd.name}*! 😊🦷\n_Recibirá un recordatorio 24h antes._\n\n¿Algo más? 1️⃣ Precios  4️⃣ Convenios`;
    } else {
      updateSession(phone, { step: 'menu', patientData: {}, availableSlots: [] });
      return `Cita cancelada. ¿En qué más puedo ayudarle?\n\n1️⃣ Precios  2️⃣ Ubicación  3️⃣ Agendar cita`;
    }
  }

  return null;
}

async function handleIncomingMessage(phone, text) {
  const session = getSession(phone);
  const textClean = text.trim();

  console.log(`📩 [${phone}] step:${session.step} msg:"${textClean}"`);

  if (session.step.startsWith('book_')) {
    const reply = await handleBookingFlow(phone, textClean, session);
    if (reply) {
      addToHistory(phone, 'user', textClean);
      addToHistory(phone, 'assistant', reply);
      return reply;
    }
  }

  const intent = detectIntent(textClean);
  console.log(`🎯 [${phone}] intent:${intent}`);

  if (intent === 'BOOK') {
    updateSession(phone, { step: 'book_name', patientData: {} });
    const msg = `📝 *Vamos a agendar su cita.*\n\n¿Cuál es su *nombre completo*?`;
    addToHistory(phone, 'user', textClean);
    addToHistory(phone, 'assistant', msg);
    return msg;
  }

  if (intent === 'AVAILABILITY') {
    let msg;
    try {
      const slots = await getAvailableSlots();
      const st = slots.slice(0,5).map(s=>`• ${s.label}`).join('\n');
      msg = `📅 *Disponibilidad actual:*\n\n${st}\n\n¿Le gustaría agendar? Responda *3*.`;
    } catch(e) {
      msg = `📅 Tenemos disponibilidad hoy desde las 3PM y mañana desde las 8AM.\n\n¿Desea agendar? Responda *3*.`;
    }
    addToHistory(phone, 'user', textClean);
    addToHistory(phone, 'assistant', msg);
    return msg;
  }

  if (intent === 'CANCEL') {
    updateSession(phone, { step: 'menu', patientData: {} });
    const msg = `Entendido. ¿En qué más puedo ayudarle?\n\n1️⃣ Precios  2️⃣ Ubicación  3️⃣ Agendar cita`;
    addToHistory(phone, 'user', textClean);
    addToHistory(phone, 'assistant', msg);
    return msg;
  }

  // Manejar respuesta dentro del menú de FAQ
  if (session.step === 'faq_menu') {
    const faqReply = getLocalAIResponse(textClean);
    addToHistory(phone, 'user', textClean);
    addToHistory(phone, 'assistant', faqReply);
    // Después de responder, volver al menú principal
    updateSession(phone, { step: 'menu' });
    return faqReply + `\n\n¿Desea consultar otra pregunta? Responda *6* para FAQ o *1* para el menú.`;
  }

  // Mostrar menú de FAQ si el intent es FAQ_LIST
  if (intent === 'FAQ_LIST') {
    updateSession(phone, { step: 'faq_menu' });
    addToHistory(phone, 'user', textClean);
    addToHistory(phone, 'assistant', FAQ_RESPONSES[intent]);
    return FAQ_RESPONSES[intent];
  }

  if (FAQ_RESPONSES[intent]) {
    addToHistory(phone, 'user', textClean);
    addToHistory(phone, 'assistant', FAQ_RESPONSES[intent]);
    return FAQ_RESPONSES[intent];
  }

  // Para consultas sin intent específico, intentar OpenAI primero
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('PEGA')) {
    try {
      const aiReply = await getAIResponse(session.history, textClean);
      addToHistory(phone, 'user', textClean);
      addToHistory(phone, 'assistant', aiReply);
      return aiReply;
    } catch (err) {
      console.error('❌ Error OpenAI:', err.message);
    }
  }

  // Fallback: respuesta local genérica cuando OpenAI falla o no está configurado
  const localReply = getLocalAIResponse(textClean);
  addToHistory(phone, 'user', textClean);
  addToHistory(phone, 'assistant', localReply);
  return localReply;
}

module.exports = { handleIncomingMessage };

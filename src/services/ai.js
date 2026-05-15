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

function detectIntent(text) {
  const t = text.toLowerCase().trim();

  if (/^(hola|buenos|buenas|hi|hello|saludos|hey|buen dia|buen día)/.test(t)) return 'GREET';
  if (/precio|costo|cuesta|valor|tarifa|vale/.test(t)) return 'FAQ_PRICE';
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
  if (/agendar|cita|turno|reservar|quiero una cita|necesito cita/.test(t)) return 'BOOK';
  if (/humano|persona|recepcionista|agente|hablar con|operador/.test(t)) return 'ESCALATE';
  return 'AI_FALLBACK';
}

function getLocalAIResponse(text) {
  const intent = detectIntent(text);

  if (FAQ_RESPONSES[intent]) return FAQ_RESPONSES[intent];
  if (intent === 'BOOK') return `📝 Para agendar su cita, responda *3* o diga "agendar".`;
  if (intent === 'AVAILABILITY') return `📅 Tenemos citas disponibles hoy y mañana. Responda *3* para iniciar el agendamiento.`;

  return `Lo siento, no entendí bien su mensaje. Por favor responda con:
1️⃣ Precios
2️⃣ Ubicación
3️⃣ Agendar cita
4️⃣ Convenios EPS
5️⃣ Hablar con recepcionista
6️⃣ Preguntas frecuentes`;
}

module.exports = { getLocalAIResponse };

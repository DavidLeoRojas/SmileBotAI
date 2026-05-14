const express = require('express');
const router = express.Router();
const { handleIncomingMessage } = require('../bot/bot');
const { sendWhatsAppMessage } = require('../services/whatsapp');

// ── Verificación del webhook (GET) — Meta lo llama una sola vez al configurar ──
router.get('/', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ Webhook verificado por Meta');
    return res.status(200).send(challenge);
  }
  console.error('❌ Token de verificación incorrecto');
  res.sendStatus(403);
});

// ── Recepción de mensajes (POST) ──
router.post('/', async (req, res) => {
  // Siempre responder 200 rápido para que Meta no reintente
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;

    const entry   = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;
    const message = value?.messages?.[0];

    if (!message) return; // puede ser un status update, no un mensaje

    const from = message.from;       // número del paciente (ej: 573001234567)
    const type = message.type;       // text, audio, image, etc.

    let userText = '';

    if (type === 'text') {
      userText = message.text.body;
    } else if (type === 'interactive') {
      // Botones / listas de respuesta rápida
      userText = message.interactive?.button_reply?.title ||
                 message.interactive?.list_reply?.title || '';
    } else {
      // Tipo no soportado en Sprint 1
      await sendWhatsAppMessage(from,
        '⚠️ Por el momento solo puedo procesar mensajes de texto. ¿En qué puedo ayudarle?'
      );
      return;
    }

    console.log(`📩 Mensaje de ${from}: "${userText}"`);

    const response = await handleIncomingMessage(from, userText);

    if (response) {
      await sendWhatsAppMessage(from, response);
    }

  } catch (err) {
    console.error('❌ Error procesando mensaje:', err.message);
  }
});

module.exports = router;

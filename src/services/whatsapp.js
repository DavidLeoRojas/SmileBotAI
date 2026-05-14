const axios = require('axios');

const BASE_URL = 'https://graph.facebook.com/v18.0';

/**
 * Envía un mensaje de texto simple por WhatsApp
 */
async function sendWhatsAppMessage(to, text) {
  try {
    const url = `${BASE_URL}/${process.env.PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    };

    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Mensaje enviado a ${to}`);
    return res.data;

  } catch (err) {
    console.error('❌ Error enviando mensaje WhatsApp:',
      err.response?.data || err.message);
    throw err;
  }
}

/**
 * Envía botones de respuesta rápida (hasta 3 opciones)
 */
async function sendWhatsAppButtons(to, bodyText, buttons) {
  try {
    const url = `${BASE_URL}/${process.env.PHONE_NUMBER_ID}/messages`;

    // WhatsApp permite máximo 3 botones
    const buttonList = buttons.slice(0, 3).map((b, i) => ({
      type: 'reply',
      reply: { id: `btn_${i}`, title: b.slice(0, 20) } // máx 20 chars
    }));

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: { buttons: buttonList }
      }
    };

    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Botones enviados a ${to}`);
    return res.data;

  } catch (err) {
    // Si falla con botones, enviar texto plano como fallback
    console.warn('⚠️ Botones fallaron, enviando texto plano');
    await sendWhatsAppMessage(to, bodyText);
  }
}

module.exports = { sendWhatsAppMessage, sendWhatsAppButtons };

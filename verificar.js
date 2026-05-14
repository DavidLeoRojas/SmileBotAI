#!/usr/bin/env node
/**
 * SmileBot AI — Script de verificación rápida
 * Ejecutar con: node verificar.js
 * Verifica que todas las variables de entorno están configuradas
 * y que la conexión con WhatsApp API funciona.
 */

require('dotenv').config();
const axios = require('axios');

console.log('\n🦷 SmileBot AI — Verificación de configuración\n');
console.log('='.repeat(50));

let errores = 0;

function check(nombre, valor, ejemplo) {
  if (!valor || valor.trim() === '') {
    console.log(`❌ ${nombre} → NO configurado (ej: ${ejemplo})`);
    errores++;
  } else {
    const preview = valor.length > 20 ? valor.substring(0, 12) + '...' : valor;
    console.log(`✅ ${nombre} → ${preview}`);
  }
}

console.log('\n📋 Variables de entorno:\n');
check('WHATSAPP_TOKEN',       process.env.WHATSAPP_TOKEN,       'EAAcz...');
check('WHATSAPP_VERIFY_TOKEN',process.env.WHATSAPP_VERIFY_TOKEN,'smilebot2025');
check('PHONE_NUMBER_ID',      process.env.PHONE_NUMBER_ID,      '1132300516628014');
check('OPENAI_API_KEY',       process.env.OPENAI_API_KEY,       'sk-...');
check('GOOGLE_CLIENT_ID',     process.env.GOOGLE_CLIENT_ID,     'xxx.apps.googleusercontent.com');
check('GOOGLE_CLIENT_SECRET', process.env.GOOGLE_CLIENT_SECRET, 'GOCSPX-...');
check('GOOGLE_REFRESH_TOKEN', process.env.GOOGLE_REFRESH_TOKEN, '1//...');
check('GOOGLE_CALENDAR_ID',   process.env.GOOGLE_CALENDAR_ID,   'clinica@gmail.com');

console.log('\n' + '='.repeat(50));

if (errores > 0) {
  console.log(`\n⚠️  Faltan ${errores} variable(s). Edita tu archivo .env\n`);
  process.exit(0);
}

// ── Si todo está configurado, probar WhatsApp API ──
console.log('\n🔌 Probando conexión con WhatsApp API...\n');

async function testWhatsApp() {
  try {
    // Solo consulta info del número — no envía nada
    const url = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}`;
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }
    });
    console.log(`✅ WhatsApp API conectada`);
    console.log(`   Número: ${res.data.display_phone_number || 'OK'}`);
    console.log(`   ID: ${res.data.id}`);
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    console.log(`❌ WhatsApp API error: ${msg}`);
    if (msg.includes('expired') || msg.includes('Invalid')) {
      console.log(`   → El token expiró. Ve a Meta Developers y genera uno nuevo.\n`);
    }
  }
}

testWhatsApp().then(() => {
  console.log('\n✅ Verificación completa.');
  console.log('\n🚀 Para iniciar el bot:\n');
  console.log('   Terminal 1:  npm run dev');
  console.log('   Terminal 2:  ngrok http 3000\n');
  console.log('   Luego pega la URL de ngrok en Meta Developers → Webhooks\n');
});

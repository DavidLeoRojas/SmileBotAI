require('dotenv').config();
const express = require('express');
const app = express();

// ── Quitar la pantalla de advertencia de ngrok ──
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rutas ──
const webhookRouter = require('./routes/webhook');
app.use('/webhook', webhookRouter);

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SmileBot AI',
    clinica: 'Clínica Dental Sonrisa Perfecta',
    version: '1.0.0'
  });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`\n🦷 SmileBot AI corriendo en http://localhost:${PORT}`);
  console.log(`📡 Webhook listo en http://localhost:${PORT}/webhook`);
  console.log(`\n✅ Expón con ngrok: ngrok http ${PORT}\n`);
});
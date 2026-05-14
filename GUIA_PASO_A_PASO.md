# 🦷 SmileBot AI — Guía Paso a Paso Completa
## Clínica Dental Sonrisa Perfecta

---

## ¿Qué necesitas antes de empezar?

| Requisito | Gratis | Link |
|---|---|---|
| Node.js v18+ | ✅ | nodejs.org |
| Cuenta Meta Business | ✅ | business.facebook.com |
| Número de teléfono (cualquiera) | ✅ | Ya lo tienes |
| API Key OpenAI | ⚠️ $5 crédito inicial | platform.openai.com |
| Cuenta Google (Gmail) | ✅ | google.com |
| ngrok (túnel temporal) | ✅ | ngrok.com |

---

## PASO 1 — Instalar Node.js

1. Ve a **https://nodejs.org**
2. Descarga la versión **LTS** (la verde)
3. Instala con todos los valores por defecto
4. Verifica en la terminal:
   ```
   node --version   → debe mostrar v18 o superior
   npm --version    → debe mostrar un número
   ```

---

## PASO 2 — Descargar e instalar el proyecto

1. Copia la carpeta `smilebot-backend` a tu computador (ej: Escritorio)
2. Abre una terminal en esa carpeta
3. Ejecuta:
   ```
   npm install
   ```
   Espera a que termine (instala Express, OpenAI, googleapis, etc.)

4. Copia el archivo de variables de entorno:
   ```
   cp .env.example .env
   ```

---

## PASO 3 — Obtener API Key de OpenAI

1. Ve a **https://platform.openai.com**
2. Crea una cuenta (necesitas tarjeta, dan $5 de crédito gratis)
3. Ve a **API Keys** → **Create new secret key**
4. Copia la clave (empieza con `sk-...`)
5. En tu archivo `.env`:
   ```
   OPENAI_API_KEY=sk-TUCLAVEAQUI
   ```

---

## PASO 4 — Configurar WhatsApp Business API (Meta)

### 4.1 Crear App en Meta Developers

1. Ve a **https://developers.facebook.com**
2. Click en **Mis apps** → **Crear app**
3. Selecciona **Otro** → **Negocio**
4. Pon nombre: `SmileBot AI`
5. En el dashboard de tu app, busca **WhatsApp** → click **Configurar**

### 4.2 Obtener el Token y Phone Number ID

1. Dentro de WhatsApp → **Configuración de API**
2. Verás un número de prueba ya listo (ej: +1 555 xxxxxxx)
3. Copia:
   - **Token de acceso temporal** → `WHATSAPP_TOKEN` en tu `.env`
   - **ID de número de teléfono** → `PHONE_NUMBER_ID` en tu `.env`
4. En **A:** agrega tu número personal para recibir mensajes de prueba
5. Inventa un token de verificación (ej: `smilebot2025`) → `WHATSAPP_VERIFY_TOKEN`

---

## PASO 5 — Exponer el servidor con ngrok

Meta necesita una URL pública HTTPS para enviar mensajes. ngrok crea un túnel gratuito.

### 5.1 Instalar ngrok

1. Ve a **https://ngrok.com** → Crear cuenta gratis
2. Descarga ngrok para tu sistema operativo
3. Autentica ngrok con tu token (lo encuentras en el dashboard de ngrok):
   ```
   ngrok config add-authtoken TU_TOKEN_NGROK
   ```

### 5.2 Iniciar el servidor Y el túnel

**Terminal 1 — Servidor:**
```bash
npm run dev
```
Deberías ver:
```
🦷 SmileBot AI corriendo en http://localhost:3000
📡 Webhook listo en http://localhost:3000/webhook
```

**Terminal 2 — Túnel ngrok:**
```bash
ngrok http 3000
```
Verás algo así:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
```
Copia esa URL `https://abc123.ngrok-free.app` (cambia cada vez que reinicias)

---

## PASO 6 — Configurar el Webhook en Meta

1. En Meta Developers → tu app → WhatsApp → **Configuración**
2. Busca **Webhooks** → click **Configurar**
3. Pega:
   - **URL del webhook:** `https://abc123.ngrok-free.app/webhook`
   - **Token de verificación:** el mismo que pusiste en `.env` (ej: `smilebot2025`)
4. Click **Verificar y guardar** → si el servidor está corriendo, dirá ✅ verificado
5. En **Campos del webhook** activa: `messages`

---

## PASO 7 — Configurar Google Calendar

### 7.1 Crear proyecto en Google Cloud

1. Ve a **https://console.cloud.google.com**
2. Crea un proyecto nuevo: `SmileBot AI`
3. Ve a **APIs y servicios** → **Biblioteca**
4. Busca y activa: **Google Calendar API**

### 7.2 Crear credenciales OAuth

1. Ve a **APIs y servicios** → **Credenciales**
2. Click **Crear credenciales** → **ID de cliente de OAuth**
3. Tipo de aplicación: **Aplicación web**
4. En **URIs de redirección autorizados**, agrega:
   `https://developers.google.com/oauthplayground`
5. Guarda. Copia:
   - **Client ID** → `GOOGLE_CLIENT_ID` en `.env`
   - **Client Secret** → `GOOGLE_CLIENT_SECRET` en `.env`

### 7.3 Obtener Refresh Token con OAuth Playground

1. Ve a **https://developers.google.com/oauthplayground**
2. Click el ⚙️ (engranaje) arriba a la derecha
3. Activa **"Use your own OAuth credentials"**
4. Pega tu Client ID y Client Secret
5. En el panel izquierdo busca **Calendar API v3**
6. Selecciona `https://www.googleapis.com/auth/calendar`
7. Click **Authorize APIs** → inicia sesión con la cuenta Google de la clínica
8. Click **Exchange authorization code for tokens**
9. Copia el **Refresh Token** → `GOOGLE_REFRESH_TOKEN` en `.env`
10. En `GOOGLE_CALENDAR_ID` pon el email de la cuenta Google: `tuclinica@gmail.com`

---

## PASO 8 — Tu archivo .env final

Así debe quedar tu `.env` completo:

```env
WHATSAPP_TOKEN=EAAxxxxxxxxxxxxx
WHATSAPP_VERIFY_TOKEN=smilebot2025
PHONE_NUMBER_ID=123456789012345

OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx

GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
GOOGLE_REFRESH_TOKEN=1//xxxxxxxxxxxxxxxx
GOOGLE_CALENDAR_ID=tuclinica@gmail.com

PORT=3000
NODE_ENV=development
```

---

## PASO 9 — Probar que todo funciona

### Test 1 — Verificar el servidor
Abre en el navegador: `http://localhost:3000`
Debe responder:
```json
{"status":"ok","service":"SmileBot AI"}
```

### Test 2 — Probar el bot por WhatsApp
1. En Meta Developers → WhatsApp → **Configuración de API**
2. En la sección **Enviar y recibir mensajes**, escribe en tu número personal
3. Envía un mensaje de WhatsApp al número de prueba de Meta
4. Deberías recibir respuesta de SmileBot en segundos ✅

### Test 3 — Flujo completo de agendamiento
Envía estos mensajes en orden:
```
1. "Hola"              → SmileBot saluda
2. "Quiero una cita"   → Pide nombre
3. "Juan Pérez"        → Pide cédula
4. "12345678"          → Pide teléfono
5. "3001234567"        → Pide servicio
6. "Limpieza"          → Muestra disponibilidad
7. "1"                 → Muestra resumen
8. "SI"                → Confirma y crea evento en Calendar ✅
```

---

## Problemas comunes y soluciones

| Problema | Solución |
|---|---|
| `Cannot find module` | Ejecuta `npm install` de nuevo |
| Webhook no verifica | Verifica que ngrok esté corriendo y la URL sea correcta |
| `401 Unauthorized` de WhatsApp | El token expiró (dura 24h), genera uno nuevo en Meta |
| Calendar no responde | Verifica que el Refresh Token sea correcto |
| OpenAI error | Verifica que tengas crédito en tu cuenta |
| ngrok URL cambia | Debes actualizar el webhook en Meta cada vez que reinicias ngrok |

---

## Para presentar en clase (sin ngrok)

Si no tienes internet estable, usa el archivo `demo/index.html` (la interfaz web) que funciona completamente **sin servidor** y simula todo el bot en el navegador.

Simplemente abre el archivo `index.html` en Chrome y listo. ✅

---

## Estructura del proyecto

```
smilebot-backend/
├── src/
│   ├── index.js              ← Servidor Express
│   ├── routes/
│   │   └── webhook.js        ← Recibe mensajes de WhatsApp
│   ├── bot/
│   │   ├── bot.js            ← Orquestador principal + árbol de decisiones
│   │   └── sessions.js       ← Manejo de sesiones por usuario
│   └── services/
│       ├── whatsapp.js       ← Envía mensajes por WhatsApp API
│       ├── openai.js         ← Integración GPT-4o
│       └── calendar.js       ← Google Calendar (disponibilidad + crear citas)
├── .env.example              ← Plantilla de variables de entorno
├── .env                      ← Tu configuración (NO subir a Git)
├── package.json
└── GUIA_PASO_A_PASO.md       ← Esta guía
```

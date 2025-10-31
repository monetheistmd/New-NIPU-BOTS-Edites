const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const P = require('pino');
const express = require('express');
const fs = require('fs-extra');
const config = require('./config');
const { exec } = require('child_process');

const app = express();
const PORT = config.PORT || 8000;

async function connectToWA() {
  const authDir = './DILALK';
  await fs.ensureDir(authDir);
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    browser: Browsers.macOS('Safari'),
    printQRInTerminal: false, // we’ll use pair code
    auth: state,
    version
  });

  // Pair code login method
  if (!sock.authState.creds.registered) {
    const phoneNumber = config.OWNER_NUMBER;
    console.log(`\n📱 Enter this on your WhatsApp -> Linked Devices -> Link with phone number`);
    console.log(`Requesting pair code for: ${phoneNumber}`);
    const code = await sock.requestPairingCode(phoneNumber);
    console.log(`\n🔐 Pair Code: ${code}\n`);
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      console.log('✅ Connected to WhatsApp!');
    } else if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log('⚠️ Reconnecting...');
        connectToWA();
      } else {
        console.log('❌ Logged out. Delete DILALK folder and re-pair.');
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Message Handler
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const sender = msg.pushName || 'Unknown';
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      '';

    if (!text) return;
    console.log(`💬 [${sender}]: ${text}`);

    try {
      if (text.toLowerCase() === 'ping') {
        await sock.sendMessage(from, { text: 'pong 🏓' });
      } else if (text.toLowerCase() === 'alive') {
        await sock.sendMessage(from, { text: `${config.BOT_NAME} is alive now 🤍` });
      } else if (text.toLowerCase() === 'restart' && from.includes(config.OWNER_NUMBER)) {
        await sock.sendMessage(from, { text: 'Restarting bot...' });
        exec('pm2 restart all');
      }
    } catch (err) {
      console.error('⚠️ Error handling message:', err);
    }
  });
}

connectToWA();

app.get('/', (req, res) => res.send('Money Heist Bot is running ✅'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

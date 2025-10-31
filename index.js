const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, Browsers } = require("@whiskeysockets/baileys");
const P = require("pino");
const fs = require("fs-extra");
const { exec } = require("child_process");
const express = require("express");
const config = require("./config");

const app = express();
const port = process.env.PORT || 8000;

async function connectToWA() {
  const { state, saveCreds } = await useMultiFileAuthState("./DILALK");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Safari"),
    auth: state,
    version
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update || {};
    if (connection === "open") {
      console.log("✅ Money Heist MD Connected!");
    } else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log("⚠️ Connection closed, reconnecting...");
        connectToWA();
      } else {
        console.log("❌ Logged out from WhatsApp.");
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async (m) => {
    try {
      const msg = m.messages[0];
      if (!msg.message) return;
      console.log(msg);

      const from = msg.key.remoteJid;
      const sender = msg.key.participant || msg.key.remoteJid;
      const pushname = msg.pushName || "User";
      const body =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        "";

      const body_text = body.trim().toLowerCase();
      console.log(`[📩] ${pushname}: ${body_text}`);

      if (body_text === "ping") {
        await sock.sendMessage(from, { text: "pong 🏓" });
      } else if (body_text === "alive") {
        await sock.sendMessage(from, { text: "✅ Alive now 🤍" });
      }

    } catch (err) {
      console.error("❌ Error in message:", err);
    }
  });
}

connectToWA();

// Express server to keep alive (for Render etc.)
app.get("/", (req, res) => res.send("✅ Money Heist MD Bot is Running"));
app.listen(port, () => console.log(`🌐 HTTP Server Running on ${port}`));

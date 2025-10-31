const express = require("express");
const P = require("pino");
const fs = require("fs-extra");
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = require("@whiskeysockets/baileys");

const app = express();
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send(`
    <center>
      <h1>🤖 Money Heist MD - Pair Code Generator</h1>
      <form action="/pair" method="get">
        <label><b>Enter your phone number (with country code)</b></label><br>
        <input name="number" placeholder="9477XXXXXXX" required style="padding:10px;width:250px;margin:10px;"/><br>
        <button type="submit" style="padding:10px 25px;background-color:green;color:white;border:none;border-radius:5px;">Get Pair Code</button>
      </form>
      <p style="color:gray;">Example: 94771234567 (no + sign)</p>
    </center>
  `);
});

app.get("/pair", async (req, res) => {
  const number = req.query.number?.trim();
  if (!number) return res.send("❌ Please provide a valid phone number!");

  try {
    const folder = "./DILALK";
    if (!fs.existsSync(folder)) fs.mkdirSync(folder);

    const { state, saveCreds } = await useMultiFileAuthState(folder);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      logger: P({ level: "silent" }),
      printQRInTerminal: false,
      browser: Browsers.macOS("Safari"),
      auth: state,
      version
    });

    const code = await sock.requestPairingCode(number);
    console.log("📲 Pair code generated for", number, ":", code);

    res.send(`
      <center>
        <h2>🔑 Your WhatsApp Pair Code</h2>
        <h1 style="font-size:42px;color:green;">${code}</h1>
        <p>Open <b>WhatsApp → Linked Devices → Pair with phone number</b> and enter this code.</p>
        <p>Keep this page open until connection completes ✅</p>
      </center>
    `);

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", ({ connection }) => {
      if (connection === "open") console.log("✅ WhatsApp connected!");
      else if (connection === "close") console.log("❌ Connection closed, try again.");
    });

  } catch (err) {
    console.error("❌ Error:", err);
    res.send("❌ Failed to generate pairing code. Check console logs.");
  }
});

app.listen(PORT, () => console.log(`🌐 Pairing site live → http://localhost:${PORT}`));

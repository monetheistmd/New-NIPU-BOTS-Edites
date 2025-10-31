require('dotenv').config();

module.exports = {
  SESSION_ID: process.env.SESSION_ID || '',
  OWNER_NUMBER: process.env.OWNER_NUMBER || '',
  PREFIX: process.env.PREFIX || '!',
  PORT: process.env.PORT || 8000,
  BOT_NAME: process.env.BOT_NAME || 'MoneyHeistBot'
};

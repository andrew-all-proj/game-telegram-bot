import * as dotenv from 'dotenv'

dotenv.config()

if (!process.env.BOT_TOKEN) {
   throw new Error('BOT_TOKEN not specified in .env')
}

export default {
   botToken: process.env.BOT_TOKEN,
   botUserName: process.env.BOT_USER_NAME,
   urlWebApp: process.env.URL_WEB_APP || 'https://game.managetlg.com',
}

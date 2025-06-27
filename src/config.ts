import * as dotenv from 'dotenv'

dotenv.config()

if (!process.env.BOT_TOKEN) {
   throw new Error('BOT_TOKEN not specified in .env')
}

if (!process.env.JWT_SECRET) {
   throw new Error('JWT_SECRET not specified in .env')
}

export default {
   botToken: process.env.BOT_TOKEN,
   botUserName: process.env.BOT_USER_NAME,
   urlWebApp: process.env.URL_WEB_APP || 'https://game.managetlg.com',
   jwtSecret: process.env.JWT_SECRET,
   webhookUrl: process.env.WEBHOOK_URL!,
   loggerUrl: process.env.ELASTICSEARCH_NODE,
   redisConnect: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
   },
}

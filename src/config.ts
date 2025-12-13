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
   deepLinkWebApp: process.env.DEEP_LINK_WEB_APP || 'https://t.me/MyGameeeABot/Game',
   jwtSecret: process.env.JWT_SECRET,
   fileUrlPrefix: process.env.FILE_URL_PREFIX,
   internalSecret: process.env.INTERNAL_JWT_SECRET,
   apiServiceUrl: process.env.API_SERVICE_URL,
   webhookUrl: process.env.WEBHOOK_URL!,
   redisConnect: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
   },
   rabbitMq: {
      url: `amqp://${encodeURIComponent(process.env.RABBITMQ_USER || 'guest')}:${encodeURIComponent(process.env.RABBITMQ_PASSWORD || 'guest')}@${process.env.RABBITMQ_HOST || 'localhost'}:${Number(process.env.RABBITMQ_PORT) || 5672}`,
      queue: process.env.RABBITMQ_QUEUE,
   },
}

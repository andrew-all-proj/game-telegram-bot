import express from 'express'
import { GrammyError, HttpError, webhookCallback } from 'grammy'
import config from './config'
import 'dotenv/config'
import { startCommand } from './commands/start'
import { helpCommand } from './commands/help'
import { laboratoryCommand } from './commands/laboratory'
import { fightCallBack, fightCommand } from './commands/fight'
import * as gameDb from 'game-db'
import routes from './routes'
import { bot } from './instance/botInstance'
import { logger } from './instance/loggerInstance'
import { monsterCommand } from './commands/monster'
import { battleStatsCommand } from './commands/battle-stats'
import { startNotificationConsumer } from './services/notificationConsumer'

async function initDb(retries = 5, delay = 2000) {
   for (let i = 0; i < retries; i++) {
      try {
         if (!gameDb.AppDataSource.isInitialized) {
            await gameDb.AppDataSource.initialize()
            logger.info('DB connected')
         }
         return
      } catch (error) {
         logger.error(`DB connection attempt ${i + 1} failed:`, error)
         if (i < retries - 1) {
            await new Promise((res) => setTimeout(res, delay))
         } else {
            logger.error('All DB connection attempts failed.')
            throw error
         }
      }
   }
}

bot.command('start', startCommand)
bot.command('help', helpCommand)
bot.command('laboratory', laboratoryCommand)
bot.command('fight', fightCommand)
bot.command('monster', monsterCommand)
bot.command('battle_stats', battleStatsCommand)

bot.on('callback_query:data', fightCallBack)

bot.catch((err) => {
   const error = err.ctx
   if (error instanceof GrammyError) {
      logger.error('Error in request', error)
   } else if (error instanceof HttpError) {
      logger.error('Could not connect to Telegram', error)
   } else {
      logger.error('Unknown error', error)
   }
})

async function main() {
   await initDb()
   try {
      await startNotificationConsumer()
   } catch (error) {
      logger.error('Failed to start RabbitMQ consumer', error)
   }
   await bot.api.setMyCommands([
      { command: 'start', description: 'Запустить бота' },
      { command: 'help', description: 'Помощь' },
      { command: 'laboratory', description: 'Лаборатория' },
      { command: 'fight', description: 'Бой на Арене' },
      { command: 'monster', description: 'Показать монстра' },
      { command: 'battle_stats', description: 'Статистика боёв за сегодня' },
   ])

   const app = express()
   app.use(express.json())

   app.use('/', routes)

   if (process.env.NODE_ENV === 'productionnn') {
      //TODO make webhook for prod
      app.use('/webhook', webhookCallback(bot, 'express'))

      try {
         await bot.api.setWebhook(`${config.webhookUrl}/webhook`)
         logger.info(`Webhook set: ${config.webhookUrl}/webhook`)
      } catch (err) {
         logger.error('Error create webhook:', err)
      }
   } else {
      void bot.start()
      logger.info('Bot starting polling')
   }

   const PORT = process.env.PORT || 3000
   app.listen(PORT, () => {
      logger.info(`Express server run port: ${PORT}`)
   })
}

void main()

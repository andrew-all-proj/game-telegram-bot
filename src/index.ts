import express from 'express'
import { Bot, GrammyError, HttpError, webhookCallback } from 'grammy'
import { bootstrap } from 'global-agent'
import config from './config'
import 'dotenv/config'
import { startCommand } from './commands/start'
import { helpCommand } from './commands/help'
import { laboratoryCommand } from './commands/laboratory'
import { fightCallBack, fightCommand } from './commands/fight'
import * as gameDb from 'game-db'
import routes from './routes'
import { bot } from './botInstance'

if (process.env.GLOBAL_AGENT_HTTP_PROXY) {
   console.log('Start proxy')
   bootstrap()
}

async function initDb(retries = 5, delay = 2000) {
   for (let i = 0; i < retries; i++) {
      try {
         if (!gameDb.AppDataSource.isInitialized) {
            await gameDb.AppDataSource.initialize()
            console.log('DB connected')
         }
         return
      } catch (error) {
         console.log(`DB connection attempt ${i + 1} failed:`, error)
         if (i < retries - 1) {
            await new Promise((res) => setTimeout(res, delay))
         } else {
            console.error('All DB connection attempts failed.')
            throw error
         }
      }
   }
}

bot.command('start', startCommand)
bot.command('help', helpCommand)
bot.command('laboratory', laboratoryCommand)
bot.command('fight', fightCommand)

bot.on('callback_query:data', fightCallBack)

bot.catch((err) => {
   const error = err.ctx
   if (error instanceof GrammyError) {
      console.error('Error in request:', error.description)
   } else if (error instanceof HttpError) {
      console.error('Could not connect to Telegram', error)
   } else {
      console.error('Unknown error', error)
   }
})

async function main() {
   await initDb()
   await bot.api.setMyCommands([
      { command: 'start', description: 'Запустить бота' },
      { command: 'help', description: 'Помощь' },
      { command: 'laboratory', description: 'Лаборатория' },
      { command: 'fight', description: 'Бой на Арене' },
   ])

   const app = express()
   app.use(express.json())

   app.use('/', routes)

   if (process.env.NODE_ENV === 'production') {
      app.use('/webhook', webhookCallback(bot, 'express'))

      try {
         await bot.api.setWebhook(`${config.webhookUrl}/webhook`)
         console.log(`✅ Webhook установлен: ${config.webhookUrl}/webhook`)
      } catch (err) {
         console.error('❌ Не удалось установить webhook:', err)
      }
   } else {
      bot.start()
      console.log('🤖 Бот запущен в режиме polling')
   }

   const PORT = process.env.PORT || 3000
   app.listen(PORT, () => {
      console.log(`🚀 Express сервер запущен на порту ${PORT}`)
   })
}

main()

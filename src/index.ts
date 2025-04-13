import { Bot, GrammyError, HttpError } from 'grammy'
import config from './config'
import { startCommand } from './commands/start'
import { helpCommand } from './commands/help'
import { laboratoryCommand } from './commands/laboratory'
import { fightCommand } from './commands/fight'
import * as gameDb from 'game-db'

async function initDb() {
   if (!gameDb.AppDataSource.isInitialized) {
      try {
         await gameDb.AppDataSource.initialize()
         console.log('DB connected')
      } catch (error) {
         console.log(error)
      }
   }
}

const bot = new Bot(config.botToken)

bot.command('start', startCommand)
bot.command('help', helpCommand)
bot.command('laboratory', laboratoryCommand)
bot.command('fight', fightCommand)

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
   try {
      await bot.api.setMyCommands([
         { command: 'start', description: 'Запустить бота' },
         { command: 'help', description: 'Помощь' },
         { command: 'laboratory', description: 'Лаборатория' },
         { command: 'fight', description: 'Бой на Арене' },
      ])
   } catch (e: any) {
      console.warn('⚠️ Не удалось установить команды: таймаут подключения к Telegram API')
   }

   await bot.start()
   console.log('🤖 Бот запущен')
}
main()

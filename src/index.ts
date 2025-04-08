import { Bot, GrammyError, HttpError } from 'grammy'
import config from './config'
import { startCommand } from './commands/start'
import { helpCommand } from './commands/help'

const bot = new Bot(config.botToken)

bot.api.setMyCommands([
   { command: 'start', description: 'Запустить бота' },
   { command: 'help', description: 'Помощь' },
])

bot.command('start', startCommand)
bot.command('help', helpCommand)

bot.on('message:text', async (ctx) => {
   await ctx.reply(`🔁 Ты написал: ${ctx.message.text}`)
})

bot.catch((err) => {
   const error = err.ctx

   if (error instanceof GrammyError) {
      console.error('Error in request:', error.description)
   } else if (error instanceof HttpError) {
      console.error('Could not to telegram', error)
   } else {
      console.error('Unknown error', error)
   }
})

bot.start()

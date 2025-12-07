import { Context } from 'grammy'
import config from '../config'
import { logger } from '../instance/loggerInstance'

export const laboratoryCommand = async (ctx: Context) => {
   try {
      if (ctx.chat?.type === 'private') {
         await ctx.reply('Профессор! Открываем лабораторию...', {
            reply_markup: {
               inline_keyboard: [
                  [
                     {
                        text: '🧪 Открыть лабораторию',
                        web_app: {
                           url: `${config.urlWebApp}/laboratory`,
                        },
                     },
                  ],
               ],
            },
         })
      }
   } catch (error) {
      logger.error('Reply error:', error)
   }
}

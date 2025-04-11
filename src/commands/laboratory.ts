import { Context } from 'grammy'
import config from '../config'

export const laboratoryCommand = async (ctx: Context) => {
   try {
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
   } catch (error) {
      console.error('Reply error:', error)
   }
}

import { Context } from 'grammy'
import * as gameDb from 'game-db'
import { logger } from '../instance/loggerInstance'
import config from '../config'

export const startCommand = async (ctx: Context) => {
   try {
      const user = await gameDb.Entities.User.findOne({
         where: { telegramId: ctx.from?.id?.toString() },
      })
      let text = ''
      if (!user) {
         await gameDb.Entities.User.create({
            name: ctx.from?.first_name || 'No name',
            telegramId: ctx.from?.id?.toString(),
            energy: 1000,
         }).save()
         text =
            'Добро пожаловать, Профессор, в Mutantorium!\n 🎮 Для старта игры перейдите по ссылке: 🧪'
         logger.info(`Created user telegramId: ${ctx.from?.id?.toString()}`)
      }
      text =
         'C возвращением, Профессор, в Mutantorium!\n 🎮 Для старта игры перейдите по ссылке: 🧪'
      if (ctx.chat?.type === 'private') {
         await ctx.reply(text, {
            reply_markup: {
               inline_keyboard: [
                  [
                     {
                        text: 'Открыть Mutantorium',
                        url: config.deepLinkWebApp,
                     },
                  ],
               ],
            },
         })
         return
      }
      await ctx.reply(text, {
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
   } catch (e) {
      logger.error('Error create user', e)
   }
}

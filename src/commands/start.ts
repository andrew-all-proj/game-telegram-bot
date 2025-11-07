import { Context } from 'grammy'
import * as gameDb from 'game-db'
import { logger } from '../instance/loggerInstance'
import config from '../config'

export const startCommand = async (ctx: Context) => {
   try {
      const user = await gameDb.Entities.User.findOne({
         where: { telegramId: ctx.from?.id?.toString() },
      })
      if (!user) {
         await gameDb.Entities.User.create({
            name: ctx.from?.first_name || 'No name',
            telegramId: ctx.from?.id?.toString(),
            energy: 1000,
         }).save()
         await ctx.reply(
            'Добро пожаловать, Профессор, в Mutantorium!\n 🎮 Для старта игры перейдите по ссылке: 🧪',
            {
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
            },
         )
         logger.info(`Created user telegramId: ${ctx.from?.id?.toString()}`)
         return
      }
      logger.info(`Command start user id: ${user.id}`)
      await ctx.reply(
         'C возвращением, Профессор, в Mutantorium!\n 🎮 Для старта игры перейдите по ссылке: 🧪',
         {
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
         },
      )
   } catch (e) {
      logger.error('Error create user', e)
   }
}

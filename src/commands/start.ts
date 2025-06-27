import { Context } from 'grammy'
import * as gameDb from 'game-db'
import { logger } from '../instance/loggerInstance'

export const startCommand = async (ctx: Context) => {
   try {
      const user = await gameDb.Entities.User.findOne({
         where: { telegramId: ctx.from?.id?.toString() },
      })
      if (!user) {
         await gameDb.Entities.User.create({
            name: ctx.from?.first_name || 'No name',
            telegramId: ctx.from?.id?.toString(),
         }).save()
         await ctx.reply('Добро пожаловать, Профессор, в Mutantorium!')
         logger.info(`Создан пользователь telegramId: ${ctx.from?.id?.toString()}`)
         return
      }
      await ctx.reply('C возвращением, Профессор, в Mutantorium!')
   } catch (e) {
      logger.error('Ошибка при создании пользователя:', e)
   }
}

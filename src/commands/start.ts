import { Context } from 'grammy'
import * as gameDb from 'game-db'

export const startCommand = async (ctx: Context) => {
   try {
      const user = await gameDb.Entities.User.findOne({
         where: { idTelegram: ctx.from?.id?.toString() },
      })
      if (!user) {
         await gameDb.Entities.User.create({
            name: ctx.from?.first_name || 'No name',
            idTelegram: ctx.from?.id?.toString(),
         }).save()
         await ctx.reply('Добро пожаловать, Профессор, в Mutantorium!')
         return
      }
      await ctx.reply('C возвращением, Профессор, в Mutantorium!')
   } catch (e) {
      console.log('Ошибка при создании пользователя:', e)
   }
}

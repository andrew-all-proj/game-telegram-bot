import { Context } from 'grammy'
import * as gameDb from 'game-db'

export const startCommand = async (ctx: Context) => {
   try {
      const user = await gameDb.Entities.User.findOne({ where: { idTelegram: ctx.from?.id } })
      if (!user) {
         await gameDb.Entities.User.create({
            name: ctx.from?.first_name || 'No name',
            idTelegram: ctx.from?.id,
         }).save()
         await ctx.reply('Добро пожаловать, Профессор, в MonstroFarm!')
         return
      }
      await ctx.reply('C возвращением, Профессор, в MonstroFarm!')
   } catch (e) {
      console.log('Ошибка при создании пользователя:', e)
   }
}

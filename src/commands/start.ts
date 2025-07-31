import { Context } from 'grammy'
import * as gameDb from 'game-db'
import { logger } from '../instance/loggerInstance'

export const startCommand = async (ctx: Context) => {
   try {
      let user = await gameDb.Entities.User.findOne({
         where: { telegramId: ctx.from?.id?.toString() },
      })
      if (!user) {
         user = await gameDb.Entities.User.create({
            name: ctx.from?.first_name || 'No name',
            telegramId: ctx.from?.id?.toString(),
            energy: 1000,
         }).save()

         const foods = await gameDb.Entities.Food.find()
         if (!foods.length) {
            logger.error('No food found in database')
         } else {
            const food = foods[Math.floor(Math.random() * foods.length)]
            await gameDb.Entities.UserInventory.create({
               userId: user.id,
               foodId: food.id,
               quantity: 4,
               type: gameDb.datatypes.UserInventoryTypeEnum.FOOD,
            }).save()
         }
         await ctx.reply('Добро пожаловать, Профессор, в Mutantorium!')
         logger.info(`Created user telegramId: ${ctx.from?.id?.toString()}`)
         return
      }
      logger.info(`Command start user id: ${user.id}`)
      await ctx.reply('C возвращением, Профессор, в Mutantorium!')
   } catch (e) {
      logger.error('Error create user', e)
   }
}

import { Context } from 'grammy'
import config from '../config'
import * as gameDb from 'game-db'
import { logger } from '../instance/loggerInstance'

export const monsterCommand = async (ctx: Context) => {
   try {
      const isReply = !!ctx.message?.reply_to_message
      const fromTelegramId = isReply
         ? ctx.message.reply_to_message?.from?.id?.toString()
         : ctx.from?.id?.toString()

      if (!fromTelegramId) {
         await ctx.reply('Ошибка: не удалось определить Telegram ID')
         return
      }

      const monster = await gameDb.AppDataSource.getRepository(gameDb.Entities.Monster)
         .createQueryBuilder('monster')
         .leftJoinAndSelect('monster.user', 'user')
         .leftJoinAndSelect('monster.files', 'files')
         .where('monster.isSelected = true')
         .andWhere('user.telegramId = :telegramId', { telegramId: fromTelegramId })
         .getOne()

      if (!monster) {
         await ctx.reply(isReply ? 'У противника нет монстра 🥲' : 'У вас нет монстра 🥲')
         return
      }

      const imageFile = monster.files?.find(
         (f) =>
            f.fileType === gameDb.datatypes.FileTypeEnum.IMAGE &&
            f.contentType === gameDb.datatypes.ContentTypeEnum.AVATAR_MONSTER,
      )

      if (imageFile?.url) {
         const imageUrl = `${config.fileUrlPrefix}/${imageFile.url}`

         try {
            await ctx.replyWithPhoto(imageUrl, {
               caption: `${isReply ? 'Монстр противника' : 'Ваш монстр'}: ${monster.name}\nУровень: ${monster.level}\nЗдоровье: ${monster.healthPoints}\nВыносливость: ${monster.stamina}\nСила: ${monster.strength}\nЗащита: ${monster.defense}\nУклонение: ${monster.evasion}\nОпыт: ${monster.experiencePoints}`,
            })
         } catch (err) {
            logger.error(`Error sent avatar monster. Url: ${imageUrl}`, err)
            await ctx.reply(
               `${isReply ? 'Монстр противника' : 'Ваш монстр'}: ${monster.name}, но картинка не найдена или недоступна`,
            )
         }
      } else {
         await ctx.reply(
            `${isReply ? 'Монстр противника' : 'Ваш монстр'}: ${monster.name}, но картинка не найдена`,
         )
      }
   } catch (error) {
      logger.error('Error commands /monster:', error)
      await ctx.reply('Произошла ошибка при выполнении команды /monster')
   }
}

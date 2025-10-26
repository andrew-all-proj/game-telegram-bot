import { Context, InputFile } from 'grammy'
import * as gameDb from 'game-db'
import { logger } from '../instance/loggerInstance'
import axios from 'axios'
import config from '../config'

function buildMonsterCaption(monster: any, isReply: boolean): string {
   return `${isReply ? 'Монстр противника' : 'Ваш монстр'}: ${monster.name}
Уровень: ${monster.level}
Здоровье: ${monster.healthPoints}
Выносливость: ${monster.stamina}
Сила: ${monster.strength}
Защита: ${monster.defense}
Уклонение: ${monster.evasion}
Опыт: ${monster.experiencePoints}`
}

async function sendMonsterPhotoByTelegramId(
   ctx: Context,
   caption: string,
   telegramFileId: string,
): Promise<boolean> {
   try {
      await ctx.replyWithPhoto(telegramFileId, { caption })
      return true
   } catch (err) {
      logger.error(`Error sending monster photo by telegramId: ${telegramFileId}`, err)
      return false
   }
}

async function sendMonsterPhotoByUrlAndSave(
   ctx: Context,
   caption: string,
   imageFile: gameDb.Entities.File,
): Promise<boolean> {
   try {
      const finalUrl = imageFile.url.startsWith('http')
         ? imageFile.url
         : `${config.fileUrlPrefix}/${imageFile.url}`

      const resp = await axios.get<ArrayBuffer>(finalUrl, {
         responseType: 'arraybuffer',
      })
      const buffer = Buffer.from(resp.data)

      const sentMsg = await ctx.replyWithPhoto(new InputFile(buffer), {
         caption,
      })

      const photos = (sentMsg as any).photo
      if (Array.isArray(photos) && photos.length > 0) {
         const biggest = photos[photos.length - 1]
         const newTelegramId = biggest.file_id as string | undefined

         if (newTelegramId && imageFile.id) {
            try {
               await gameDb.Entities.File.update(
                  { id: imageFile.id },
                  { telegramId: newTelegramId },
               )
            } catch (saveErr) {
               logger.error(
                  `Failed to save telegramId "${newTelegramId}" for file ${imageFile.id}`,
                  saveErr,
               )
            }
         }
      }

      return true
   } catch (err) {
      logger.error(`Error sending monster photo by URL: ${imageFile.url}`, err)
      return false
   }
}

export const monsterCommand = async (ctx: Context) => {
   try {
      const isReply = !!ctx.message?.reply_to_message
      const fromTelegramId = isReply
         ? ctx.message?.reply_to_message?.from?.id?.toString()
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

      const caption = buildMonsterCaption(monster, isReply)

      const imageFile = monster.files?.find(
         (f: any) =>
            f.fileType === gameDb.datatypes.FileTypeEnum.IMAGE &&
            f.contentType === gameDb.datatypes.ContentTypeEnum.AVATAR_MONSTER,
      )

      let sentWithPhoto = false

      if (imageFile) {
         if (imageFile.telegramId) {
            sentWithPhoto = await sendMonsterPhotoByTelegramId(ctx, caption, imageFile.telegramId)
         }

         if (!sentWithPhoto && imageFile.url) {
            sentWithPhoto = await sendMonsterPhotoByUrlAndSave(ctx, caption, imageFile)
         }
      }

      if (!sentWithPhoto) {
         await ctx.reply(`${caption}\n(изображение не найдено или недоступно)`)
      }
   } catch (error) {
      logger.error('Error command /monster:', error)
      await ctx.reply('Произошла ошибка при выполнении команды /monster')
   }
}

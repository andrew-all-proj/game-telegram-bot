import { Context } from 'grammy'
import config from '../config'
import * as gameDb from 'game-db'

export const fightCommand = async (ctx: Context) => {
   try {
      if (ctx.chat?.type === 'private' && !ctx.message?.reply_to_message) {
         await ctx.reply('Найди себе противника:', {
            reply_markup: {
               inline_keyboard: [
                  [
                     {
                        text: '⚔️ Поиск противников',
                        web_app: { url: `${config.urlWebApp}/search-battle` },
                     },
                  ],
               ],
            },
         })
         return
      }

      if (!ctx.message?.reply_to_message) {
         await ctx.reply('Выполните команду /fight ответом на сообщение с противником')
         return
      }

      const opponentFrom = ctx.message.reply_to_message.from
      const challengerFrom = ctx.from

      if (!opponentFrom || !challengerFrom) return
      if (opponentFrom.id === challengerFrom.id) {
         await ctx.reply('Нельзя вызвать самого себя на бой')
         return
      }
      if (opponentFrom.is_bot) {
         await ctx.reply('Нельзя вызвать бота на бой')
         return
      }

      const opponentUser = await gameDb.Entities.User.findOne({
         where: { idTelegram: opponentFrom.id.toString() },
      })

      if (!opponentUser) {
         await ctx.reply(
            `У пользователя ${opponentFrom.first_name} нет лаборатории. Пусть он начнёт с бота ${config.botUserName}`,
         )
         return
      }

      const challengerUser = await gameDb.Entities.User.findOne({
         where: { idTelegram: challengerFrom.id.toString() },
      })

      if (!challengerUser) {
         await ctx.reply(`У тебя ещё нет лаборатории. Начни с бота ${config.botUserName}`)
         return
      }

      const opponentMonster = await gameDb.Entities.Monster.findOne({
         where: { userId: opponentUser.id, isSelected: true },
      })

      if (!opponentMonster) {
         await ctx.reply(`У ${opponentFrom.first_name} нет активного монстра`)
         return
      }

      const challengerMonster = await gameDb.Entities.Monster.findOne({
         where: { userId: challengerUser.id, isSelected: true },
      })

      if (!challengerMonster) {
         await ctx.reply('У тебя нет активного монстра')
         return
      }

      const createBattle = await gameDb.Entities.MonsterBattles.create({
         challengerMonsterId: challengerMonster.id,
         opponentMonsterId: opponentMonster.id,
         status: gameDb.datatypes.BattleStatusEnum.PENDING,
      }).save()

      try {
         await ctx.api.sendMessage(opponentFrom.id, `⚔️ Вызов от ${challengerFrom.first_name}!`, {
            reply_markup: {
               inline_keyboard: [
                  [
                     {
                        text: 'Принять вызов',
                        web_app: { url: `${config.urlWebApp}/arena/${createBattle.id}` },
                     },
                  ],
               ],
            },
         })
      } catch (err) {
         await ctx.reply(
            `Не удалось отправить сообщение ${opponentFrom.first_name}. Убедитесь, что он открыл личку с ботом.`,
         )
         return
      }

      await ctx.reply(
         `Вызов отправлен ${opponentFrom.first_name}. Ждите его реакции. Если что, напомните ему открыть бот: ${config.botUserName}`,
      )

      await ctx.api.sendMessage(
         challengerFrom.id,
         `⚔️ Бой с ${opponentFrom.first_name} начнётся скоро`,
         {
            reply_markup: {
               inline_keyboard: [
                  [
                     {
                        text: 'Перейти в арену',
                        web_app: { url: `${config.urlWebApp}/arena/${createBattle.id}` },
                     },
                  ],
               ],
            },
         },
      )
   } catch (error) {
      console.error('Ошибка в /fight:', error)
      await ctx.reply('Произошла ошибка при выполнении команды /fight')
   }
}

import { Context } from 'grammy'
import config from '../config'
import * as gameDb from 'game-db'
import { v4 as uuidv4 } from 'uuid'
import { redis } from '../redis'

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

      if (
         !opponentFrom ||
         !challengerFrom ||
         opponentFrom.id === challengerFrom.id ||
         opponentFrom.is_bot
      ) {
         await ctx.reply('Некорректный вызов')
         return
      }

      const [challengerUser, opponentUser] = await Promise.all([
         gameDb.Entities.User.findOne({ where: { telegramId: challengerFrom.id.toString() } }),
         gameDb.Entities.User.findOne({ where: { telegramId: opponentFrom.id.toString() } }),
      ])
      if (!challengerUser || !opponentUser) {
         await ctx.reply('У кого-то из вас нет лаборатории')
         return
      }

      const [challengerMonster, opponentMonster] = await Promise.all([
         gameDb.Entities.Monster.findOne({
            where: { userId: challengerUser.id, isSelected: true },
         }),
         gameDb.Entities.Monster.findOne({ where: { userId: opponentUser.id, isSelected: true } }),
      ])
      if (!challengerMonster || !opponentMonster) {
         await ctx.reply('У кого-то из вас нет активного монстра')
         return
      }

      const requestId = `battleReq:${uuidv4()}`
      await redis.set(
         requestId,
         JSON.stringify({
            challengerMonsterId: challengerMonster.id,
            opponentMonsterId: opponentMonster.id,
            challengerTelegramId: challengerUser.telegramId,
            opponentTelegramId: opponentUser.telegramId,
            challengerName: challengerFrom.first_name,
            opponentName: opponentFrom.first_name,
            chatId: ctx.chat?.id,
         }),
         'EX',
         300,
      )

      await ctx.api.sendMessage(opponentFrom.id, `⚔️ Вызов от ${challengerFrom.first_name}!`, {
         reply_markup: {
            inline_keyboard: [
               [
                  { text: '✅ Принять', callback_data: `${requestId}:accept` },
                  { text: '❌ Отказаться', callback_data: `${requestId}:decline` },
               ],
            ],
         },
      })

      await ctx.reply(`Вызов отправлен ${opponentFrom.first_name}`)
   } catch (error) {
      console.error('Ошибка в /fight:', error)
      await ctx.reply('Произошла ошибка при выполнении команды /fight')
   }
}

export const fightCallBack = async (ctx: Context) => {
   const data = ctx.callbackQuery?.data
   if (!data?.startsWith('battleReq:')) return

   const [_, requestId, action] = data.split(':')
   const redisKey = `battleReq:${requestId}`
   const raw = await redis.get(redisKey)
   if (!raw) {
      await ctx.answerCallbackQuery({ text: '⚠️ Истек срок действия заявки', show_alert: true })
      return
   }

   const {
      challengerMonsterId,
      opponentMonsterId,
      challengerTelegramId,
      opponentTelegramId,
      challengerName,
      opponentName,
      chatId,
   } = JSON.parse(raw)

   if (action === 'decline') {
      await ctx.answerCallbackQuery({ text: 'Вы отказались от боя', show_alert: true })

      await ctx.api.sendMessage(challengerTelegramId, `❌ ${opponentName} отказался от боя`)
      if (chatId) {
         await ctx.api.sendMessage(
            chatId,
            `❌ Этот сыкло ${opponentName} отказался от боя против ${challengerName}`,
         )
      }

      await redis.del(redisKey)
      return
   }

   const battle = await gameDb.Entities.MonsterBattles.create({
      challengerMonsterId,
      opponentMonsterId,
      status: gameDb.datatypes.BattleStatusEnum.PENDING,
   }).save()

   const url = `${config.urlWebApp}/arena/${battle.id}`

   await ctx.answerCallbackQuery({ text: 'Бой начат! Переходите в арену!' })

   await Promise.all([
      ctx.api.sendMessage(challengerTelegramId, `⚔️ Бой начался!`, {
         reply_markup: {
            inline_keyboard: [[{ text: 'Перейти в арену', web_app: { url } }]],
         },
      }),
      ctx.api.sendMessage(opponentTelegramId, `⚔️ Вы приняли вызов!`, {
         reply_markup: {
            inline_keyboard: [[{ text: 'Перейти в арену', web_app: { url } }]],
         },
      }),
   ])

   await redis.del(redisKey)
}

import { Context } from 'grammy'
import config from '../config'
import * as gameDb from 'game-db'
import { v4 as uuidv4 } from 'uuid'
import { redis } from '../instance/redisInstance'
import { logger } from '../instance/loggerInstance'
import { calculateAndSaveEnergy } from '../functions/calculateAndSaveEnergy'
import { fetchRequest } from '../functions/fetchRequest'

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
         if (!challengerUser && !opponentUser) {
            await ctx.reply('Ни у одного из игроков нет лаборатории')
         } else if (!challengerUser) {
            await ctx.reply(`У ${challengerFrom.first_name} нет лаборатории`)
         } else {
            await ctx.reply(`У ${opponentFrom.first_name} нет лаборатории`)
         }
         return
      }

      await Promise.all([
         calculateAndSaveEnergy(opponentUser),
         calculateAndSaveEnergy(challengerUser),
      ])

      if (challengerUser.energy < 125) {
         await ctx.reply('Недостаточно энергии для вызова на бой. Требуется 125 энергии.')
         return
      }

      if (opponentUser.energy < 125) {
         await ctx.reply(
            `У ${opponentFrom.first_name} недостаточно энергии для боя. Требуется 125 энергии.`,
         )
         return
      }

      const [challengerMonster, opponentMonster] = await Promise.all([
         gameDb.Entities.Monster.findOne({
            where: { userId: challengerUser.id, isSelected: true },
         }),
         gameDb.Entities.Monster.findOne({
            where: { userId: opponentUser.id, isSelected: true },
         }),
      ])

      if (!challengerMonster || !opponentMonster) {
         if (!challengerMonster && !opponentMonster) {
            await ctx.reply('Ни у одного из игроков нет активного монстра')
         } else if (!challengerMonster) {
            await ctx.reply(`У ${challengerUser.name} нет активного монстра`)
         } else {
            await ctx.reply(`У ${opponentUser.name} нет активного монстра`)
         }
         return
      }

      if (challengerMonster.satiety < 25) {
         await ctx.reply(
            'Ваш монстр слишком голоден, чтобы сражаться. Накормите его хотя бы на 25 единиц сытости.',
         )
         return
      }

      if (opponentMonster.satiety < 25) {
         await ctx.reply(
            `Монстр ${opponentMonster.name} слишком голоден, чтобы сражаться. Ему нужно накормить его хотя бы на 25 единиц сытости.`,
         )
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
      logger.error('Error commands /fight:', error)
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

   const createBattleResponce = await fetchRequest({
      url: `http://${config.apiServiceUrl}/battle/create-battle`,
      method: 'POST',
      headers: { Authorization: `Bearer ${config.internalSecret}` },
      data: {
         opponentMonsterId: opponentMonsterId,
         challengerMonsterId: challengerMonsterId,
      },
   }).catch((error) => logger.error('Fetch result create battle', error))

   if (!createBattleResponce.data?.id || createBattleResponce.data?.id === null) {
      await ctx.api.sendMessage(chatId, `❌ ошибка создания боя`)
      return
   }

   const url = `${config.urlWebApp}/arena/${createBattleResponce.data.id}`

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

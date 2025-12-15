import { logger } from '../../../instance/loggerInstance'
import { NotificationHandler } from '../types'
import { z } from 'zod'
import { bot } from '../../../instance/botInstance'
import * as gameDb from 'game-db'

const idAsString = z.union([z.string(), z.number()]).transform((val) => String(val))
const finishedAt = z
   .union([z.string(), z.number(), z.date()])
   .optional()
   .transform((val) => {
      if (val instanceof Date) return val.toISOString()
      if (typeof val === 'number') return new Date(val).toISOString()
      return val
   })

const battleDataSchema = z.object({
   battleId: idAsString,
   winnerMonsterId: idAsString,
   loserMonsterId: idAsString,
   challengerUserId: idAsString,
   opponentUserId: idAsString,
   challengerGetReward: z.unknown().optional(),
   opponentGetReward: z.unknown().optional(),
   chatId: idAsString.optional(),
   finishedAt,
})

const battleCompletedPayloadSchema = z.union([
   z.object({ data: battleDataSchema }),
   battleDataSchema,
])

export type BattleCompletedPayload = z.infer<typeof battleCompletedPayloadSchema>

export const battleCompletedHandler: NotificationHandler = async (parsed) => {
   const parsedPayload = battleCompletedPayloadSchema.safeParse(parsed.payload)

   if (!parsedPayload.success) {
      logger.warn('RabbitMQ message skipped: invalid battle.completed payload', {
         pattern: parsed.pattern,
         issues: parsedPayload.error.issues,
         content: parsed.raw,
      })
      return
   }

   const dto = 'data' in parsedPayload.data ? parsedPayload.data.data : parsedPayload.data

   const gameBattle = await gameDb.Entities.MonsterBattles.findOne({
      where: { id: dto.battleId },
      relations: ['winnerMonster', 'challengerMonster', 'opponentMonster'],
   })

   if (!gameBattle) {
      logger.warn('battleCompletedHandler skipped: battle not found', { battleId: dto.battleId })
      return
   }

   const { winnerMonster, challengerMonster, opponentMonster, chatId } = gameBattle

   if (!winnerMonster || !challengerMonster || !opponentMonster) {
      logger.warn('battleCompletedHandler skipped: battle missing monsters', {
         battleId: dto.battleId,
      })
      return
   }

   const loserMonster =
      winnerMonster.id === challengerMonster.id ? opponentMonster : challengerMonster
   const targetChatId = chatId ?? dto.chatId

   if (!targetChatId) {
      logger.warn('battleCompletedHandler skipped: chatId not provided', {
         battleId: dto.battleId,
         content: parsed.raw,
      })
      return
   }

   const message = `🏆 Победил монстр: ${winnerMonster.name}\n😢 Проиграл: ${loserMonster.name}`
   await bot.api.sendMessage(targetChatId, message)
}

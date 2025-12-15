import { bot } from '../../../instance/botInstance'
import { logger } from '../../../instance/loggerInstance'
import { NotificationHandler } from '../types'
import { z } from 'zod'

const idAsString = z.union([z.string(), z.number()]).transform((val) => String(val))

const baseTelegramSchema = z.object({
   userId: z.string(),
   telegramId: idAsString,
   message: z.string().min(1),
   publishAt: z
      .union([z.string(), z.number(), z.date()])
      .optional()
      .transform((val) => {
         if (val instanceof Date) return val.toISOString()
         if (typeof val === 'number') return new Date(val).toISOString()
         return val
      }),
})

const telegramNotificationSchema = z.union([
   z.object({ data: baseTelegramSchema }),
   baseTelegramSchema,
])

export type TelegramNotificationPayload = z.infer<typeof telegramNotificationSchema>

export const notificationTelegramHandler: NotificationHandler = async (parsed) => {
   const parsedPayload = telegramNotificationSchema.safeParse(parsed.payload)

   if (!parsedPayload.success) {
      logger.warn('RabbitMQ message skipped: invalid notification.telegram payload', {
         pattern: parsed.pattern,
         issues: parsedPayload.error.issues,
         content: parsed.raw,
      })
      return
   }

   const dto = 'data' in parsedPayload.data ? parsedPayload.data.data : parsedPayload.data

   try {
      await bot.api.sendMessage(dto.telegramId, dto.message)
   } catch (error) {
      logger.error('Failed to send notification.telegram', {
         error,
         userId: dto.userId,
         telegramId: dto.telegramId,
      })
      throw error
   }
}

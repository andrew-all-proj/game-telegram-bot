import { ConsumeMessage } from 'amqplib'
import config from '../../config'
import { logger } from '../../instance/loggerInstance'
import { getRabbitChannel } from '../../instance/rabbitMqInstance'
import { battleCompletedHandler } from './handlers/battleCompleted'
import { NotificationHandler, ParsedMessage } from './types'

const handlers: Record<string, NotificationHandler> = {
   'battle.completed': battleCompletedHandler,
}

function parseMessage(message: ConsumeMessage): ParsedMessage {
   const raw = message.content.toString()
   try {
      const payload = JSON.parse(raw) as ParsedMessage
      return {
         pattern: payload.pattern ?? null,
         payload: payload.payload ?? payload,
         raw,
      }
   } catch {
      return { pattern: null, raw }
   }
}

export async function startNotificationConsumer() {
   const channel = await getRabbitChannel()
   const queue = config.rabbitMq.queue

   if (!queue) {
      throw new Error('RabbitMQ events queue is not configured')
   }

   await channel.assertQueue(queue, { durable: true })

   await channel.consume(
      queue,
      async (message) => {
         console.log('Using RabbitMQ queue:', message)
         if (!message) return

         const parsed = parseMessage(message)

         if (!parsed.pattern) {
            logger.info('RabbitMQ message ignored (unknown pattern)', {
               pattern: parsed.pattern,
               queue,
            })
            channel.ack(message)
            return
         }

         const handler = handlers[parsed.pattern]

         if (!handler) {
            logger.info('RabbitMQ message ignored (unknown handler)', {
               pattern: parsed.pattern,
               queue,
            })
            channel.ack(message)
            return
         }

         try {
            console.log('Handling message with pattern:', parsed)
            await handler(parsed)
            channel.ack(message)
         } catch (error) {
            logger.error('Error handling notification message', { error, queue })
            channel.nack(message, false, false)
         }
      },
      { noAck: false },
   )

   logger.info(`RabbitMQ notification consumer started on queue ${queue}`)
}

import { Channel, ChannelModel, connect } from 'amqplib'
import config from '../config'
import { logger } from './loggerInstance'

let channel: Channel | null = null
let connection: ChannelModel | null = null

const reconnectDelayMs = 3000

async function createConnection(): Promise<Channel> {
   const newConnection = await connect(config.rabbitMq.url)
   connection = newConnection

   newConnection.on('error', (err) => {
      logger.error('RabbitMQ connection error', err)
   })

   newConnection.on('close', () => {
      logger.warn('RabbitMQ connection closed, channel cleared')
      channel = null
      connection = null
   })

   const newChannel = await newConnection.createChannel()
   await newChannel.prefetch(5)

   return newChannel
}

export async function getRabbitChannel(): Promise<Channel> {
   if (channel) return channel

   for (let attempt = 1; attempt <= 5; attempt++) {
      try {
         channel = await createConnection()
         logger.info('RabbitMQ channel established')
         return channel
      } catch (error) {
         logger.error(`RabbitMQ connect attempt ${attempt} failed`, error)
         if (attempt === 5) {
            throw error
         }
         await new Promise((resolve) => setTimeout(resolve, reconnectDelayMs))
      }
   }

   throw new Error('Failed to establish RabbitMQ channel')
}

export async function closeRabbitConnection() {
   try {
      await channel?.close()
      await connection?.close()
   } catch (error) {
      logger.error('Error closing RabbitMQ connection', error)
   } finally {
      channel = null
      connection = null
   }
}

import * as winston from 'winston'
import { ElasticsearchTransport } from 'winston-elasticsearch'
import config from '../config'

const transports: winston.transport[] = [
   new winston.transports.Console({
      format: winston.format.combine(
         winston.format.timestamp(),
         winston.format.printf(({ level, message, timestamp }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`
         }),
      ),
   }),
]

try {
   const esTransport = new ElasticsearchTransport({
      level: 'info',
      clientOpts: {
         node: config.loggerUrl || 'http://localhost:9200',
         auth: {
            username: process.env.ELASTIC_USERNAME || '',
            password: process.env.ELASTIC_PASSWORD || '',
         },
      },
      indexPrefix: 'bot',
   })

   transports.push(esTransport)
} catch (error) {
   console.warn('⚠️ Elasticsearch transport disabled:', (error as Error).message)
}

export const logger = winston.createLogger({
   level: 'info',
   transports,
})

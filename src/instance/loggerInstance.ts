import * as winston from 'winston'
import { ElasticsearchTransport } from 'winston-elasticsearch'

const transports: winston.transport[] = [
   new winston.transports.Console({
      format: winston.format.combine(
         winston.format.timestamp(),
         winston.format.printf(({ level, message, timestamp }) => {
            const ts =
               typeof timestamp === 'string'
                  ? timestamp
                  : timestamp instanceof Date
                    ? timestamp.toISOString()
                    : new Date().toISOString()
            const msg = typeof message === 'string' ? message : JSON.stringify(message)
            const lvl = typeof level === 'string' ? level.toUpperCase() : String(level)
            return `[${ts}] ${lvl}: ${msg}`
         }),
      ),
   }),
]

try {
   const esTransport = new ElasticsearchTransport({
      level: 'info',
      indexPrefix: 'bot',
      bufferLimit: 1,
      format: winston.format.combine(
         winston.format.timestamp(),
         winston.format((info) => {
            info['@timestamp'] = info.timestamp
            delete info.timestamp
            return info
         })(),
         winston.format.json(),
      ),
      clientOpts: {
         node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
         auth: {
            username: process.env.ELASTIC_USERNAME || '',
            password: process.env.ELASTIC_PASSWORD || '',
         },
      },
      ensureIndexTemplate: false,
   })

   esTransport.on('error', (err) => {
      console.error('ElasticsearchTransport error:', err.message)
   })

   console.log('Elasticsearch transport initialized')
   transports.push(esTransport)
} catch (error) {
   console.warn('Elasticsearch transport failed to initialize:', (error as Error).message)
}

export const logger = winston.createLogger({
   level: 'info',
   transports,
})

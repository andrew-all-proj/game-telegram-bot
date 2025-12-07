import { Router } from 'express'
import { resultBattle } from './resultBattle'
import { authMiddleware } from '../middleware/authMiddleware'
import { logger } from '../instance/loggerInstance'

const router = Router()

router.get('/health', (req, res) => {
   res.json({ status: 'ok' })
})

router.get('/result-battle/:battle_id', authMiddleware, async (req, res) => {
   const { battle_id } = req.params
   try {
      await resultBattle(battle_id)
      res.status(200).send()
   } catch (error) {
      logger.error('Error in /result-battle handler', error)
      res.status(500).send()
   }
})

export default router

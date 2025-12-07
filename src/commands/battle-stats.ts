import { Context } from 'grammy'
import * as gameDb from 'game-db'
import { logger } from '../instance/loggerInstance'

export const battleStatsCommand = async (ctx: Context) => {
   try {
      const userTelegramId = ctx.from?.id?.toString()
      if (!userTelegramId) return ctx.reply('Не удалось определить Telegram ID')

      const monster = await gameDb.AppDataSource.getRepository(gameDb.Entities.Monster)
         .createQueryBuilder('m')
         .leftJoin('m.user', 'u')
         .where('m.isSelected = true')
         .andWhere('u.telegramId = :tid', { tid: userTelegramId })
         .getOne()

      if (!monster) return ctx.reply('У вас нет активного монстра 🥲')

      const now = new Date()
      const startOfTodayUtc = new Date(
         Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      )

      const battles = await gameDb.AppDataSource.getRepository(gameDb.Entities.MonsterBattles)
         .createQueryBuilder('b')
         .where('b.createdAt >= :startUtc', { startUtc: startOfTodayUtc })
         .andWhere('(b.challengerMonsterId = :mid OR b.opponentMonsterId = :mid)', {
            mid: monster.id,
         })
         .andWhere('b.status = :status', { status: gameDb.datatypes.BattleStatusEnum.FINISHED })
         .getMany()

      let wins = 0,
         losses = 0,
         draws = 0
      for (const battle of battles) {
         if (!battle.winnerMonsterId) draws++
         else if (battle.winnerMonsterId === monster.id) wins++
         else losses++
      }

      const total = battles.length
      const winrate = total > 0 ? Math.round((wins / total) * 100) : 0

      await ctx.reply(
         `📊 *Статистика боёв за сегодня*\n` +
            `Монстр: *${monster.name}*\n\n` +
            `Всего боёв: *${total}*\n` +
            `Побед: *${wins}*\n` +
            `Поражений: *${losses}*\n` +
            `Ничьи: *${draws}*\n` +
            `Winrate: *${winrate}%*`,
         { parse_mode: 'Markdown' },
      )
   } catch (e) {
      logger.error(e)
      await ctx.reply('Произошла ошибка при запросе статистики')
   }
}

import { bot } from '../botInstance'
import * as gameDb from 'game-db'

export const resultBattle = async (battleId: string) => {
   if (!battleId) return

   const gameBattle = await gameDb.Entities.MonsterBattles.findOne({
      where: { id: battleId },
      relations: ['winnerMonster', 'challengerMonster', 'opponentMonster'],
   })

   console.log(gameBattle)

   if (!gameBattle) return

   const { winnerMonster, challengerMonster, opponentMonster, chatId } = gameBattle

   if (!winnerMonster || !challengerMonster || !opponentMonster) return

   const loserMonster =
      winnerMonster.id === challengerMonster.id ? opponentMonster : challengerMonster

   console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
   if (chatId) {
      await bot.api.sendMessage(
         chatId,
         `🏆 Победил монстр: ${winnerMonster.name}\n😢 Проиграл: ${loserMonster.name}`,
      )
   }
   return
}

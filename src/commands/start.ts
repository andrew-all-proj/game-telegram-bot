import { Context } from 'grammy'

export const startCommand = async (ctx: Context) => {
   await ctx.reply(
      'Добро пожаловать Професор в MonstroFarm! Вы можете создать своего первого монстра с помощью команды /create',
   )
}

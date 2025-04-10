import { Context } from 'grammy'

export const fightCommand = async (ctx: Context) => {
   try {
      if (ctx.chat?.type === 'private') {
         await ctx.reply('В бой!!!!', {
            reply_markup: {
               inline_keyboard: [
                  [
                     {
                        text: '⚔️ Арена',
                        web_app: { url: 'https://game.managetlg.com' },
                     },
                  ],
               ],
            },
         })
      } else {
         const targetUser = ctx.message?.reply_to_message?.from
         await ctx.reply(
            `Открой личку с ботом, чтобы начать бой c ${targetUser?.first_name} ⚔️ @Game_bot_testBot`,
         )

         if (ctx.from?.id) {
            await ctx.api.sendMessage(ctx.from.id, `В бой!!!! c ${targetUser?.first_name}`, {
               reply_markup: {
                  inline_keyboard: [
                     [
                        {
                           text: '⚔️ Арена',
                           web_app: { url: 'https://game.managetlg.com' },
                        },
                     ],
                  ],
               },
            })
         }
      }
   } catch (error) {
      console.error('Reply error:', error)
   }
}

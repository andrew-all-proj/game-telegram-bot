import { Context } from 'grammy'
import config from '../config'

export const fightCommand = async (ctx: Context) => {
   try {
      if (ctx.chat?.type === 'private') {
         await ctx.reply('В бой!!!!', {
            reply_markup: {
               inline_keyboard: [
                  [
                     {
                        text: '⚔️ Арена',
                        web_app: { url: `${config.urlWebApp}/arena` },
                     },
                  ],
               ],
            },
         })
      } else {
         if (!ctx.message?.reply_to_message) {
            await ctx.reply(`Выполните команду /fight реплаем на сообщение с вашим противником`)
            return
         }
         const targetUser = ctx.message?.reply_to_message?.from
         if (targetUser?.id) {
            if (targetUser.is_bot) {
               return
            }
            // Send a message to the target user
            try {
               await ctx.api.sendMessage(targetUser?.id, `В бой!!!! c ${ctx.from?.first_name}`, {
                  reply_markup: {
                     inline_keyboard: [
                        [
                           {
                              text: '⚔️ Арена',
                              web_app: { url: `${config.urlWebApp}/arena` },
                           },
                        ],
                     ],
                  },
               })
            } catch (err) {
               console.log(err)
               await ctx.reply(
                  `У пользователя ${targetUser?.first_name} нет лаборатории с подопечными. Может создать свою лабораторию с подопечными в боте ${config.botUserName}`,
               )
               return
            }
         }

         await ctx.reply(
            `Открой личку с ботом, чтобы начать бой c ${targetUser?.first_name} ⚔️ ${config.botUserName}`,
         )

         if (ctx.from?.id) {
            // Send a message to the user
            await ctx.api.sendMessage(ctx.from.id, `В бой!!!! c ${targetUser?.first_name}`, {
               reply_markup: {
                  inline_keyboard: [
                     [
                        {
                           text: '⚔️ Арена',
                           web_app: { url: `${config.urlWebApp}/arena` },
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

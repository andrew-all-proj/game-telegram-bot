import { Context } from 'grammy'

export const helpCommand = async (ctx: Context) => {
   await ctx.reply(
      'Професор! Чем я могу вам помочь? \n\n' +
         '1. /start - Запустить бота \n' +
         '2. /help - Помощь \n' +
         '3. /create - Создать монстра \n' +
         '4. /monster - Информация о монстре \n' +
         '5. /fight - Бой с монстром \n' +
         '6. /laboratory - Лаборатория \n',
   )
}

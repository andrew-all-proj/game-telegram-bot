import { Bot } from "grammy";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.BOT_TOKEN) {
  throw new Error("BOT_TOKEN не указан в .env");
}

const bot = new Bot(process.env.BOT_TOKEN);

bot.command("start", async (ctx) => {
  await ctx.reply(`👋 Привет! Я бот, для игры "Профессор Генезис"`);
});

bot.command("help", async (ctx) => {
  await ctx.reply("✏️ Напиши любое сообщение — я повторю его тебе!");
});

bot.on("message:text", async (ctx) => {
  await ctx.reply(`🔁 Ты написал: ${ctx.message.text}`);
});

bot.start();

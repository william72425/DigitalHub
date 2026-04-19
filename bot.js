const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 1379973354;

const users = new Map();

console.log('Bot starting...');

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;
    
    if (!users.has(userId)) {
        users.set(userId, { username, firstName, joined: new Date().toISOString() });
        console.log(`New user: ${userId} @${username}`);
    }
    
    ctx.reply(`Welcome ${firstName}! Bot is working.\n\nCommands:\n/users - Show all users\n/test - Check bot`);
});

bot.command('users', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return ctx.reply('Admin only');
    
    if (users.size === 0) return ctx.reply('No users.');
    
    let msg = `📊 USERS (${users.size})\n\n`;
    let i = 1;
    for (const [id, data] of users) {
        msg += `${i}. ${data.firstName} (@${data.username || 'no username'})\n   ID: ${id}\n\n`;
        i++;
    }
    ctx.reply(msg);
});

bot.command('test', (ctx) => {
    ctx.reply('✅ Bot is working!');
});

bot.launch()
    .then(() => console.log('Bot running!'))
    .catch(err => console.error('Error:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

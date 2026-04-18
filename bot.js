const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 1379973354;

// Store users
const users = new Map();

console.log('Bot starting...');

const bot = new Telegraf(BOT_TOKEN);

// Track when users start the bot
bot.start((ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;
    
    if (!users.has(userId)) {
        users.set(userId, {
            username: username,
            firstName: firstName,
            joined: new Date().toISOString()
        });
        console.log(`New user: ${userId} @${username}`);
    }
    
    ctx.reply(`Welcome ${firstName}! Bot is working.`);
});

// /users - Show all users (admin only)
bot.command('users', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        ctx.reply('Admin only');
        return;
    }
    
    if (users.size === 0) {
        ctx.reply('No users yet.');
        return;
    }
    
    let message = `📊 USERS (${users.size})\n\n`;
    let count = 1;
    
    for (const [userId, data] of users) {
        message += `${count}. ${data.firstName} (@${data.username || 'no username'})\n`;
        message += `   ID: ${userId}\n`;
        message += `   Joined: ${new Date(data.joined).toLocaleDateString()}\n\n`;
        count++;
    }
    
    ctx.reply(message);
});

// /announce - Send message to specific users (admin only)
bot.command('announce', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        ctx.reply('Admin only');
        return;
    }
    
    ctx.reply(
        `📢 SEND ANNOUNCEMENT\n\n` +
        `Format: /announce @username1 @username2 @username3 your message here\n\n` +
        `Example:\n` +
        `/announce @william815 @john_doe Hello! New discount available!`
    );
});

// Handle announce command with parameters
bot.command('announce', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    
    const text = ctx.message.text;
    const parts = text.split(' ');
    
    // Extract usernames (words starting with @)
    const usernames = [];
    const messageParts = [];
    
    for (const part of parts.slice(1)) { // Skip /announce
        if (part.startsWith('@')) {
            usernames.push(part.replace('@', ''));
        } else {
            messageParts.push(part);
        }
    }
    
    const announcementMessage = messageParts.join(' ');
    
    if (usernames.length === 0 || !announcementMessage) {
        ctx.reply(
            `❌ Invalid format.\n\n` +
            `Use: /announce @username1 @username2 Your message here`
        );
        return;
    }
    
    ctx.reply(`📢 Sending to ${usernames.length} users...`);
    
    let sent = 0;
    let failed = 0;
    const failedList = [];
    
    for (const username of usernames) {
        let foundUserId = null;
        
        // Find user ID by username
        for (const [userId, data] of users) {
            if (data.username === username) {
                foundUserId = userId;
                break;
            }
        }
        
        if (!foundUserId) {
            failed++;
            failedList.push(`@${username} (not found in database)`);
            continue;
        }
        
        try {
            await bot.telegram.sendMessage(foundUserId, 
                `📢 <b>ANNOUNCEMENT</b>\n\n${announcementMessage}`,
                { parse_mode: 'HTML' }
            );
            sent++;
        } catch (err) {
            failed++;
            failedList.push(`@${username} (error: ${err.message})`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 100));
    }
    
    let result = `✅ Done!\n\nSent: ${sent}\nFailed: ${failed}\n`;
    if (failedList.length > 0) {
        result += `\nFailed users:\n${failedList.join('\n')}`;
    }
    
    ctx.reply(result);
});

// /test command
bot.command('test', (ctx) => {
    ctx.reply('✅ Bot is working!');
});

// Launch
bot.launch()
    .then(() => console.log('Bot running!'))
    .catch(err => console.error('Error:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

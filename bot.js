const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 1379973354;

// Simple storage
const users = new Map();
let announceMode = false;
let announceTargets = [];
let announceMessage = '';
let announcePhoto = null;

console.log('Bot starting...');

const bot = new Telegraf(BOT_TOKEN);

// ============================================
// START COMMAND
// ============================================
bot.start((ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;
    
    // Save user
    if (!users.has(userId)) {
        users.set(userId, { username, firstName, joined: new Date().toISOString() });
        console.log(`New user: ${userId} @${username}`);
    }
    
    // Admin menu
    if (userId === ADMIN_ID) {
        const adminMenu = Markup.inlineKeyboard([
            [Markup.button.callback('👥 Show Users', 'admin_users')],
            [Markup.button.callback('📢 Announce', 'admin_announce')],
            [Markup.button.callback('🧪 Test', 'admin_test')]
        ]);
        ctx.reply(`🔧 Admin Panel\nUsers: ${users.size}`, adminMenu);
    } else {
        ctx.reply(`Welcome ${firstName}! Bot is working.`);
    }
});

// ============================================
// ADMIN ACTIONS
// ============================================

// Show users
bot.action('admin_users', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        ctx.answerCbQuery('Admin only');
        return;
    }
    ctx.answerCbQuery();
    
    if (users.size === 0) {
        ctx.reply('No users yet.');
        return;
    }
    
    let text = `👥 USERS (${users.size})\n\n`;
    let i = 1;
    for (const [id, data] of users) {
        text += `${i}. ${data.firstName} (@${data.username || 'no username'})\n`;
        text += `   ID: ${id}\n\n`;
        i++;
    }
    ctx.reply(text);
});

// Test
bot.action('admin_test', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        ctx.answerCbQuery('Admin only');
        return;
    }
    ctx.answerCbQuery();
    ctx.reply('✅ Bot is working!');
});

// Start announce
bot.action('admin_announce', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        ctx.answerCbQuery('Admin only');
        return;
    }
    ctx.answerCbQuery();
    
    announceMode = true;
    announceTargets = [];
    announceMessage = '';
    announcePhoto = null;
    
    const targetMenu = Markup.inlineKeyboard([
        [Markup.button.callback('📢 ALL USERS', 'target_all')],
        [Markup.button.callback('✏️ SPECIFIC', 'target_specific')],
        [Markup.button.callback('❌ Cancel', 'announce_cancel')]
    ]);
    
    ctx.reply(`📢 Who should receive?`, targetMenu);
});

// Target ALL users
bot.action('target_all', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    ctx.answerCbQuery();
    
    announceTargets = Array.from(users.keys());
    ctx.editMessageText(`📢 Target: ALL ${announceTargets.length} users\n\nSend your message now.`);
});

// Target SPECIFIC users
bot.action('target_specific', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    ctx.answerCbQuery();
    
    ctx.editMessageText(
        `📢 Send usernames, one per line:\n\n` +
        `@user1\n@user2\n@user3\n\n` +
        `Send /cancel to stop.`
    );
});

// Cancel announce
bot.action('announce_cancel', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    ctx.answerCbQuery();
    
    announceMode = false;
    announceTargets = [];
    announceMessage = '';
    announcePhoto = null;
    
    ctx.editMessageText('❌ Cancelled.');
});

// Handle text messages (for usernames or announcement)
bot.on('text', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    if (!announceMode) return;
    
    // If we already have targets, this is the message
    if (announceTargets.length > 0 && !announceMessage) {
        announceMessage = ctx.message.text;
        
        const confirm = Markup.inlineKeyboard([
            [Markup.button.callback('✅ SEND', 'announce_send')],
            [Markup.button.callback('❌ Cancel', 'announce_cancel')]
        ]);
        
        ctx.reply(`📢 PREVIEW\n\nTarget: ${announceTargets.length} users\n\nMessage:\n${announceMessage}\n\nSend?`, confirm);
        return;
    }
    
    // If no targets yet, parse usernames
    if (announceTargets.length === 0) {
        const text = ctx.message.text;
        const lines = text.split('\n');
        const found = [];
        
        for (const line of lines) {
            const match = line.match(/@(\w+)/);
            if (match) {
                const username = match[1];
                for (const [id, data] of users) {
                    if (data.username === username) {
                        found.push(id);
                        break;
                    }
                }
            }
        }
        
        if (found.length === 0) {
            ctx.reply('❌ No valid usernames found. Try again.');
            return;
        }
        
        announceTargets = found;
        ctx.reply(`✅ Found ${found.length} users.\n\nNow send your announcement message.`);
    }
});

// Handle photos
bot.on('photo', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    if (!announceMode) return;
    if (announceTargets.length === 0) return;
    
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    announcePhoto = photo.file_id;
    announceMessage = ctx.message.caption || '';
    
    const confirm = Markup.inlineKeyboard([
        [Markup.button.callback('✅ SEND', 'announce_send')],
        [Markup.button.callback('❌ Cancel', 'announce_cancel')]
    ]);
    
    ctx.reply(`📢 PREVIEW\n\nTarget: ${announceTargets.length} users\n\nPhoto + Caption: ${announceMessage}\n\nSend?`, confirm);
});

// Send announcement
bot.action('announce_send', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    ctx.answerCbQuery();
    
    let sent = 0;
    let failed = 0;
    
    for (const userId of announceTargets) {
        try {
            if (announcePhoto) {
                await bot.telegram.sendPhoto(userId, announcePhoto, {
                    caption: announceMessage,
                    parse_mode: 'HTML'
                });
            } else {
                await bot.telegram.sendMessage(userId, announceMessage, { parse_mode: 'HTML' });
            }
            sent++;
        } catch (err) {
            failed++;
        }
        await new Promise(r => setTimeout(r, 50));
    }
    
    ctx.editMessageText(`✅ Done!\nSent: ${sent}\nFailed: ${failed}`);
    
    // Reset
    announceMode = false;
    announceTargets = [];
    announceMessage = '';
    announcePhoto = null;
});

// Cancel command
bot.command('cancel', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    announceMode = false;
    announceTargets = [];
    announceMessage = '';
    announcePhoto = null;
    ctx.reply('❌ Cancelled.');
});

// Launch
bot.launch()
    .then(() => console.log('✅ Bot running!'))
    .catch(err => console.error('Error:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

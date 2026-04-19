const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 1379973354;

const users = new Map();

console.log('Bot starting...');

const bot = new Telegraf(BOT_TOKEN);

// Track users
bot.start((ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;
    
    if (!users.has(userId)) {
        users.set(userId, { username, firstName, joined: new Date().toISOString() });
        console.log(`New user: ${userId} @${username}`);
    }
    
    // Show different menu for admin vs normal user
    let reply = `Welcome ${firstName}!\n\nBot is working.`;
    
    if (ctx.from.id === ADMIN_ID) {
        const adminMenu = Markup.inlineKeyboard([
            [Markup.button.callback('📊 Show All Users', 'admin_users')],
            [Markup.button.callback('📢 Send Announcement', 'admin_announce_start')],
            [Markup.button.callback('🧪 Test Bot', 'admin_test')]
        ]);
        reply += `\n\n🔧 Admin Panel:`;
        ctx.reply(reply, { parse_mode: 'HTML', ...adminMenu });
    } else {
        ctx.reply(reply);
    }
});

// ============================================
// ADMIN BUTTON HANDLERS
// ============================================

// Show users
bot.action('admin_users', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    if (users.size === 0) {
        await ctx.reply('No users yet.');
        return;
    }
    
    let msg = `📊 USERS (${users.size})\n\n`;
    let i = 1;
    for (const [id, data] of users) {
        msg += `${i}. ${data.firstName} (@${data.username || 'no username'})\n`;
        msg += `   ID: ${id}\n`;
        msg += `   Joined: ${new Date(data.joined).toLocaleDateString()}\n\n`;
        i++;
    }
    
    await ctx.reply(msg);
});

// Test bot
bot.action('admin_test', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    await ctx.reply('✅ Bot is working perfectly!');
});

// Start announcement
bot.action('admin_announce_start', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    // Store that admin is in announcement mode
    ctx.session = ctx.session || {};
    ctx.session.announceMode = true;
    ctx.session.announceTargets = [];
    ctx.session.announceMessage = '';
    
    await ctx.reply(
        `📢 SEND ANNOUNCEMENT\n\n` +
        `Step 1/2: Send me the list of usernames.\n\n` +
        `Format:\n@username1\n@username2\n@username3\n\n` +
        `Or send "all" for all users.\n\n` +
        `Send /cancel to stop.`
    );
});

// Handle announcement input
bot.on('text', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    
    // Check if in announcement mode
    ctx.session = ctx.session || {};
    
    if (ctx.session.announceMode) {
        // Step 1: Getting usernames
        if (!ctx.session.announceTargets.length) {
            const text = ctx.message.text;
            
            if (text.toLowerCase() === 'all') {
                // Send to all users
                ctx.session.announceTargets = Array.from(users.keys());
                ctx.session.announceMode = false;
                
                await ctx.reply(
                    `📢 Step 2/2: Send me the announcement message.\n\n` +
                    `Target: ALL ${ctx.session.announceTargets.length} users\n\n` +
                    `Send /cancel to stop.`
                );
                return;
            }
            
            // Parse usernames from text
            const lines = text.split('\n');
            const usernames = [];
            for (const line of lines) {
                const match = line.match(/@(\w+)/);
                if (match) {
                    usernames.push(match[1]);
                }
            }
            
            if (usernames.length === 0) {
                await ctx.reply('❌ No valid usernames found. Try again or send "all".');
                return;
            }
            
            // Find user IDs
            const userIds = [];
            const notFound = [];
            
            for (const username of usernames) {
                let found = false;
                for (const [id, data] of users) {
                    if (data.username === username) {
                        userIds.push(id);
                        found = true;
                        break;
                    }
                }
                if (!found) notFound.push(`@${username}`);
            }
            
            if (userIds.length === 0) {
                await ctx.reply(`❌ No users found. Make sure they have started the bot.\n\nNot found: ${notFound.join(', ')}`);
                return;
            }
            
            ctx.session.announceTargets = userIds;
            ctx.session.announceMode = false;
            
            let reply = `📢 Step 2/2: Send me the announcement message.\n\n`;
            reply += `Target: ${userIds.length} users\n`;
            if (notFound.length) {
                reply += `\n⚠️ Not found: ${notFound.join(', ')}`;
            }
            reply += `\n\nSend /cancel to stop.`;
            
            await ctx.reply(reply);
            return;
        }
        
        // Step 2: Getting message
        if (ctx.session.announceTargets.length && !ctx.session.announceMessage) {
            ctx.session.announceMessage = ctx.message.text;
            
            const confirmKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback('✅ SEND NOW', 'admin_announce_send')],
                [Markup.button.callback('❌ CANCEL', 'admin_announce_cancel')]
            ]);
            
            await ctx.reply(
                `📢 ANNOUNCEMENT PREVIEW\n\n` +
                `Target: ${ctx.session.announceTargets.length} users\n\n` +
                `Message:\n━━━━━━━━━━━━━━━━━━━━━\n${ctx.session.announceMessage}\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `Click SEND NOW to send.`,
                { parse_mode: 'HTML', ...confirmKeyboard }
            );
        }
    }
});

// Send announcement
bot.action('admin_announce_send', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    ctx.session = ctx.session || {};
    const targets = ctx.session.announceTargets || [];
    const message = ctx.session.announceMessage || '';
    
    if (!targets.length || !message) {
        await ctx.reply('❌ No announcement to send.');
        ctx.session.announceMode = false;
        ctx.session.announceTargets = [];
        ctx.session.announceMessage = '';
        return;
    }
    
    await ctx.editMessageText(`📢 Sending to ${targets.length} users...`);
    
    let sent = 0;
    let failed = 0;
    
    for (const userId of targets) {
        try {
            await bot.telegram.sendMessage(userId, 
                `📢 <b>ANNOUNCEMENT</b>\n\n${message}`,
                { parse_mode: 'HTML' }
            );
            sent++;
        } catch (err) {
            failed++;
        }
        await new Promise(r => setTimeout(r, 50));
    }
    
    await ctx.reply(`✅ Done!\n\nSent: ${sent}\nFailed: ${failed}`);
    
    // Reset
    ctx.session.announceMode = false;
    ctx.session.announceTargets = [];
    ctx.session.announceMessage = '';
});

bot.action('admin_announce_cancel', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    ctx.session = ctx.session || {};
    ctx.session.announceMode = false;
    ctx.session.announceTargets = [];
    ctx.session.announceMessage = [];
    
    await ctx.editMessageText('❌ Announcement cancelled.');
});

// Cancel command
bot.command('cancel', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    
    ctx.session = ctx.session || {};
    ctx.session.announceMode = false;
    ctx.session.announceTargets = [];
    ctx.session.announceMessage = [];
    
    ctx.reply('❌ Operation cancelled.');
});

// Launch
bot.launch()
    .then(() => console.log('Bot running!'))
    .catch(err => console.error('Error:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

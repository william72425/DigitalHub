const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 1379973354; // Your Telegram ID

// In-memory storage (resets on redeploy - users will reappear when they /start again)
const users = new Map();

console.log('========================================');
console.log('🤖 Digital Hub Bot Running');
console.log(`👑 Admin ID: ${ADMIN_ID}`);
console.log('========================================');

const bot = new Telegraf(BOT_TOKEN);

// Track users when they start
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;
    
    if (!users.has(userId)) {
        users.set(userId, {
            username: username,
            firstName: firstName,
            joined: new Date().toISOString()
        });
        console.log(`✅ New user saved: ${userId} (@${username})`);
    }
    
    // Different message for admin vs normal users
    if (userId === ADMIN_ID) {
        const adminMenu = Markup.inlineKeyboard([
            [Markup.button.callback('👥 Show All Users', 'admin_users')],
            [Markup.button.callback('📢 Announcement', 'admin_announce')],
            [Markup.button.callback('🧪 Test Bot', 'admin_test')]
        ]);
        
        await ctx.reply(
            `🔧 <b>Admin Panel</b>\n\n` +
            `Welcome back, ${firstName}!\n` +
            `Total users in database: ${users.size}\n\n` +
            `Use the buttons below.`,
            { parse_mode: 'HTML', ...adminMenu }
        );
    } else {
        await ctx.reply(
            `🎉 <b>Welcome to Digital Hub Store!</b>\n\n` +
            `Hello ${firstName}!\n\n` +
            `Our store will be open soon.\n` +
            `Contact @will815 for inquiries.`,
            { parse_mode: 'HTML' }
        );
    }
});

// ============================================
// ADMIN BUTTON HANDLERS (Only admin can use)
// ============================================

// Show all users
bot.action('admin_users', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('⛔ Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    if (users.size === 0) {
        await ctx.reply('📊 No users in database yet.\n\nUsers appear when they send /start.');
        return;
    }
    
    let message = `👥 <b>USER LIST</b> (${users.size} total)\n\n`;
    let count = 1;
    
    for (const [userId, data] of users) {
        const username = data.username ? `@${data.username}` : 'No username';
        const joinedDate = new Date(data.joined).toLocaleString();
        message += `${count}. <b>${data.firstName}</b> (${username})\n`;
        message += `   🆔 ID: <code>${userId}</code>\n`;
        message += `   📅 Joined: ${joinedDate}\n\n`;
        count++;
        
        // Telegram message limit - split if too long
        if (message.length > 3000) {
            await ctx.reply(message, { parse_mode: 'HTML' });
            message = '';
        }
    }
    
    if (message) {
        await ctx.reply(message, { parse_mode: 'HTML' });
    }
});

// Test bot
bot.action('admin_test', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('⛔ Admin only');
        return;
    }
    await ctx.answerCbQuery();
    await ctx.reply('✅ Bot is working perfectly!\n\nSend /start to see menu.');
});

// Start announcement process
bot.action('admin_announce', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('⛔ Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    // Store session data
    ctx.session = ctx.session || {};
    ctx.session.announceStep = 'waiting_target';
    ctx.session.announceTargets = [];
    ctx.session.announceMessage = '';
    
    const targetKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📢 ALL USERS', 'announce_target_all')],
        [Markup.button.callback('✏️ SPECIFIC USERS', 'announce_target_specific')],
        [Markup.button.callback('❌ Cancel', 'announce_cancel')]
    ]);
    
    await ctx.reply(
        `📢 <b>Send Announcement</b>\n\n` +
        `Who should receive this announcement?\n\n` +
        `• <b>ALL USERS</b> - Everyone who started the bot (${users.size} users)\n` +
        `• <b>SPECIFIC USERS</b> - Enter usernames manually`,
        { parse_mode: 'HTML', ...targetKeyboard }
    );
});

// Target: All users
bot.action('announce_target_all', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('⛔ Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    ctx.session = ctx.session || {};
    ctx.session.announceTargets = Array.from(users.keys());
    ctx.session.announceStep = 'waiting_message';
    
    await ctx.editMessageText(
        `📢 <b>Send Announcement</b>\n\n` +
        `Target: <b>ALL ${ctx.session.announceTargets.length} USERS</b>\n\n` +
        `Now send me the announcement message.\n` +
        `You can send text or a photo with caption.\n\n` +
        `<i>Type /cancel to abort.</i>`,
        { parse_mode: 'HTML' }
    );
});

// Target: Specific users
bot.action('announce_target_specific', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('⛔ Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    ctx.session = ctx.session || {};
    ctx.session.announceStep = 'waiting_usernames';
    
    await ctx.editMessageText(
        `📢 <b>Send Announcement - Specific Users</b>\n\n` +
        `Send me the list of usernames, one per line:\n\n` +
        `<code>@username1</code>\n` +
        `<code>@username2</code>\n` +
        `<code>@username3</code>\n\n` +
        `<i>Type /cancel to abort.</i>`,
        { parse_mode: 'HTML' }
    );
});

// Handle text input for usernames
bot.on('text', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    if (ctx.message.text.startsWith('/')) return;
    
    ctx.session = ctx.session || {};
    
    // Handle username input
    if (ctx.session.announceStep === 'waiting_usernames') {
        const text = ctx.message.text;
        const lines = text.split('\n');
        const foundUsers = [];
        const notFound = [];
        
        for (const line of lines) {
            const match = line.match(/@(\w+)/);
            if (match) {
                const username = match[1];
                let found = false;
                
                for (const [userId, data] of users) {
                    if (data.username === username) {
                        foundUsers.push(userId);
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    notFound.push(`@${username}`);
                }
            }
        }
        
        if (foundUsers.length === 0) {
            await ctx.reply(
                `❌ No valid users found.\n\n` +
                `Make sure:\n` +
                `1. Users have started the bot with /start\n` +
                `2. Usernames are correct\n\n` +
                `Try again or send /cancel`
            );
            return;
        }
        
        ctx.session.announceTargets = foundUsers;
        ctx.session.announceStep = 'waiting_message';
        
        let reply = `📢 <b>Target: ${foundUsers.length} users</b>\n\n`;
        if (notFound.length > 0) {
            reply += `⚠️ Not found: ${notFound.join(', ')}\n\n`;
        }
        reply += `Now send me the announcement message.\n`;
        reply += `<i>Type /cancel to abort.</i>`;
        
        await ctx.reply(reply, { parse_mode: 'HTML' });
        return;
    }
    
    // Handle message input
    if (ctx.session.announceStep === 'waiting_message' && ctx.session.announceTargets.length > 0) {
        ctx.session.announceMessage = ctx.message.text;
        
        const confirmKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('✅ SEND NOW', 'announce_send')],
            [Markup.button.callback('❌ Cancel', 'announce_cancel')]
        ]);
        
        await ctx.reply(
            `📢 <b>Announcement Preview</b>\n\n` +
            `<b>Target:</b> ${ctx.session.announceTargets.length} users\n\n` +
            `<b>Message:</b>\n━━━━━━━━━━━━━━━━━━━━━\n${ctx.session.announceMessage}\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Click SEND NOW to broadcast.`,
            { parse_mode: 'HTML', ...confirmKeyboard }
        );
    }
});

// Handle photo for announcement
bot.on('photo', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    
    ctx.session = ctx.session || {};
    
    if (ctx.session.announceStep === 'waiting_message' && ctx.session.announceTargets.length > 0) {
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        ctx.session.announcePhoto = photo.file_id;
        ctx.session.announceMessage = ctx.message.caption || '';
        
        const confirmKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('✅ SEND NOW', 'announce_send')],
            [Markup.button.callback('❌ Cancel', 'announce_cancel')]
        ]);
        
        await ctx.reply(
            `📢 <b>Announcement Preview</b>\n\n` +
            `<b>Target:</b> ${ctx.session.announceTargets.length} users\n` +
            `<b>Media:</b> Photo attached\n` +
            `<b>Caption:</b> ${ctx.session.announceMessage || '(none)'}\n\n` +
            `Click SEND NOW to broadcast.`,
            { parse_mode: 'HTML', ...confirmKeyboard }
        );
    }
});

// Send announcement
bot.action('announce_send', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('⛔ Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    const targets = ctx.session?.announceTargets || [];
    const message = ctx.session?.announceMessage || '';
    const photo = ctx.session?.announcePhoto;
    
    if (targets.length === 0 || !message) {
        await ctx.reply('❌ No announcement to send. Start over with /start');
        return;
    }
    
    await ctx.editMessageText(`📢 <b>Sending to ${targets.length} users...</b>`, { parse_mode: 'HTML' });
    
    let sent = 0;
    let failed = 0;
    
    for (const userId of targets) {
        try {
            if (photo) {
                await bot.telegram.sendPhoto(userId, photo, {
                    caption: message,
                    parse_mode: 'HTML'
                });
            } else {
                await bot.telegram.sendMessage(userId, message, { parse_mode: 'HTML' });
            }
            sent++;
        } catch (err) {
            failed++;
            console.log(`Failed to send to ${userId}: ${err.message}`);
        }
        await new Promise(r => setTimeout(r, 50));
    }
    
    await ctx.reply(
        `<b>✅ Announcement Sent!</b>\n\n` +
        `📤 Sent: ${sent}\n` +
        `❌ Failed: ${failed}\n\n` +
        `Targeted: ${targets.length} users`,
        { parse_mode: 'HTML' }
    );
    
    // Reset session
    ctx.session.announceStep = null;
    ctx.session.announceTargets = [];
    ctx.session.announceMessage = '';
    ctx.session.announcePhoto = null;
});

// Cancel announcement
bot.action('announce_cancel', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('⛔ Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    ctx.session.announceStep = null;
    ctx.session.announceTargets = [];
    ctx.session.announceMessage = '';
    ctx.session.announcePhoto = null;
    
    await ctx.editMessageText('❌ Announcement cancelled.');
});

// Cancel command
bot.command('cancel', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    
    ctx.session = ctx.session || {};
    ctx.session.announceStep = null;
    ctx.session.announceTargets = [];
    ctx.session.announceMessage = '';
    ctx.session.announcePhoto = null;
    
    await ctx.reply('❌ Operation cancelled.');
});

// Test command for admin
bot.command('test', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        ctx.reply('❌ Not available');
        return;
    }
    ctx.reply('✅ Bot is working!');
});

// Launch
bot.launch()
    .then(() => {
        console.log('========================================');
        console.log('✅ BOT RUNNING!');
        console.log('========================================');
    })
    .catch((err) => {
        console.error('❌ Error:', err);
        process.exit(1);
    });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

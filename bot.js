const { Telegraf, Markup } = require('telegraf');

// ============================================
// CONFIGURATION
// ============================================
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 1379973354; // Your Telegram User ID

// ============================================
// DATA STORAGE
// ============================================
const users = new Map(); // userId -> { username, firstName, startedAt }
const pendingOrders = new Map();
const buyers = new Set();
let orderCounter = 1000;

// Announcement state
let awaitingAnnouncementText = false;
let awaitingAnnouncementPhoto = false;
let announcementText = '';
let announcementPhoto = null;
let targetUsernames = [];

console.log('========================================');
console.log('🤖 Digital Hub Bot Starting...');
console.log('========================================');
console.log(`👑 Admin ID: ${ADMIN_ID}`);
console.log('========================================');

const bot = new Telegraf(BOT_TOKEN);

// ============================================
// KEYBOARDS
// ============================================
const mainMenu = Markup.inlineKeyboard([
    [Markup.button.callback('🛍️ Products', 'menu_products')],
    [Markup.button.callback('🔥 Discounts', 'menu_discounts')],
    [Markup.button.callback('📁 Categories', 'menu_categories')],
    [Markup.button.callback('🎫 Promo Code', 'menu_promo')],
    [Markup.button.callback('📞 Contact', 'menu_contact')]
]);

const productsKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🤖 ChatGPT Plus', 'buy_1')],
    [Markup.button.callback('🎨 Canva Pro', 'buy_2')],
    [Markup.button.callback('🔒 Express VPN', 'buy_3')],
    [Markup.button.callback('🎬 Adobe Premiere Pro', 'buy_4')],
    [Markup.button.callback('📺 YouTube Premium', 'buy_5')],
    [Markup.button.callback('◀️ Back to Main', 'back_main')]
]);

// ============================================
// HELPER FUNCTIONS
// ============================================
function saveUser(userId, username, firstName) {
    if (!users.has(userId)) {
        users.set(userId, {
            username: username || null,
            firstName: firstName || 'Unknown',
            startedAt: new Date().toISOString()
        });
        console.log(`✅ New user saved: ${userId} (@${username})`);
    }
}

function getUserIdByUsername(username) {
    const cleanUsername = username.replace('@', '').toLowerCase();
    for (const [userId, data] of users) {
        if (data.username && data.username.toLowerCase() === cleanUsername) {
            return userId;
        }
    }
    return null;
}

async function sendOrderToAdmin(photoFileId, orderId, username, userId, productName, price) {
    const adminKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Confirm Order', `confirm_${orderId}`)],
        [Markup.button.callback('❌ Cancel Order', `cancel_${orderId}`)]
    ]);
    
    const caption = 
        `<b>🆕 NEW ORDER #${orderId}</b>\n\n` +
        `<b>Customer:</b> @${username || 'N/A'} (${userId})\n` +
        `<b>Product:</b> ${productName}\n` +
        `<b>Amount:</b> ${price.toLocaleString()} MMK\n` +
        `<b>Date:</b> ${new Date().toLocaleString()}\n\n` +
        `<i>Payment proof attached.</i>`;
    
    await bot.telegram.sendPhoto(ADMIN_ID, photoFileId, {
        caption: caption,
        parse_mode: 'HTML',
        ...adminKeyboard
    });
}

async function sendServiceInfoToUser(userId, orderId, productName, serviceDetails) {
    const message = 
        `<b>✅ YOUR ORDER IS READY!</b>\n\n` +
        `<b>Order ID:</b> #${orderId}\n` +
        `<b>Product:</b> ${productName}\n\n` +
        `<b>━━━━━━━━━━━━━━━━━━━━━</b>\n` +
        `<b>🔑 SERVICE INFORMATION</b>\n` +
        `<b>━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
        `${serviceDetails}\n\n` +
        `<b>━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
        `<i>Thank you for shopping with Digital Hub!</i>\n\n` +
        `<code>Need help? Contact @will815</code>`;
    
    await bot.telegram.sendMessage(userId, message, { parse_mode: 'HTML' });
}

// ============================================
// START COMMAND
// ============================================
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;
    
    saveUser(userId, username, firstName);
    
    await ctx.reply(
        `🎉 <b>Welcome to Digital Hub Store!</b>\n\n` +
        `👋 Hello <b>${firstName}</b>!\n\n` +
        `We offer premium digital products at the best prices.\n\n` +
        `👇 <b>Please select an option below:</b>`,
        { parse_mode: 'HTML', ...mainMenu }
    );
});

// ============================================
// MENU HANDLERS
// ============================================
bot.action('menu_products', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '<b>🛍️ OUR PRODUCTS</b>\n\nPlease select a product:',
        { parse_mode: 'HTML', ...productsKeyboard }
    );
});

bot.action('menu_discounts', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '<b>🔥 CURRENT DISCOUNTS</b>\n\n' +
        '• ChatGPT Plus: 64,800 MMK (-46%)\n' +
        '• Canva Pro: 6,000 MMK (-25%)\n' +
        '• Express VPN: 3,500 MMK (-30%)\n' +
        '• Adobe Premiere Pro: 9,000 MMK (-40%)\n' +
        '• YouTube Premium: 4,800 MMK (-20%)',
        { parse_mode: 'HTML', ...productsKeyboard }
    );
});

bot.action('menu_categories', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '<b>📁 CATEGORIES</b>\n\n• AI Tools\n• Photo Editing\n• Video Editing\n• VPNs\n• Others',
        { parse_mode: 'HTML', ...productsKeyboard }
    );
});

bot.action('menu_promo', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '<b>🎫 PROMO CODE</b>\n\nType: <code>/apply YOUR_CODE</code>\n\nExample: <code>/apply HUBBY10</code>',
        { parse_mode: 'HTML' }
    );
});

bot.action('menu_contact', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '<b>📞 CONTACT</b>\n\n📱 Telegram: @will815\n\n<b>💳 PAYMENT</b>\n• KBZ: 0987654321\n• WavePay: 09798268154',
        { parse_mode: 'HTML' }
    );
});

bot.action('back_main', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('<b>🏠 MAIN MENU</b>', { parse_mode: 'HTML', ...mainMenu });
});

// ============================================
// PURCHASE HANDLERS
// ============================================
bot.action(/buy_(\d+)/, async (ctx) => {
    const productId = parseInt(ctx.match[1]);
    await ctx.answerCbQuery();
    
    let productName, price, discount;
    switch(productId) {
        case 1: productName = 'ChatGPT Plus'; price = 120000; discount = 46; break;
        case 2: productName = 'Canva Pro'; price = 8000; discount = 25; break;
        case 3: productName = 'Express VPN'; price = 5000; discount = 30; break;
        case 4: productName = 'Adobe Premiere Pro'; price = 15000; discount = 40; break;
        case 5: productName = 'YouTube Premium'; price = 6000; discount = 20; break;
        default: return;
    }
    
    const finalPrice = price - (price * discount / 100);
    const orderId = ++orderCounter;
    
    pendingOrders.set(orderId, {
        userId: ctx.from.id,
        username: ctx.from.username,
        productName: productName,
        price: finalPrice,
        status: 'pending'
    });
    
    const paymentKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ I HAVE PAID', 'payment_done')],
        [Markup.button.callback('◀️ Back', 'menu_products')]
    ]);
    
    await ctx.editMessageText(
        `<b>🛒 ORDER SUMMARY</b>\n\n` +
        `<b>Product:</b> ${productName}\n` +
        `<b>Price:</b> ${finalPrice.toLocaleString()} MMK\n` +
        `<b>Order ID:</b> #${orderId}\n\n` +
        `<b>💳 PAYMENT:</b>\n• KBZ: 0987654321\n• WavePay: 09798268154\n\n` +
        `<i>After payment, click "I HAVE PAID" and send your payment proof.</i>`,
        { parse_mode: 'HTML', ...paymentKeyboard }
    );
});

bot.action('payment_done', async (ctx) => {
    await ctx.answerCbQuery();
    
    let currentOrder = null;
    let currentOrderId = null;
    for (const [orderId, order] of pendingOrders) {
        if (order.userId === ctx.from.id && order.status === 'pending') {
            currentOrder = order;
            currentOrderId = orderId;
            break;
        }
    }
    
    if (!currentOrder) {
        await ctx.reply('❌ No pending order found. Please start over: /start');
        return;
    }
    
    pendingOrders.set(currentOrderId, { ...currentOrder, status: 'waiting_proof' });
    
    await ctx.reply(
        `<b>📸 SEND PAYMENT PROOF</b>\n\n` +
        `<b>Order ID:</b> #${currentOrderId}\n` +
        `<b>Amount:</b> ${currentOrder.price.toLocaleString()} MMK\n\n` +
        `Please send a screenshot of your payment.`,
        { parse_mode: 'HTML' }
    );
});

// ============================================
// PAYMENT PROOF HANDLER
// ============================================
bot.on('photo', async (ctx) => {
    let currentOrder = null;
    let currentOrderId = null;
    for (const [orderId, order] of pendingOrders) {
        if (order.userId === ctx.from.id && order.status === 'waiting_proof') {
            currentOrder = order;
            currentOrderId = orderId;
            break;
        }
    }
    
    if (!currentOrder) return;
    
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    
    pendingOrders.set(currentOrderId, { ...currentOrder, status: 'proof_submitted' });
    
    await sendOrderToAdmin(
        photo.file_id,
        currentOrderId,
        currentOrder.username,
        ctx.from.id,
        currentOrder.productName,
        currentOrder.price
    );
    
    await ctx.reply(
        `<b>✅ PAYMENT PROOF RECEIVED!</b>\n\n` +
        `Order ID: #${currentOrderId}\n\n` +
        `⏳ Admin will review and deliver your product soon.`,
        { parse_mode: 'HTML' }
    );
});

// ============================================
// ADMIN CONFIRM HANDLER
// ============================================
let activeOrderId = null;
let activeUserId = null;
let activeProductName = null;
let awaitingServiceInfo = false;

bot.action(/confirm_(\d+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    
    const orderId = parseInt(ctx.match[1]);
    await ctx.answerCbQuery();
    
    const order = pendingOrders.get(orderId);
    if (!order) {
        await ctx.editMessageCaption('❌ Order not found!');
        return;
    }
    
    activeOrderId = orderId;
    activeUserId = order.userId;
    activeProductName = order.productName;
    awaitingServiceInfo = true;
    
    await ctx.editMessageCaption(
        `<b>✅ ORDER #${orderId} - PENDING SERVICE INFO</b>\n\n` +
        `<b>Customer:</b> @${order.username || order.userId}\n` +
        `<b>Product:</b> ${order.productName}\n\n` +
        `Please type or paste the service information now.`,
        { parse_mode: 'HTML' }
    );
});

bot.action(/cancel_(\d+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    
    const orderId = parseInt(ctx.match[1]);
    await ctx.answerCbQuery();
    
    const order = pendingOrders.get(orderId);
    if (order) {
        pendingOrders.set(orderId, { ...order, status: 'cancelled' });
        await bot.telegram.sendMessage(
            order.userId,
            `<b>❌ ORDER #${orderId} - CANCELLED</b>\n\nPlease contact support @will815.`,
            { parse_mode: 'HTML' }
        );
    }
    
    await ctx.editMessageCaption(`<b>❌ ORDER #${orderId} - CANCELLED</b>`, { parse_mode: 'HTML' });
});

// ============================================
// ADMIN SERVICE INFO HANDLER
// ============================================
bot.on('text', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    if (!awaitingServiceInfo) return;
    if (ctx.message.text.startsWith('/')) return;
    
    const serviceDetails = ctx.message.text;
    
    await sendServiceInfoToUser(activeUserId, activeOrderId, activeProductName, serviceDetails);
    
    buyers.add(activeUserId);
    
    const order = pendingOrders.get(activeOrderId);
    if (order) {
        pendingOrders.set(activeOrderId, { ...order, status: 'completed' });
    }
    
    awaitingServiceInfo = false;
    
    await ctx.reply(
        `<b>✅ ORDER #${activeOrderId} - COMPLETED!</b>\n\n` +
        `Service information sent to user.`,
        { parse_mode: 'HTML' }
    );
    
    activeOrderId = null;
    activeUserId = null;
    activeProductName = null;
});

// ============================================
// ADMIN COMMAND: /users - Show all users
// ============================================
bot.command('users', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.reply('⛔ Admin only');
        return;
    }
    
    if (users.size === 0) {
        await ctx.reply('📊 No users found.');
        return;
    }
    
    let userList = '<b>📊 USER LIST</b>\n\n';
    let index = 1;
    
    for (const [userId, data] of users) {
        const username = data.username ? `@${data.username}` : 'No username';
        const firstName = data.firstName;
        userList += `${index}. ${firstName} (${username})\n   ID: ${userId}\n   Joined: ${new Date(data.startedAt).toLocaleDateString()}\n\n`;
        index++;
        
        // Split if message is too long
        if (index % 20 === 0) {
            await ctx.reply(userList, { parse_mode: 'HTML' });
            userList = '';
        }
    }
    
    if (userList) {
        await ctx.reply(userList, { parse_mode: 'HTML' });
    }
    
    await ctx.reply(`📊 Total users: ${users.size}`, { parse_mode: 'HTML' });
});

// ============================================
// ADMIN COMMAND: /announce - Send announcement to specific users
// ============================================
bot.command('announce', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.reply('⛔ Admin only');
        return;
    }
    
    awaitingAnnouncementText = true;
    announcementText = '';
    announcementPhoto = null;
    targetUsernames = [];
    
    await ctx.reply(
        '<b>📢 ANNOUNCEMENT</b>\n\n' +
        'Step 1/3: Send me the announcement text.\n\n' +
        '<i>Send /cancel to abort.</i>',
        { parse_mode: 'HTML' }
    );
});

// Handle announcement text
bot.on('text', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    
    // Cancel command
    if (ctx.message.text === '/cancel') {
        awaitingAnnouncementText = false;
        awaitingAnnouncementPhoto = false;
        announcementText = '';
        announcementPhoto = null;
        targetUsernames = [];
        await ctx.reply('❌ Announcement cancelled.');
        return;
    }
    
    // Step 1: Getting text
    if (awaitingAnnouncementText) {
        announcementText = ctx.message.text;
        awaitingAnnouncementText = false;
        awaitingAnnouncementPhoto = true;
        
        await ctx.reply(
            '<b>📢 ANNOUNCEMENT</b>\n\n' +
            'Step 2/3: Send me a photo (optional) or type /skip to continue without photo.\n\n' +
            '<i>Send /cancel to abort.</i>',
            { parse_mode: 'HTML' }
        );
        return;
    }
    
    // Step 3: Getting usernames (after photo or skip)
    if (targetUsernames.length === 0 && !awaitingAnnouncementText && !awaitingAnnouncementPhoto) {
        const input = ctx.message.text;
        const lines = input.split('\n');
        const usernames = [];
        
        for (const line of lines) {
            const match = line.match(/@(\w+)/);
            if (match) {
                usernames.push(match[1]);
            }
        }
        
        if (usernames.length === 0) {
            await ctx.reply(
                '❌ No valid usernames found.\n\n' +
                'Please send usernames like:\n' +
                '@user1\n@user2\n@user3\n\n' +
                'Send /cancel to abort.'
            );
            return;
        }
        
        targetUsernames = usernames;
        
        // Confirm and send
        const confirmKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('✅ SEND NOW', 'announce_send')],
            [Markup.button.callback('❌ CANCEL', 'announce_cancel')]
        ]);
        
        let preview = `<b>📢 ANNOUNCEMENT PREVIEW</b>\n\n`;
        preview += `<b>Target:</b> ${targetUsernames.length} users\n`;
        preview += `<b>Usernames:</b>\n`;
        for (const username of targetUsernames.slice(0, 10)) {
            preview += `  @${username}\n`;
        }
        if (targetUsernames.length > 10) {
            preview += `  ... and ${targetUsernames.length - 10} more\n`;
        }
        preview += `\n<b>Message:</b>\n━━━━━━━━━━━━━━━━━━━━━\n${announcementText}\n━━━━━━━━━━━━━━━━━━━━━\n`;
        if (announcementPhoto) {
            preview += `\n<i>📸 With photo attached.</i>`;
        }
        
        if (announcementPhoto) {
            await bot.telegram.sendPhoto(ADMIN_ID, announcementPhoto, {
                caption: preview,
                parse_mode: 'HTML',
                ...confirmKeyboard
            });
        } else {
            await ctx.reply(preview, { parse_mode: 'HTML', ...confirmKeyboard });
        }
    }
});

// Handle announcement photo
bot.on('photo', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    if (!awaitingAnnouncementPhoto) return;
    
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    announcementPhoto = photo.file_id;
    awaitingAnnouncementPhoto = false;
    
    await ctx.reply(
        '<b>📢 ANNOUNCEMENT</b>\n\n' +
        'Step 3/3: Send the list of usernames to receive this announcement.\n\n' +
        'Format:\n' +
        '@username1\n@username2\n@username3\n\n' +
        '<i>Send /cancel to abort.</i>',
        { parse_mode: 'HTML' }
    );
});

// Handle skip command
bot.command('skip', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    if (!awaitingAnnouncementPhoto) return;
    
    awaitingAnnouncementPhoto = false;
    announcementPhoto = null;
    
    await ctx.reply(
        '<b>📢 ANNOUNCEMENT</b>\n\n' +
        'Step 3/3: Send the list of usernames to receive this announcement.\n\n' +
        'Format:\n' +
        '@username1\n@username2\n@username3\n\n' +
        '<i>Send /cancel to abort.</i>',
        { parse_mode: 'HTML' }
    );
});

// Send announcement
bot.action('announce_send', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    let success = 0;
    let failed = 0;
    const failedUsers = [];
    
    for (const username of targetUsernames) {
        const userId = getUserIdByUsername(username);
        
        if (!userId) {
            failed++;
            failedUsers.push(`@${username} (not found)`);
            continue;
        }
        
        try {
            if (announcementPhoto) {
                await bot.telegram.sendPhoto(userId, announcementPhoto, {
                    caption: announcementText,
                    parse_mode: 'HTML'
                });
            } else {
                await bot.telegram.sendMessage(userId, announcementText, { parse_mode: 'HTML' });
            }
            success++;
        } catch (err) {
            failed++;
            failedUsers.push(`@${username} (blocked or never started)`);
        }
        
        await new Promise(r => setTimeout(r, 100));
    }
    
    let result = `<b>✅ ANNOUNCEMENT SENT</b>\n\n`;
    result += `<b>Sent:</b> ${success}\n`;
    result += `<b>Failed:</b> ${failed}\n`;
    
    if (failedUsers.length > 0) {
        result += `\n<b>Failed users:</b>\n`;
        for (const user of failedUsers.slice(0, 10)) {
            result += `  ${user}\n`;
        }
    }
    
    await ctx.editMessageCaption(result, { parse_mode: 'HTML' });
    
    // Reset
    awaitingAnnouncementText = false;
    awaitingAnnouncementPhoto = false;
    announcementText = '';
    announcementPhoto = null;
    targetUsernames = [];
});

bot.action('announce_cancel', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    awaitingAnnouncementText = false;
    awaitingAnnouncementPhoto = false;
    announcementText = '';
    announcementPhoto = null;
    targetUsernames = [];
    
    await ctx.editMessageCaption('❌ Announcement cancelled.', { parse_mode: 'HTML' });
});

// ============================================
// PROMO CODE COMMAND
// ============================================
bot.command('apply', (ctx) => {
    const code = ctx.message.text.split(' ')[1];
    if (!code) {
        ctx.reply('❌ Usage: /apply CODE');
        return;
    }
    
    const validCodes = ['HUBBY10', 'HUBBY20', 'WELCOME', 'FIRSTBUY'];
    if (validCodes.includes(code.toUpperCase())) {
        ctx.reply(`✅ Promo code ${code.toUpperCase()} applied!`, { parse_mode: 'HTML', ...mainMenu });
    } else {
        ctx.reply(`❌ Invalid promo code: ${code}`);
    }
});

// ============================================
// TEST COMMAND
// ============================================
bot.command('test', (ctx) => {
    ctx.reply('✅ Bot is working!');
});

// ============================================
// LAUNCH BOT
// ============================================
bot.launch()
    .then(() => {
        console.log('========================================');
        console.log('✅ BOT RUNNING SUCCESSFULLY!');
        console.log('========================================');
        console.log(`🤖 Bot: @digitalhub_official_bot`);
        console.log(`👑 Admin ID: ${ADMIN_ID}`);
        console.log(`📊 Tracking users...`);
        console.log('========================================');
    })
    .catch((err) => {
        console.error('❌ Launch error:', err);
        process.exit(1);
    });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

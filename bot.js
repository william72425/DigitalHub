const { Telegraf, Markup } = require('telegraf');

// ============================================
// CONFIGURATION
// ============================================
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 1379973354; // Your Telegram User ID
const WEBHOOK_URL = process.env.RAILWAY_PUBLIC_DOMAIN 
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/webhook`
    : null;

// ============================================
// DATA STORAGE
// ============================================
const pendingOrders = new Map();
const users = new Set();
const buyers = new Set();
let orderCounter = 1000;

// Broadcast state
let broadcastTarget = null;
let broadcastMessage = null;
let broadcastPhoto = null;
let awaitingBroadcast = false;

// Service info state
let activeOrderId = null;
let activeUserId = null;
let activeProductName = null;
let awaitingServiceInfo = false;

console.log('========================================');
console.log('🤖 Digital Hub Bot Starting...');
console.log('========================================');
console.log(`👑 Admin ID: ${ADMIN_ID}`);
console.log(`🌐 Webhook URL: ${WEBHOOK_URL || 'Not set'}`);
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
    const userName = ctx.from.first_name || ctx.from.username || 'User';
    
    users.add(userId);
    console.log(`✅ New user: ${userId} (@${ctx.from.username}) - Total: ${users.size}`);
    
    await ctx.reply(
        `🎉 <b>Welcome to Digital Hub Store!</b>\n\n` +
        `👋 Hello <b>${userName}</b>!\n\n` +
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
        `<b>━━━━━━━━━━━━━━━━━━━━━</b>\n` +
        `Please type or paste the service information now.\n` +
        `(login, password, link, etc.)\n` +
        `<b>━━━━━━━━━━━━━━━━━━━━━</b>`,
        { parse_mode: 'HTML' }
    );
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
        `Service information sent to user.\n` +
        `Status: Delivered ✅`,
        { parse_mode: 'HTML' }
    );
    
    activeOrderId = null;
    activeUserId = null;
    activeProductName = null;
});

// ============================================
// ADMIN CANCEL HANDLER
// ============================================
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
// ADMIN STATS COMMAND
// ============================================
bot.command('stats', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        ctx.reply('⛔ Admin only');
        return;
    }
    
    const completedOrders = Array.from(pendingOrders.values()).filter(o => o.status === 'completed').length;
    
    ctx.reply(
        `<b>📊 BOT STATISTICS</b>\n\n` +
        `<b>Total Users:</b> ${users.size}\n` +
        `<b>Total Buyers:</b> ${buyers.size}\n` +
        `<b>Total Orders:</b> ${pendingOrders.size}\n` +
        `<b>Completed Orders:</b> ${completedOrders}\n` +
        `<b>Pending Orders:</b> ${pendingOrders.size - completedOrders}\n\n` +
        `<i>Updated: ${new Date().toLocaleString()}</i>`,
        { parse_mode: 'HTML' }
    );
});

// ============================================
// ADMIN BROADCAST COMMAND
// ============================================
bot.command('broadcast', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        ctx.reply('⛔ Admin only');
        return;
    }
    
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📢 All Users', 'broadcast_all')],
        [Markup.button.callback('✅ Buyers Only', 'broadcast_buyers')],
        [Markup.button.callback('❌ Cancel', 'broadcast_cancel')]
    ]);
    
    ctx.reply(
        `<b>📢 BROADCAST</b>\n\nSelect target audience:`,
        { parse_mode: 'HTML', ...keyboard }
    );
});

bot.action('broadcast_all', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    broadcastTarget = 'all';
    awaitingBroadcast = true;
    
    await ctx.editMessageText(
        `<b>📢 BROADCAST TO ALL USERS</b>\n\n` +
        `Target: ${users.size} users\n\n` +
        `Send me the message (text or photo with caption):`,
        { parse_mode: 'HTML' }
    );
});

bot.action('broadcast_buyers', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    broadcastTarget = 'buyers';
    awaitingBroadcast = true;
    
    await ctx.editMessageText(
        `<b>📢 BROADCAST TO BUYERS</b>\n\n` +
        `Target: ${buyers.size} users\n\n` +
        `Send me the message (text or photo with caption):`,
        { parse_mode: 'HTML' }
    );
});

bot.action('broadcast_cancel', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    broadcastTarget = null;
    awaitingBroadcast = false;
    
    await ctx.editMessageText(`<b>❌ Broadcast cancelled</b>`, { parse_mode: 'HTML' });
});

bot.on('text', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    if (!awaitingBroadcast) return;
    if (ctx.message.text.startsWith('/')) return;
    
    broadcastMessage = ctx.message.text;
    
    const confirmKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ SEND NOW', 'broadcast_send')],
        [Markup.button.callback('❌ Cancel', 'broadcast_cancel_confirm')]
    ]);
    
    await ctx.reply(
        `<b>📢 BROADCAST PREVIEW</b>\n\n` +
        `<b>Target:</b> ${broadcastTarget === 'all' ? `All Users (${users.size})` : `Buyers (${buyers.size})`}\n\n` +
        `<b>Message:</b>\n━━━━━━━━━━━━━━━━━━━━━\n${broadcastMessage}\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Click SEND NOW to broadcast.`,
        { parse_mode: 'HTML', ...confirmKeyboard }
    );
});

bot.on('photo', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    if (!awaitingBroadcast) return;
    
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    broadcastPhoto = photo.file_id;
    broadcastMessage = ctx.message.caption || '';
    
    const confirmKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ SEND NOW', 'broadcast_send')],
        [Markup.button.callback('❌ Cancel', 'broadcast_cancel_confirm')]
    ]);
    
    await ctx.reply(
        `<b>📢 BROADCAST PREVIEW</b>\n\n` +
        `<b>Target:</b> ${broadcastTarget === 'all' ? `All Users (${users.size})` : `Buyers (${buyers.size})`}\n\n` +
        `<b>Media:</b> Photo\n` +
        `<b>Caption:</b> ${broadcastMessage || '(none)'}\n\n` +
        `Click SEND NOW to broadcast.`,
        { parse_mode: 'HTML', ...confirmKeyboard }
    );
});

bot.action('broadcast_send', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    const targetUsers = broadcastTarget === 'all' ? users : buyers;
    let success = 0;
    let fail = 0;
    
    await ctx.editMessageText(
        `<b>📢 BROADCASTING...</b>\n\nSending to ${targetUsers.size} users...`,
        { parse_mode: 'HTML' }
    );
    
    for (const userId of targetUsers) {
        try {
            if (broadcastPhoto) {
                await bot.telegram.sendPhoto(userId, broadcastPhoto, {
                    caption: broadcastMessage,
                    parse_mode: 'HTML'
                });
            } else {
                await bot.telegram.sendMessage(userId, broadcastMessage, { parse_mode: 'HTML' });
            }
            success++;
        } catch (err) {
            fail++;
        }
        await new Promise(r => setTimeout(r, 50));
    }
    
    await ctx.reply(
        `<b>✅ BROADCAST COMPLETED</b>\n\n` +
        `<b>Sent:</b> ${success}\n` +
        `<b>Failed:</b> ${fail}`,
        { parse_mode: 'HTML' }
    );
    
    broadcastTarget = null;
    awaitingBroadcast = false;
    broadcastMessage = null;
    broadcastPhoto = null;
});

bot.action('broadcast_cancel_confirm', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    broadcastTarget = null;
    awaitingBroadcast = false;
    
    await ctx.editMessageText(`<b>❌ Broadcast cancelled</b>`, { parse_mode: 'HTML' });
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
// CANCEL BROADCAST COMMAND
// ============================================
bot.command('cancel', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    if (awaitingBroadcast) {
        awaitingBroadcast = false;
        broadcastTarget = null;
        ctx.reply('❌ Broadcast cancelled');
    }
});

// ============================================
// LAUNCH BOT (WITH ERROR HANDLING)
// ============================================
async function startBot() {
    try {
        // Try webhook mode first if URL is available
        if (WEBHOOK_URL) {
            await bot.telegram.deleteWebhook();
            await bot.telegram.setWebhook(WEBHOOK_URL);
            console.log(`✅ Webhook set to: ${WEBHOOK_URL}`);
        }
        
        // Start bot
        await bot.launch();
        
        console.log('========================================');
        console.log('✅ BOT RUNNING SUCCESSFULLY!');
        console.log('========================================');
        
    } catch (err) {
        console.error('❌ Launch error:', err.message);
        
        // Fallback to polling without webhook
        console.log('🔄 Retrying with polling mode...');
        try {
            await bot.telegram.deleteWebhook();
            await bot.launch();
            console.log('✅ Bot running in polling mode');
        } catch (retryErr) {
            console.error('❌ Both modes failed:', retryErr.message);
            process.exit(1);
        }
    }
}

startBot();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

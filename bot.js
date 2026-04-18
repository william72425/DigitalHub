const { Telegraf, Markup } = require('telegraf');

// ============================================
// CONFIGURATION
// ============================================
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 1379973354; // Replace with your Telegram User ID

// ============================================
// DATA STORAGE (in-memory, resets on restart)
// ============================================
const pendingOrders = new Map();     // orderId -> order details
const users = new Set();             // All users who started the bot
const buyers = new Set();            // Users who completed a purchase
let orderCounter = 1000;

// Broadcast state
let broadcastTarget = null;   // 'all' or 'buyers'
let broadcastMessage = null;
let broadcastPhoto = null;
let awaitingBroadcast = false;

// Service info awaiting state
const awaitingServiceInfo = new Map(); // adminChatId -> { orderId, userId }

// ============================================
// HELPER FUNCTIONS
// ============================================

// Send order notification to admin
async function sendOrderToAdmin(photoFileId, orderId, username, userId, productName, price) {
    const adminKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Confirm Order', `confirm_${orderId}`)],
        [Markup.button.callback('❌ Cancel Order', `cancel_${orderId}`)]
    ]);
    
    const caption = 
        `<b>🆕 NEW ORDER #${orderId}</b>\n\n` +
        `<b>👤 Customer:</b> @${username || 'N/A'} (${userId})\n` +
        `<b>🛍️ Product:</b> ${productName}\n` +
        `<b>💰 Amount:</b> ${price.toLocaleString()} MMK\n` +
        `<b>📅 Date:</b> ${new Date().toLocaleString()}\n\n` +
        `<i>📸 Payment proof attached below.</i>\n\n` +
        `<b>👇 Click Confirm after sending service info</b>`;
    
    await bot.telegram.sendPhoto(ADMIN_ID, photoFileId, {
        caption: caption,
        parse_mode: 'HTML',
        ...adminKeyboard
    });
}

// Send service information to customer
async function sendServiceInfoToUser(userId, orderId, productName, serviceDetails) {
    const message = 
        `<b>✅ YOUR ORDER IS READY! 🎉</b>\n\n` +
        `<b>Order ID:</b> #${orderId}\n` +
        `<b>Product:</b> ${productName}\n\n` +
        `<b>━━━━━━━━━━━━━━━━━━━━━</b>\n` +
        `<b>🔑 SERVICE INFORMATION</b>\n` +
        `<b>━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
        `${serviceDetails}\n\n` +
        `<b>━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
        `<i>📌 Please save this information.</i>\n` +
        `<i>🙏 Thank you for shopping with Digital Hub!</i>\n\n` +
        `<code>Need help? Contact @will815</code>`;
    
    await bot.telegram.sendMessage(userId, message, { parse_mode: 'HTML' });
}

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
// BOT INITIALIZATION
// ============================================
console.log('========================================');
console.log('🤖 Digital Hub Bot Starting...');
console.log('========================================');

if (!BOT_TOKEN) {
    console.error('❌ ERROR: BOT_TOKEN not set');
    process.exit(1);
}

console.log('✅ Token validated');
console.log(`👑 Admin ID: ${ADMIN_ID}`);
console.log('========================================');

const bot = new Telegraf(BOT_TOKEN);

// ============================================
// START COMMAND
// ============================================
bot.start((ctx) => {
    const userId = ctx.from.id;
    const userName = ctx.from.first_name || ctx.from.username || 'User';
    
    // Track user
    users.add(userId);
    console.log(`✅ New user: ${userId} (@${ctx.from.username}) - Total users: ${users.size}`);
    
    ctx.reply(
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
        '<b>🛍️ OUR PRODUCTS</b>\n\nPlease select a product from below:',
        { parse_mode: 'HTML', ...productsKeyboard }
    );
});

bot.action('menu_discounts', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '<b>🔥 CURRENT DISCOUNTS</b>\n\n' +
        '• <b>ChatGPT Plus</b>: 120,000 → 64,800 MMK (-46%)\n' +
        '• <b>Canva Pro</b>: 8,000 → 6,000 MMK (-25%)\n' +
        '• <b>Express VPN</b>: 5,000 → 3,500 MMK (-30%)\n' +
        '• <b>Adobe Premiere Pro</b>: 15,000 → 9,000 MMK (-40%)\n' +
        '• <b>YouTube Premium</b>: 6,000 → 4,800 MMK (-20%)\n\n' +
        'Click <b>Products</b> to purchase.',
        { parse_mode: 'HTML', ...productsKeyboard }
    );
});

bot.action('menu_categories', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '<b>📁 CATEGORIES</b>\n\n' +
        '• 🤖 AI Tools\n• 📸 Photo Editing\n• 🎬 Video Editing\n• 🔒 VPNs\n• 📺 Others\n\n' +
        'Click <b>Products</b> to view all.',
        { parse_mode: 'HTML', ...productsKeyboard }
    );
});

bot.action('menu_promo', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '<b>🎫 PROMO CODE</b>\n\n' +
        'If you have a promo code, please type:\n\n' +
        '<code>/apply YOUR_CODE</code>\n\n' +
        'Example: <code>/apply HUBBY10</code>\n\n' +
        '✅ Get discount on your first purchase!',
        { parse_mode: 'HTML' }
    );
});

bot.action('menu_contact', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '<b>📞 CONTACT & SUPPORT</b>\n\n' +
        '📱 <b>Telegram Support:</b> @will815\n\n' +
        '<b>💳 PAYMENT METHODS</b>\n' +
        '• KBZ Bank: 0987654321 (William)\n' +
        '• WavePay: 09798268154\n\n' +
        '<i>After payment, click Products to place your order.</i>',
        { parse_mode: 'HTML' }
    );
});

bot.action('back_main', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '<b>🏠 MAIN MENU</b>\n\nPlease select an option below:',
        { parse_mode: 'HTML', ...mainMenu }
    );
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
        [Markup.button.callback('◀️ Back to Products', 'menu_products')]
    ]);
    
    await ctx.editMessageText(
        `<b>🛒 ORDER SUMMARY</b>\n\n` +
        `<b>Product:</b> ${productName}\n` +
        `<b>Duration:</b> 1 month\n` +
        `<b>Original Price:</b> ${price.toLocaleString()} MMK\n` +
        `<b>Discount:</b> -${discount}%\n` +
        `<b>Final Price:</b> ${finalPrice.toLocaleString()} MMK\n\n` +
        `<b>━━━━━━━━━━━━━━━━━━━━━</b>\n` +
        `<b>💳 PAYMENT INSTRUCTIONS</b>\n` +
        `<b>━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
        `Send payment to:\n` +
        `• KBZ Bank: 0987654321 (William)\n` +
        `• WavePay: 09798268154\n\n` +
        `<b>Order ID:</b> #${orderId}\n\n` +
        `<i>After payment, click "I HAVE PAID" and send your payment proof screenshot.</i>`,
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
        await ctx.reply(
            '❌ No pending order found.\n\nPlease place an order first using the Products menu.',
            { parse_mode: 'HTML', ...mainMenu }
        );
        return;
    }
    
    pendingOrders.set(currentOrderId, { ...currentOrder, status: 'waiting_proof' });
    
    await ctx.reply(
        `<b>📸 PLEASE SEND YOUR PAYMENT PROOF</b>\n\n` +
        `<b>Order ID:</b> #${currentOrderId}\n` +
        `<b>Product:</b> ${currentOrder.productName}\n` +
        `<b>Amount:</b> ${currentOrder.price.toLocaleString()} MMK\n\n` +
        `Please send a screenshot of your payment transaction.\n\n` +
        `<i>Our admin will verify your payment and deliver your product within 30 minutes.</i>`,
        { parse_mode: 'HTML' }
    );
});

// ============================================
// PAYMENT PROOF HANDLER
// ============================================
bot.on('photo', async (ctx) => {
    console.log(`📸 Payment proof from user: ${ctx.from.id}`);
    
    let currentOrder = null;
    let currentOrderId = null;
    for (const [orderId, order] of pendingOrders) {
        if (order.userId === ctx.from.id && order.status === 'waiting_proof') {
            currentOrder = order;
            currentOrderId = orderId;
            break;
        }
    }
    
    if (!currentOrder) {
        await ctx.reply(
            '❌ No pending payment found.\n\nPlease place an order first: /start',
            { parse_mode: 'HTML' }
        );
        return;
    }
    
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    
    pendingOrders.set(currentOrderId, {
        ...currentOrder,
        status: 'proof_submitted',
        proofFileId: photo.file_id
    });
    
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
        `<b>Order ID:</b> #${currentOrderId}\n\n` +
        `⏳ <b>Please wait...</b>\n` +
        `Our admin is reviewing your payment.\n\n` +
        `You will receive your product information here within 30 minutes.\n\n` +
        `<i>Thank you for your patience! 🙏</i>`,
        { parse_mode: 'HTML' }
    );
});

// ============================================
// ADMIN CONFIRM HANDLER
// ============================================
bot.action(/confirm_(\d+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('⛔ Admin access only');
        return;
    }
    
    const orderId = parseInt(ctx.match[1]);
    await ctx.answerCbQuery();
    
    const order = pendingOrders.get(orderId);
    if (!order) {
        await ctx.editMessageCaption('❌ Order not found!', { parse_mode: 'HTML' });
        return;
    }
    
    awaitingServiceInfo.set(ADMIN_ID, { orderId: orderId, userId: order.userId });
    
    await ctx.editMessageCaption(
        `<b>✅ ORDER #${orderId} - CONFIRMATION PENDING</b>\n\n` +
        `<b>Customer:</b> @${order.username || 'N/A'} (${order.userId})\n` +
        `<b>Product:</b> ${order.productName}\n` +
        `<b>Amount:</b> ${order.price.toLocaleString()} MMK\n\n` +
        `<b>━━━━━━━━━━━━━━━━━━━━━</b>\n` +
        `<b>📦 NEXT STEP:</b>\n` +
        `<b>━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
        `Please <b>forward or type the service information</b> (login, password, link, etc.) to this chat.\n\n` +
        `The bot will automatically deliver it to the customer.`,
        { parse_mode: 'HTML' }
    );
});

// ============================================
// SERVICE INFO DELIVERY (Forwarded or Typed)
// ============================================
bot.on('forward_date', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    
    const pending = awaitingServiceInfo.get(ADMIN_ID);
    if (!pending) return;
    
    const { orderId, userId } = pending;
    const order = pendingOrders.get(orderId);
    
    if (!order) {
        await ctx.reply('❌ Order not found.');
        awaitingServiceInfo.delete(ADMIN_ID);
        return;
    }
    
    let serviceDetails = ctx.message.text || ctx.message.caption || '⚠️ Service information received.';
    
    await sendServiceInfoToUser(userId, orderId, order.productName, serviceDetails);
    
    buyers.add(userId);
    
    pendingOrders.set(orderId, { ...order, status: 'completed', deliveredAt: new Date().toISOString() });
    awaitingServiceInfo.delete(ADMIN_ID);
    
    await ctx.reply(
        `<b>✅ ORDER #${orderId} - COMPLETED!</b>\n\n` +
        `Service information sent to <b>@${order.username || userId}</b>.\n\n` +
        `📦 Status: Delivered ✅\n` +
        `🕐 Time: ${new Date().toLocaleString()}`,
        { parse_mode: 'HTML' }
    );
});

bot.on('text', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    if (awaitingBroadcast) return;
    
    const pending = awaitingServiceInfo.get(ADMIN_ID);
    if (!pending) return;
    if (ctx.message.text.startsWith('/')) return;
    
    const { orderId, userId } = pending;
    const order = pendingOrders.get(orderId);
    
    if (!order) {
        await ctx.reply('❌ Order not found.');
        awaitingServiceInfo.delete(ADMIN_ID);
        return;
    }
    
    const serviceDetails = ctx.message.text;
    
    await sendServiceInfoToUser(userId, orderId, order.productName, serviceDetails);
    
    buyers.add(userId);
    
    pendingOrders.set(orderId, { ...order, status: 'completed', deliveredAt: new Date().toISOString() });
    awaitingServiceInfo.delete(ADMIN_ID);
    
    await ctx.reply(
        `<b>✅ ORDER #${orderId} - COMPLETED!</b>\n\n` +
        `Service information sent to <b>@${order.username || userId}</b>.`,
        { parse_mode: 'HTML' }
    );
});

// ============================================
// ADMIN CANCEL HANDLER
// ============================================
bot.action(/cancel_(\d+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('⛔ Admin access only');
        return;
    }
    
    const orderId = parseInt(ctx.match[1]);
    await ctx.answerCbQuery();
    
    const order = pendingOrders.get(orderId);
    if (!order) {
        await ctx.editMessageCaption('❌ Order not found!', { parse_mode: 'HTML' });
        return;
    }
    
    pendingOrders.set(orderId, { ...order, status: 'cancelled' });
    
    await bot.telegram.sendMessage(
        order.userId,
        `<b>❌ ORDER #${orderId} - CANCELLED</b>\n\n` +
        `Unfortunately, your order has been cancelled.\n\n` +
        `Please contact support @will815 for assistance.`,
        { parse_mode: 'HTML', ...mainMenu }
    );
    
    await ctx.editMessageCaption(
        `<b>❌ ORDER #${orderId} - CANCELLED</b>\n\nCustomer has been notified.`,
        { parse_mode: 'HTML' }
    );
});

// ============================================
// PROMO CODE
// ============================================
bot.command('apply', (ctx) => {
    const code = ctx.message.text.split(' ')[1];
    
    if (!code) {
        ctx.reply(
            '<b>🎫 PROMO CODE USAGE</b>\n\nPlease type: <code>/apply YOUR_CODE</code>\n\nExample: <code>/apply HUBBY10</code>',
            { parse_mode: 'HTML' }
        );
        return;
    }
    
    const validCodes = { 'HUBBY10': 10, 'HUBBY20': 20, 'WELCOME': 15, 'FIRSTBUY': 25 };
    
    if (validCodes[code.toUpperCase()]) {
        ctx.reply(
            `<b>✅ PROMO CODE APPLIED!</b>\n\n` +
            `Code: <code>${code.toUpperCase()}</code>\n` +
            `Discount: ${validCodes[code.toUpperCase()]}% OFF on your first purchase!\n\n` +
            `Click <b>Products</b> to start shopping.`,
            { parse_mode: 'HTML', ...mainMenu }
        );
    } else {
        ctx.reply(`<b>❌ INVALID PROMO CODE</b>\n\nThe code <code>${code}</code> is not valid.`, { parse_mode: 'HTML' });
    }
});

// ============================================
// ADMIN STATS COMMAND
// ============================================
bot.command('stats', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.reply('⛔ Access denied. Admin only.');
        return;
    }
    
    const totalUsers = users.size;
    const totalBuyers = buyers.size;
    const totalOrders = pendingOrders.size;
    const completedOrders = Array.from(pendingOrders.values()).filter(o => o.status === 'completed').length;
    
    await ctx.reply(
        `<b>📊 BOT STATISTICS</b>\n\n` +
        `<b>Total Users:</b> ${totalUsers}\n` +
        `<b>Total Buyers:</b> ${totalBuyers}\n` +
        `<b>Total Orders:</b> ${totalOrders}\n` +
        `<b>Completed Orders:</b> ${completedOrders}\n` +
        `<b>Pending Orders:</b> ${totalOrders - completedOrders}\n\n` +
        `<i>Last updated: ${new Date().toLocaleString()}</i>`,
        { parse_mode: 'HTML' }
    );
});

// ============================================
// ADMIN BROADCAST COMMANDS
// ============================================
bot.command('broadcast', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.reply('⛔ Access denied. Admin only.');
        return;
    }
    
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📢 All Users', 'broadcast_all')],
        [Markup.button.callback('✅ Verified Buyers Only', 'broadcast_buyers')],
        [Markup.button.callback('❌ Cancel', 'broadcast_cancel')]
    ]);
    
    await ctx.reply(
        `<b>📢 BROADCAST MESSAGE</b>\n\nWho should receive this message?\n\n` +
        `<b>All Users:</b> Everyone who started the bot (${users.size})\n` +
        `<b>Verified Buyers:</b> Users who completed a purchase (${buyers.size})\n\n` +
        `Select an option below:`,
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
        `<b>📢 BROADCAST TO ALL USERS</b>\n\nTarget: <b>${users.size} users</b>\n\n` +
        `Please send me the message you want to broadcast.\n\n` +
        `You can send:\n• 📝 Text message\n• 🖼️ Photo with caption\n\n` +
        `<i>Type /cancel to abort.</i>`,
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
        `<b>📢 BROADCAST TO VERIFIED BUYERS</b>\n\nTarget: <b>${buyers.size} users</b>\n\n` +
        `Please send me the message you want to broadcast.\n\n` +
        `You can send:\n• 📝 Text message\n• 🖼️ Photo with caption\n\n` +
        `<i>Type /cancel to abort.</i>`,
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
    
    await ctx.editMessageText(`<b>❌ Broadcast cancelled.</b>`, { parse_mode: 'HTML' });
});

bot.on('text', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    if (!awaitingBroadcast) return;
    if (ctx.message.text.startsWith('/')) return;
    
    broadcastMessage = ctx.message.text;
    
    const confirmKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Send Now', 'broadcast_send')],
        [Markup.button.callback('❌ Cancel', 'broadcast_cancel_confirm')]
    ]);
    
    await ctx.reply(
        `<b>📢 BROADCAST PREVIEW</b>\n\n` +
        `<b>Target:</b> ${broadcastTarget === 'all' ? `All Users (${users.size})` : `Verified Buyers (${buyers.size})`}\n\n` +
        `<b>Message:</b>\n━━━━━━━━━━━━━━━━━━━━━\n${broadcastMessage}\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Click <b>Send Now</b> to broadcast.`,
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
        [Markup.button.callback('✅ Send Now', 'broadcast_send')],
        [Markup.button.callback('❌ Cancel', 'broadcast_cancel_confirm')]
    ]);
    
    await ctx.reply(
        `<b>📢 BROADCAST PREVIEW</b>\n\n` +
        `<b>Target:</b> ${broadcastTarget === 'all' ? `All Users (${users.size})` : `Verified Buyers (${buyers.size})`}\n\n` +
        `<b>Media:</b> Photo received\n` +
        `<b>Caption:</b> ${broadcastMessage || '(no caption)'}\n\n` +
        `Click <b>Send Now</b> to broadcast.`,
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
    let successCount = 0;
    let failCount = 0;
    
    await ctx.editMessageText(
        `<b>📢 BROADCAST IN PROGRESS...</b>\n\nSending to ${targetUsers.size} users...\n\n<i>Please wait...</i>`,
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
            successCount++;
        } catch (err) {
            failCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    await ctx.reply(
        `<b>✅ BROADCAST COMPLETED!</b>\n\n` +
        `<b>Target:</b> ${broadcastTarget === 'all' ? 'All Users' : 'Verified Buyers'}\n` +
        `<b>Sent:</b> ${successCount} users\n` +
        `<b>Failed:</b> ${failCount} users\n\n` +
        `<i>Broadcast finished at ${new Date().toLocaleString()}</i>`,
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
    
    await ctx.editMessageText(`<b>❌ Broadcast cancelled.</b>`, { parse_mode: 'HTML' });
});

bot.command('cancel', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    if (awaitingBroadcast) {
        awaitingBroadcast = false;
        broadcastTarget = null;
        await ctx.reply('❌ Broadcast cancelled.');
    }
});

// ============================================
// TEST COMMAND
// ============================================
bot.command('test', (ctx) => {
    ctx.reply('✅ Bot is online and working properly!', { parse_mode: 'HTML' });
});

// ============================================
// UNKNOWN MESSAGE HANDLER
// ============================================
bot.on('text', (ctx) => {
    if (ctx.from.id === ADMIN_ID) return;
    if (ctx.message.text.startsWith('/')) return;
    
    ctx.reply(
        '❓ <b>Command not recognized</b>\n\nPlease use the buttons below or type /start',
        { parse_mode: 'HTML', ...mainMenu }
    );
});

// ============================================
// LAUNCH BOT
// ============================================
bot.launch()
    .then(() => {
        console.log('========================================');
        console.log('✅ BOT IS RUNNING SUCCESSFULLY!');
        console.log('========================================');
        console.log('🤖 Bot: @digitalhub_official_bot');
        console.log(`👑 Admin ID: ${ADMIN_ID}`);
        console.log('========================================');
    })
    .catch((err) => {
        console.error('❌ Launch error:', err);
        process.exit(1);
    });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

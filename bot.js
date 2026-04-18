const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 1379973354; // Replace with your Telegram User ID

// Temporary storage
const pendingOrders = new Map(); // orderId -> { userId, productName, price, username }
const awaitingServiceInfo = new Map(); // adminChatId -> { orderId, userId }

let orderCounter = 1000;

console.log('========================================');
console.log('🤖 Digital Hub Bot Starting...');
console.log('========================================');
console.log('✅ Bot initialized');
console.log(`👑 Admin ID: ${ADMIN_ID}`);
console.log('========================================');

const bot = new Telegraf(BOT_TOKEN);

// ============================================
// Main Menu Keyboard
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
// Helper: Send Service Info to User
// ============================================
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
// Helper: Send Order to Admin
// ============================================
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

// ============================================
// /start Command
// ============================================
bot.start((ctx) => {
    const userName = ctx.from.first_name || ctx.from.username || 'User';
    console.log(`✅ User ${ctx.from.id} (@${ctx.from.username}) started the bot`);
    
    ctx.reply(
        `🎉 <b>Welcome to Digital Hub Store!</b>\n\n` +
        `👋 Hello <b>${userName}</b>!\n\n` +
        `We offer premium digital products at the best prices.\n\n` +
        `👇 <b>Please select an option below:</b>`,
        { parse_mode: 'HTML', ...mainMenu }
    );
});

// ============================================
// Menu Handlers
// ============================================
bot.action('menu_products', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '<b>🛍️ OUR PRODUCTS</b>\n\n' +
        'Please select a product from below:',
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
        '• 🤖 AI Tools\n' +
        '• 📸 Photo Editing\n' +
        '• 🎬 Video Editing\n' +
        '• 🔒 VPNs\n' +
        '• 📺 Others\n\n' +
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
        '<b>🏠 MAIN MENU</b>\n\n' +
        'Please select an option below:',
        { parse_mode: 'HTML', ...mainMenu }
    );
});

// ============================================
// Buy Handlers
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
    
    // Store order info
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

// ============================================
// Payment Done Handler
// ============================================
bot.action('payment_done', async (ctx) => {
    await ctx.answerCbQuery();
    
    // Find pending order for this user
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
            '❌ No pending order found.\n\n' +
            'Please place an order first using the Products menu.',
            { parse_mode: 'HTML', ...mainMenu }
        );
        return;
    }
    
    // Update order status
    pendingOrders.set(currentOrderId, {
        ...currentOrder,
        status: 'waiting_proof'
    });
    
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
// Handle Photo (Payment Proof)
// ============================================
bot.on('photo', async (ctx) => {
    console.log(`📸 Payment proof received from user: ${ctx.from.id}`);
    
    // Find order for this user
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
            '❌ No pending payment found.\n\n' +
            'Please place an order first: /start',
            { parse_mode: 'HTML' }
        );
        return;
    }
    
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    
    // Update order status
    pendingOrders.set(currentOrderId, {
        ...currentOrder,
        status: 'proof_submitted',
        proofFileId: photo.file_id
    });
    
    // Send to admin
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
// Admin Confirm Handler (First Step)
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
    
    // Store that admin is about to send service info
    awaitingServiceInfo.set(ADMIN_ID, {
        orderId: orderId,
        userId: order.userId
    });
    
    await ctx.editMessageCaption(
        `<b>✅ ORDER #${orderId} - CONFIRMATION PENDING</b>\n\n` +
        `<b>Customer:</b> @${order.username || 'N/A'} (${order.userId})\n` +
        `<b>Product:</b> ${order.productName}\n` +
        `<b>Amount:</b> ${order.price.toLocaleString()} MMK\n\n` +
        `<b>━━━━━━━━━━━━━━━━━━━━━</b>\n` +
        `<b>📦 NEXT STEP:</b>\n` +
        `<b>━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
        `Please <b>forward the service information</b> (login, password, link, etc.) to this chat.\n\n` +
        `The bot will automatically deliver it to the customer.\n\n` +
        `<i>Forward any message containing the service details → bot sends to customer.</i>`,
        { parse_mode: 'HTML' }
    );
});

// ============================================
// Handle Forwarded Messages (Service Info)
// ============================================
bot.on('forward_date', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    
    const pending = awaitingServiceInfo.get(ADMIN_ID);
    if (!pending) return;
    
    const { orderId, userId } = pending;
    const order = pendingOrders.get(orderId);
    
    if (!order) {
        await ctx.reply('❌ Order not found. Please try again.');
        awaitingServiceInfo.delete(ADMIN_ID);
        return;
    }
    
    // Get the forwarded message content
    let serviceDetails = '';
    
    if (ctx.message.text) {
        serviceDetails = ctx.message.text;
    } else if (ctx.message.caption) {
        serviceDetails = ctx.message.caption;
    } else {
        serviceDetails = '⚠️ No text content. Please send the service info as text.';
    }
    
    // Send service info to customer
    await sendServiceInfoToUser(userId, orderId, order.productName, serviceDetails);
    
    // Update order status
    pendingOrders.set(orderId, {
        ...order,
        status: 'completed',
        deliveredAt: new Date().toISOString()
    });
    
    // Clear awaiting state
    awaitingServiceInfo.delete(ADMIN_ID);
    
    // Confirm to admin
    await ctx.reply(
        `<b>✅ ORDER #${orderId} - COMPLETED!</b>\n\n` +
        `Service information has been sent to <b>@${order.username || userId}</b>.\n\n` +
        `📦 <b>Delivery Status:</b> Delivered ✅\n` +
        `🕐 <b>Time:</b> ${new Date().toLocaleString()}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `<i>The customer has been notified.</i>`,
        { parse_mode: 'HTML' }
    );
});

// ============================================
// Handle Text Messages as Service Info (Alternative)
// ============================================
bot.on('text', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    
    const pending = awaitingServiceInfo.get(ADMIN_ID);
    if (!pending) return;
    
    // Ignore commands
    if (ctx.message.text.startsWith('/')) return;
    
    const { orderId, userId } = pending;
    const order = pendingOrders.get(orderId);
    
    if (!order) {
        await ctx.reply('❌ Order not found.');
        awaitingServiceInfo.delete(ADMIN_ID);
        return;
    }
    
    const serviceDetails = ctx.message.text;
    
    // Send service info to customer
    await sendServiceInfoToUser(userId, orderId, order.productName, serviceDetails);
    
    pendingOrders.set(orderId, {
        ...order,
        status: 'completed',
        deliveredAt: new Date().toISOString()
    });
    
    awaitingServiceInfo.delete(ADMIN_ID);
    
    await ctx.reply(
        `<b>✅ ORDER #${orderId} - COMPLETED!</b>\n\n` +
        `Service information has been sent to <b>@${order.username || userId}</b>.\n\n` +
        `📦 <b>Status:</b> Delivered ✅`,
        { parse_mode: 'HTML' }
    );
});

// ============================================
// Admin Cancel Handler
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
    
    // Notify customer
    await bot.telegram.sendMessage(
        order.userId,
        `<b>❌ ORDER #${orderId} - CANCELLED</b>\n\n` +
        `Unfortunately, your order has been cancelled.\n\n` +
        `Please contact support @will815 for assistance.\n\n` +
        `<i>You can place a new order anytime.</i>`,
        { parse_mode: 'HTML', ...mainMenu }
    );
    
    await ctx.editMessageCaption(
        `<b>❌ ORDER #${orderId} - CANCELLED</b>\n\n` +
        `Customer has been notified.`,
        { parse_mode: 'HTML' }
    );
});

// ============================================
// Promo Code Command
// ============================================
bot.command('apply', (ctx) => {
    const code = ctx.message.text.split(' ')[1];
    
    if (!code) {
        ctx.reply(
            '<b>🎫 PROMO CODE USAGE</b>\n\n' +
            'Please type: <code>/apply YOUR_CODE</code>\n\n' +
            'Example: <code>/apply HUBBY10</code>',
            { parse_mode: 'HTML' }
        );
        return;
    }
    
    const validCodes = {
        'HUBBY10': 10,
        'HUBBY20': 20,
        'WELCOME': 15,
        'FIRSTBUY': 25
    };
    
    if (validCodes[code.toUpperCase()]) {
        const discount = validCodes[code.toUpperCase()];
        ctx.reply(
            `<b>✅ PROMO CODE APPLIED!</b>\n\n` +
            `Code: <code>${code.toUpperCase()}</code>\n` +
            `Discount: ${discount}% OFF on your first purchase!\n\n` +
            `Click <b>Products</b> to start shopping.`,
            { parse_mode: 'HTML', ...mainMenu }
        );
    } else {
        ctx.reply(
            `<b>❌ INVALID PROMO CODE</b>\n\n` +
            `The code <code>${code}</code> is not valid.\n\n` +
            `Please check and try again.`,
            { parse_mode: 'HTML' }
        );
    }
});

// ============================================
// Test Command
// ============================================
bot.command('test', (ctx) => {
    ctx.reply('✅ Bot is online and working properly!', { parse_mode: 'HTML' });
});

// ============================================
// Unknown Message Handler
// ============================================
bot.on('text', (ctx) => {
    if (ctx.from.id === ADMIN_ID) return;
    if (ctx.message.text.startsWith('/')) return;
    
    ctx.reply(
        '❓ <b>Command not recognized</b>\n\n' +
        'Please use the buttons below or type /start',
        { parse_mode: 'HTML', ...mainMenu }
    );
});

// ============================================
// Launch Bot
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

const { Telegraf, Markup } = require('telegraf');

// ============================================
// CONFIGURATION
// ============================================
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 1379973354;  // ← သင့် Telegram User ID ထည့်ပါ

// Temporary storage (ပိုကောင်းအောင် နောက်မှ Database ထည့်မယ်)
const pendingOrders = new Map();
let orderCounter = 1000;

console.log('========================================');
console.log('🤖 Digital Hub Bot Starting...');
console.log('========================================');

if (!BOT_TOKEN) {
    console.error('❌ ERROR: BOT_TOKEN is not set!');
    process.exit(1);
}

console.log('✅ Token validated');
console.log(`👑 Admin ID: ${ADMIN_ID}`);
console.log('========================================');

const bot = new Telegraf(BOT_TOKEN);

// ============================================
// Helper: Send Order to Admin
// ============================================
async function sendOrderToAdmin(orderId, userId, username, productName, finalPrice, paymentProof) {
    const adminKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Confirm Order', `confirm_${orderId}`)],
        [Markup.button.callback('❌ Cancel Order', `cancel_${orderId}`)]
    ]);
    
    const caption = 
        `🆕 **NEW ORDER #${orderId}**\n\n` +
        `👤 User ID: ${userId}\n` +
        `👤 Username: @${username || 'N/A'}\n` +
        `🛍️ Product: ${productName}\n` +
        `💰 Amount: ${finalPrice.toLocaleString()} MMK\n` +
        `📅 Date: ${new Date().toLocaleString()}\n\n` +
        `📸 Payment Proof attached below.`;
    
    // Send payment proof photo to admin
    await bot.telegram.sendPhoto(ADMIN_ID, paymentProof, {
        caption: caption,
        parse_mode: 'Markdown',
        ...adminKeyboard
    });
}

// ============================================
// Main Menu
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
    [Markup.button.callback('◀️ Back to Main Menu', 'back_main')]
]);

// ============================================
// /start Command
// ============================================
bot.start((ctx) => {
    const userName = ctx.from.first_name || ctx.from.username || 'User';
    console.log(`✅ User ${ctx.from.id} (${userName}) started`);
    
    ctx.reply(
        `🎉 **Welcome to Digital Hub Store!**\n\n` +
        `👋 Hello ${userName}!\n\n` +
        `အောက်ပါ Button များထဲက ရွေးချယ်နိုင်ပါတယ်။\n\n` +
        `📌 **Order ပြုလုပ်နည်း**\n` +
        `1. Product ကိုရွေးပါ\n` +
        `2. Payment လုပ်ပါ\n` +
        `3. Payment Proof ပုံကို ဒီ Chat ထဲမှာ ပို့ပါ\n` +
        `4. Admin က Confirm လုပ်ပေးပါမယ်`,
        { parse_mode: 'Markdown', ...mainMenu }
    );
});

// ============================================
// Menu Handlers
// ============================================
bot.action('menu_products', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        `🛍️ **ပစ္စည်းများစာရင်း**\n\n` +
        `အောက်ပါပစ္စည်းများထဲက ရွေးချယ်နိုင်ပါတယ်။`,
        { parse_mode: 'Markdown', ...productsKeyboard }
    );
});

bot.action('menu_discounts', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        `🔥 **လျှော့စျေးရှိတဲ့ပစ္စည်းများ**\n\n` +
        `• 🤖 ChatGPT Plus - ~~120,000~~ → 64,800 MMK (-46%)\n` +
        `• 🎨 Canva Pro - ~~8,000~~ → 6,000 MMK (-25%)\n` +
        `• 🔒 Express VPN - ~~5,000~~ → 3,500 MMK (-30%)\n` +
        `• 🎬 Adobe Premiere Pro - ~~15,000~~ → 9,000 MMK (-40%)\n` +
        `• 📺 YouTube Premium - ~~6,000~~ → 4,800 MMK (-20%)\n\n` +
        `🛒 ဝယ်ယူရန် Products မှာ ရွေးချယ်ပါ။`,
        { parse_mode: 'Markdown', ...productsKeyboard }
    );
});

bot.action('menu_categories', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        `📁 **အမျိုးအစားများ**\n\n` +
        `အောက်ပါအမျိုးအစားများထဲက ရွေးချယ်ပါ။\n\n` +
        `🎨 AI Tools\n📸 Photo Editing\n🎬 Video Editing\n🔒 VPNs\n📺 Others`,
        { parse_mode: 'Markdown', ...productsKeyboard }
    );
});

bot.action('menu_promo', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        `🎫 **Promo Code**\n\n` +
        `သင့်မှာ Promo Code ရှိရင် အောက်ပါအတိုင်း ရိုက်ထည့်ပါ။\n\n` +
        `/apply သင့်_code\n\n` +
        `ဥပမာ: /apply HUBBY10\n\n` +
        `✅ ပထမဆုံးဝယ်ယူမှုအတွက် Discount ရပါမယ်။`,
        { parse_mode: 'Markdown' }
    );
});

bot.action('menu_contact', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        `📞 **ဆက်သွယ်ရန်**\n\n` +
        `• Telegram: @will815\n` +
        `• မေးစရာရှိရင် ဆက်သွယ်နိုင်ပါတယ်။\n\n` +
        `💳 **ငွေပေးချေရန်:**\n` +
        `• KBZ Bank: 0987654321\n` +
        `• WavePay: 09798268154`,
        { parse_mode: 'Markdown' }
    );
});

bot.action('back_main', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        `🏠 **Main Menu**\n\n` +
        `အောက်ပါ Button များထဲက ရွေးချယ်နိုင်ပါတယ်။`,
        { parse_mode: 'Markdown', ...mainMenu }
    );
});

// ============================================
// Buy Handlers
// ============================================
let selectedProduct = null;

bot.action(/buy_(\d+)/, async (ctx) => {
    const productId = parseInt(ctx.match[1]);
    await ctx.answerCbQuery();
    
    let productName = '';
    let price = 0;
    let discount = 0;
    
    switch(productId) {
        case 1:
            productName = 'ChatGPT Plus';
            price = 120000;
            discount = 46;
            break;
        case 2:
            productName = 'Canva Pro';
            price = 8000;
            discount = 25;
            break;
        case 3:
            productName = 'Express VPN';
            price = 5000;
            discount = 30;
            break;
        case 4:
            productName = 'Adobe Premiere Pro';
            price = 15000;
            discount = 40;
            break;
        case 5:
            productName = 'YouTube Premium';
            price = 6000;
            discount = 20;
            break;
        default:
            await ctx.editMessageText('❌ ပစ္စည်းမတွေ့ပါ။');
            return;
    }
    
    const finalPrice = price - (price * discount / 100);
    
    // Store selected product for this user
    selectedProduct = {
        id: productId,
        name: productName,
        price: finalPrice,
        originalPrice: price,
        discount: discount
    };
    
    const paymentKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ I have paid', 'confirm_payment')],
        [Markup.button.callback('◀️ Back to Products', 'menu_products')]
    ]);
    
    await ctx.editMessageText(
        `🛒 **${productName}** ဝယ်ယူရန်\n\n` +
        `📅 Duration: 1 month\n` +
        `💰 ဈေး: ${finalPrice.toLocaleString()} MMK\n` +
        `🏷️ လျှော့စျေး: -${discount}%\n\n` +
        `💳 **ငွေပေးချေရန်:**\n` +
        `• KBZ Bank: 0987654321 (William)\n` +
        `• WavePay: 09798268154\n\n` +
        `📌 ငွေလွှဲပြီးပါက **"✅ I have paid"** ကိုနှိပ်ပြီး\n` +
        `Payment Proof ပုံကို ပို့ပေးပါ။`,
        { parse_mode: 'Markdown', ...paymentKeyboard }
    );
});

// ============================================
// Confirm Payment (User clicks button)
// ============================================
bot.action('confirm_payment', async (ctx) => {
    await ctx.answerCbQuery();
    
    if (!selectedProduct) {
        await ctx.reply('❌ Please select a product first. /start');
        return;
    }
    
    // Store pending order
    const orderId = ++orderCounter;
    pendingOrders.set(ctx.from.id, {
        orderId: orderId,
        product: selectedProduct,
        userId: ctx.from.id,
        username: ctx.from.username,
        status: 'pending'
    });
    
    await ctx.reply(
        `📸 **Please send your payment proof screenshot.**\n\n` +
        `Order ID: #${orderId}\n` +
        `Product: ${selectedProduct.name}\n` +
        `Amount: ${selectedProduct.price.toLocaleString()} MMK\n\n` +
        `💰 ငွေလွှဲပြီးပါက ပုံအထောက်အထားကို ဒီမှာ ပို့ပေးပါ။`,
        { parse_mode: 'Markdown' }
    );
});

// ============================================
// Handle Photo (Payment Proof)
// ============================================
bot.on('photo', async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;
    
    // Get pending order for this user
    const pendingOrder = pendingOrders.get(userId);
    
    if (!pendingOrder) {
        await ctx.reply(
            `❌ ကျေးဇူးပြု၍ ပစ္စည်းအရင်ရွေးပါ။\n\n` +
            `/start - စတင်ရန်`,
            { parse_mode: 'Markdown' }
        );
        return;
    }
    
    const orderId = pendingOrder.orderId;
    const product = pendingOrder.product;
    
    // Get the largest photo (best quality)
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const fileId = photo.file_id;
    
    // Send to admin
    const adminKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Confirm', `admin_confirm_${orderId}`)],
        [Markup.button.callback('❌ Cancel', `admin_cancel_${orderId}`)]
    ]);
    
    const caption = 
        `🆕 **NEW ORDER #${orderId}**\n\n` +
        `👤 User: @${username || 'N/A'}\n` +
        `🆔 User ID: ${userId}\n` +
        `🛍️ Product: ${product.name}\n` +
        `💰 Amount: ${product.price.toLocaleString()} MMK\n` +
        `📅 Date: ${new Date().toLocaleString()}\n\n` +
        `📸 Payment Proof attached.`;
    
    await bot.telegram.sendPhoto(ADMIN_ID, fileId, {
        caption: caption,
        parse_mode: 'Markdown',
        ...adminKeyboard
    });
    
    // Update pending order with proof
    pendingOrders.set(userId, {
        ...pendingOrder,
        proofFileId: fileId,
        status: 'waiting_confirmation'
    });
    
    await ctx.reply(
        `✅ **Payment Proof received!**\n\n` +
        `Order ID: #${orderId}\n` +
        `Product: ${product.name}\n` +
        `Amount: ${product.price.toLocaleString()} MMK\n\n` +
        `⏳ Admin ကိုစောင့်ဆိုင်းပေးပါ။\n` +
        `Order အတည်ပြုပြီးပါက အကြောင်းကြားပါမည်။`,
        { parse_mode: 'Markdown' }
    );
});

// ============================================
// Admin Confirm Handler
// ============================================
bot.action(/admin_confirm_(\d+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('⛔ Admin only!');
        return;
    }
    
    const orderId = parseInt(ctx.match[1]);
    await ctx.answerCbQuery();
    
    // Find user with this order
    let targetUserId = null;
    let orderDetails = null;
    
    for (const [userId, order] of pendingOrders) {
        if (order.orderId === orderId) {
            targetUserId = userId;
            orderDetails = order;
            break;
        }
    }
    
    if (!targetUserId) {
        await ctx.editMessageCaption('❌ Order not found!');
        return;
    }
    
    // Update order status
    pendingOrders.set(targetUserId, {
        ...orderDetails,
        status: 'confirmed'
    });
    
    // Notify user
    await bot.telegram.sendMessage(targetUserId,
        `✅ **Order #${orderId} CONFIRMED!**\n\n` +
        `🛍️ Product: ${orderDetails.product.name}\n` +
        `💰 Amount: ${orderDetails.product.price.toLocaleString()} MMK\n\n` +
        `📦 Your order will be processed within 24 hours.\n` +
        `🙏 Thank you for shopping with Digital Hub!`,
        { parse_mode: 'Markdown', ...mainMenu }
    );
    
    // Update admin message
    await ctx.editMessageCaption(
        `✅ **ORDER #${orderId} CONFIRMED!**\n\n` +
        `User has been notified.`,
        { parse_mode: 'Markdown' }
    );
});

// ============================================
// Admin Cancel Handler
// ============================================
bot.action(/admin_cancel_(\d+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('⛔ Admin only!');
        return;
    }
    
    const orderId = parseInt(ctx.match[1]);
    await ctx.answerCbQuery();
    
    // Find user with this order
    let targetUserId = null;
    let orderDetails = null;
    
    for (const [userId, order] of pendingOrders) {
        if (order.orderId === orderId) {
            targetUserId = userId;
            orderDetails = order;
            break;
        }
    }
    
    if (!targetUserId) {
        await ctx.editMessageCaption('❌ Order not found!');
        return;
    }
    
    // Update order status
    pendingOrders.set(targetUserId, {
        ...orderDetails,
        status: 'cancelled'
    });
    
    // Notify user
    await bot.telegram.sendMessage(targetUserId,
        `❌ **Order #${orderId} CANCELLED**\n\n` +
        `ကျေးဇူးပြု၍ သင့် Payment Proof ကို ထပ်မံစစ်ဆေးပါ။\n` +
        `မေးစရာရှိရင် @will815 ကိုဆက်သွယ်ပါ။`,
        { parse_mode: 'Markdown', ...mainMenu }
    );
    
    // Update admin message
    await ctx.editMessageCaption(
        `❌ **ORDER #${orderId} CANCELLED!**\n\n` +
        `User has been notified.`,
        { parse_mode: 'Markdown' }
    );
    
    // Clean up
    pendingOrders.delete(targetUserId);
});

// ============================================
// /apply Command
// ============================================
bot.command('apply', (ctx) => {
    const code = ctx.message.text.split(' ')[1];
    
    if (!code) {
        ctx.reply('❌ Promo Code ထည့်ပေးပါ။ ဥပမာ: /apply HUBBY10');
        return;
    }
    
    const validCodes = ['HUBBY10', 'HUBBY20', 'WELCOME', 'FIRSTBUY'];
    
    if (validCodes.includes(code.toUpperCase())) {
        let discount = 10;
        if (code.toUpperCase() === 'HUBBY20') discount = 20;
        if (code.toUpperCase() === 'WELCOME') discount = 15;
        if (code.toUpperCase() === 'FIRSTBUY') discount = 25;
        
        ctx.reply(
            `✅ Promo Code *${code.toUpperCase()}* အောင်မြင်ပါပြီ!\n\n` +
            `🎉 ${discount}% Discount ရရှိမှာပါ။\n\n` +
            `🛍️ /start ကိုနှိပ်ပြီး စတင်ဝယ်ယူပါ။`,
            { parse_mode: 'Markdown', ...mainMenu }
        );
    } else {
        ctx.reply(`❌ Promo Code *${code}* မမှန်ကန်ပါ။`, { parse_mode: 'Markdown' });
    }
});

// ============================================
// /test Command
// ============================================
bot.command('test', (ctx) => {
    ctx.reply('✅ Bot is working perfectly! 🎉');
});

// ============================================
// Unknown Message
// ============================================
bot.on('text', (ctx) => {
    if (!ctx.message.text.startsWith('/')) {
        ctx.reply('❓ နားမလည်ပါ။ /start ကိုနှိပ်ပါ။');
    }
});

// ============================================
// Launch
// ============================================
bot.launch()
    .then(() => {
        console.log('========================================');
        console.log('✅ SUCCESS! Bot is running!');
        console.log('🤖 Bot: @digitalhub_official_bot');
        console.log(`👑 Admin ID: ${ADMIN_ID}`);
        console.log('========================================');
    })
    .catch((err) => {
        console.error('❌ ERROR:', err);
        process.exit(1);
    });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

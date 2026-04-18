const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 1379973354;  // သင့် ID

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
    [Markup.button.callback('◀️ Back to Main', 'back_main')]
]);

// Temporary storage
const userSelections = new Map();
let orderCounter = 1000;

// ============================================
// Helper: Send Order to Admin (HTML format)
// ============================================
async function sendOrderToAdmin(photoFileId, orderId, username, userId, productName, price) {
    const adminKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Confirm Order', `confirm_${orderId}`)],
        [Markup.button.callback('❌ Cancel Order', `cancel_${orderId}`)]
    ]);
    
    const caption = 
        `<b>🆕 NEW ORDER #${orderId}</b>\n\n` +
        `<b>👤 User:</b> @${username || 'N/A'} (${userId})\n` +
        `<b>🛍️ Product:</b> ${productName}\n` +
        `<b>💰 Amount:</b> ${price.toLocaleString()} MMK\n` +
        `<b>📅 Date:</b> ${new Date().toLocaleString()}\n\n` +
        `<i>📸 Payment Proof attached below.</i>`;
    
    await bot.telegram.sendPhoto(ADMIN_ID, photoFileId, {
        caption: caption,
        parse_mode: 'HTML',
        ...adminKeyboard
    });
}

// ============================================
// /start
// ============================================
bot.start((ctx) => {
    console.log(`✅ User ${ctx.from.id} (${ctx.from.username}) started`);
    ctx.reply(
        `🎉 <b>Welcome to Digital Hub Store!</b>\n\n` +
        `👋 Hello ${ctx.from.first_name}!\n\n` +
        `အောက်ပါ Button များထဲက ရွေးချယ်နိုင်ပါတယ်။`,
        { parse_mode: 'HTML', ...mainMenu }
    );
});

// ============================================
// Menu Handlers
// ============================================
bot.action('menu_products', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '🛍️ <b>Products</b>\n\nအောက်ပါပစ္စည်းများထဲက ရွေးချယ်ပါ။',
        { parse_mode: 'HTML', ...productsKeyboard }
    );
});

bot.action('menu_discounts', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '<b>🔥 Discounts</b>\n\n' +
        '• ChatGPT Plus: 120,000 → 64,800 MMK (-46%)\n' +
        '• Canva Pro: 8,000 → 6,000 MMK (-25%)\n' +
        '• Express VPN: 5,000 → 3,500 MMK (-30%)\n' +
        '• Adobe Premiere Pro: 15,000 → 9,000 MMK (-40%)\n' +
        '• YouTube Premium: 6,000 → 4,800 MMK (-20%)',
        { parse_mode: 'HTML', ...productsKeyboard }
    );
});

bot.action('menu_categories', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '<b>📁 Categories</b>\n\n' +
        '• AI Tools\n• Photo Editing\n• Video Editing\n• VPNs\n• Others',
        { parse_mode: 'HTML', ...productsKeyboard }
    );
});

bot.action('menu_promo', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '<b>🎫 Promo Code</b>\n\n' +
        'Promo Code ရှိရင် /apply နဲ့ ထည့်ပါ။\n\n' +
        'ဥပမာ: /apply HUBBY10',
        { parse_mode: 'HTML' }
    );
});

bot.action('menu_contact', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '<b>📞 Contact</b>\n\n' +
        'Telegram: @will815\n\n' +
        '<b>💳 Payment:</b>\n' +
        '• KBZ Bank: 0987654321\n' +
        '• WavePay: 09798268154',
        { parse_mode: 'HTML' }
    );
});

bot.action('back_main', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '🏠 <b>Main Menu</b>',
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
    
    userSelections.set(ctx.from.id, {
        productId, productName, finalPrice
    });
    
    const paymentKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ I have paid', 'confirm_payment')],
        [Markup.button.callback('◀️ Back', 'menu_products')]
    ]);
    
    await ctx.editMessageText(
        `<b>🛒 ${productName}</b>\n\n` +
        `📅 Duration: 1 month\n` +
        `💰 Price: ${finalPrice.toLocaleString()} MMK\n` +
        `🏷️ Discount: -${discount}%\n\n` +
        `<b>💳 Payment:</b>\n` +
        `• KBZ Bank: 0987654321\n` +
        `• WavePay: 09798268154\n\n` +
        `✅ ငွေလွှဲပြီးပါက "I have paid" ကိုနှိပ်ပါ။`,
        { parse_mode: 'HTML', ...paymentKeyboard }
    );
});

// ============================================
// Confirm Payment
// ============================================
bot.action('confirm_payment', async (ctx) => {
    await ctx.answerCbQuery();
    
    const selection = userSelections.get(ctx.from.id);
    if (!selection) {
        await ctx.reply('❌ Please select a product first: /start');
        return;
    }
    
    const orderId = ++orderCounter;
    userSelections.set(ctx.from.id, { ...selection, orderId, status: 'waiting_proof' });
    
    await ctx.reply(
        `<b>📸 Please send your payment proof screenshot.</b>\n\n` +
        `Order ID: #${orderId}\n` +
        `Product: ${selection.productName}\n` +
        `Amount: ${selection.finalPrice.toLocaleString()} MMK`,
        { parse_mode: 'HTML' }
    );
});

// ============================================
// Handle Photo (Payment Proof)
// ============================================
bot.on('photo', async (ctx) => {
    console.log(`📸 Photo from user: ${ctx.from.id}`);
    
    const selection = userSelections.get(ctx.from.id);
    if (!selection || selection.status !== 'waiting_proof') {
        await ctx.reply('❌ Please select a product first: /start');
        return;
    }
    
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const orderId = selection.orderId;
    
    // Send to admin
    await sendOrderToAdmin(
        photo.file_id,
        orderId,
        ctx.from.username || ctx.from.first_name,
        ctx.from.id,
        selection.productName,
        selection.finalPrice
    );
    
    // Update status
    userSelections.set(ctx.from.id, { ...selection, status: 'sent' });
    
    await ctx.reply(
        `✅ <b>Payment Proof Received!</b>\n\n` +
        `Order ID: #${orderId}\n` +
        `⏳ Admin ကိုစောင့်ဆိုင်းပေးပါ။`,
        { parse_mode: 'HTML' }
    );
    
    console.log(`📤 Order #${orderId} sent to admin`);
});

// ============================================
// Admin Confirm
// ============================================
bot.action(/confirm_(\d+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    
    const orderId = parseInt(ctx.match[1]);
    await ctx.answerCbQuery();
    await ctx.editMessageCaption(`✅ <b>ORDER #${orderId} CONFIRMED!</b>`, { parse_mode: 'HTML' });
});

bot.action(/cancel_(\d+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    
    const orderId = parseInt(ctx.match[1]);
    await ctx.answerCbQuery();
    await ctx.editMessageCaption(`❌ <b>ORDER #${orderId} CANCELLED!</b>`, { parse_mode: 'HTML' });
});

// ============================================
// Promo Code
// ============================================
bot.command('apply', (ctx) => {
    const code = ctx.message.text.split(' ')[1];
    if (!code) {
        ctx.reply('❌ /apply HUBBY10');
        return;
    }
    
    const validCodes = ['HUBBY10', 'HUBBY20', 'WELCOME', 'FIRSTBUY'];
    if (validCodes.includes(code.toUpperCase())) {
        ctx.reply(`✅ Promo Code ${code.toUpperCase()} applied! ${code.toUpperCase() === 'HUBBY20' ? '20%' : '10%'} discount on first purchase.`);
    } else {
        ctx.reply('❌ Invalid promo code');
    }
});

// ============================================
// Launch
// ============================================
bot.launch()
    .then(() => {
        console.log('========================================');
        console.log('✅ BOT IS RUNNING!');
        console.log('========================================');
    })
    .catch((err) => {
        console.error('❌ Launch error:', err);
        process.exit(1);
    });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

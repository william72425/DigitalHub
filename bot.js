const { Telegraf, Markup } = require('telegraf');

// ============================================
// TOKEN
// ============================================
const BOT_TOKEN = process.env.BOT_TOKEN;

console.log('========================================');
console.log('🤖 Digital Hub Bot Starting...');
console.log('========================================');

if (!BOT_TOKEN) {
    console.error('❌ ERROR: BOT_TOKEN is not set!');
    process.exit(1);
}

console.log('✅ Token validated');
console.log('========================================');

const bot = new Telegraf(BOT_TOKEN);

// ============================================
// Main Menu Inline Keyboard
// ============================================
const mainMenu = Markup.inlineKeyboard([
    [Markup.button.callback('🛍️ Products', 'menu_products')],
    [Markup.button.callback('🔥 Discounts', 'menu_discounts')],
    [Markup.button.callback('📁 Categories', 'menu_categories')],
    [Markup.button.callback('🎫 Promo Code', 'menu_promo')],
    [Markup.button.callback('📞 Contact', 'menu_contact')]
]);

// ============================================
// Products Inline Keyboard (ပစ္စည်းတစ်ခုချင်းစီ)
// ============================================
const productsKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🤖 ChatGPT Plus', 'buy_1')],
    [Markup.button.callback('🎨 Canva Pro', 'buy_2')],
    [Markup.button.callback('🔒 Express VPN', 'buy_3')],
    [Markup.button.callback('🎬 Adobe Premiere Pro', 'buy_4')],
    [Markup.button.callback('📺 YouTube Premium', 'buy_5')],
    [Markup.button.callback('◀️ Back to Main Menu', 'back_main')]
]);

// ============================================
// Categories Inline Keyboard
// ============================================
const categoriesKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🎨 AI Tools', 'cat_AI Tools')],
    [Markup.button.callback('📸 Photo Editing', 'cat_Photo Editing')],
    [Markup.button.callback('🎬 Video Editing', 'cat_Video Editing')],
    [Markup.button.callback('🔒 VPNs', 'cat_VPNs')],
    [Markup.button.callback('📺 Others', 'cat_Others')],
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
        `အောက်ပါ Button များထဲက ရွေးချယ်နိုင်ပါတယ်။`,
        { parse_mode: 'Markdown', ...mainMenu }
    );
});

// ============================================
// Menu Handlers (Callback Query)
// ============================================

// Products Menu
bot.action('menu_products', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        `🛍️ **ပစ္စည်းများစာရင်း**\n\n` +
        `အောက်ပါပစ္စည်းများထဲက ရွေးချယ်နိုင်ပါတယ်။`,
        { parse_mode: 'Markdown', ...productsKeyboard }
    );
});

// Discounts Menu
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

// Categories Menu
bot.action('menu_categories', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        `📁 **အမျိုးအစားများ**\n\n` +
        `အောက်ပါအမျိုးအစားတစ်ခုကို ရွေးချယ်ပါ။`,
        { parse_mode: 'Markdown', ...categoriesKeyboard }
    );
});

// Promo Menu
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

// Contact Menu
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

// Back to Main Menu
bot.action('back_main', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        `🏠 **Main Menu**\n\n` +
        `အောက်ပါ Button များထဲက ရွေးချယ်နိုင်ပါတယ်။`,
        { parse_mode: 'Markdown', ...mainMenu }
    );
});

// ============================================
// Category Handlers
// ============================================
bot.action(/cat_(.+)/, async (ctx) => {
    const category = ctx.match[1];
    await ctx.answerCbQuery();
    
    let replyText = '';
    
    switch(category) {
        case 'AI Tools':
            replyText = `🎨 **AI Tools**\n\n• 🤖 ChatGPT Plus - 64,800 MMK (-46%)\n  /buy_1`;
            break;
        case 'Photo Editing':
            replyText = `📸 **Photo Editing**\n\n• 🎨 Canva Pro - 6,000 MMK (-25%)\n  /buy_2`;
            break;
        case 'Video Editing':
            replyText = `🎬 **Video Editing**\n\n• 🎬 Adobe Premiere Pro - 9,000 MMK (-40%)\n  /buy_4`;
            break;
        case 'VPNs':
            replyText = `🔒 **VPNs**\n\n• 🔒 Express VPN - 3,500 MMK (-30%)\n  /buy_3`;
            break;
        case 'Others':
            replyText = `📺 **Others**\n\n• 📺 YouTube Premium - 4,800 MMK (-20%)\n  /buy_5`;
            break;
        default:
            replyText = `❌ အမျိုးအစား "${category}" မတွေ့ပါ။`;
    }
    
    await ctx.editMessageText(replyText, { parse_mode: 'Markdown', ...productsKeyboard });
});

// ============================================
// Buy Handlers
// ============================================
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
    
    const buyKeyboard = Markup.inlineKeyboard([
        [Markup.button.url('💳 KBZ Pay', 'https://t.me/will815')],
        [Markup.button.url('📱 WavePay', 'https://t.me/will815')],
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
        `📸 Payment Proof ကို @will815 သို့ပို့ပါ။\n` +
        `📌 Order ID: #${Date.now()}`,
        { parse_mode: 'Markdown', ...buyKeyboard }
    );
});

// ============================================
// /apply Command (Promo Code)
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
// Launch Bot
// ============================================
bot.launch()
    .then(() => {
        console.log('========================================');
        console.log('✅ SUCCESS! Bot is running!');
        console.log('🤖 Bot: @digitalhub_official_bot');
        console.log('========================================');
    })
    .catch((err) => {
        console.error('❌ ERROR:', err);
        process.exit(1);
    });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

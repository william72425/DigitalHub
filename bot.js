const { Telegraf } = require('telegraf');

// ============================================
// TOKEN ကို Environment Variable ကနေ ယူပါ
// ============================================
const BOT_TOKEN = process.env.BOT_TOKEN;

// ============================================
// DEBUG: Token စစ်ဆေးခြင်း (Log ထဲမှာပြမယ်)
// ============================================
console.log('========================================');
console.log('🤖 Digital Hub Bot Starting...');
console.log('========================================');
console.log('📌 BOT_TOKEN exists:', BOT_TOKEN ? 'YES ✅' : 'NO ❌');
if (BOT_TOKEN) {
    console.log('📌 Token length:', BOT_TOKEN.length);
    console.log('📌 Token prefix:', BOT_TOKEN.substring(0, 15) + '...');
} else {
    console.error('❌ ERROR: BOT_TOKEN is not set in Environment Variables!');
    console.error('👉 Please add BOT_TOKEN in Railway Variables tab');
    process.exit(1);
}

// Token ပုံစစ်ဆေးခြင်း (colon ပါ/မပါ)
if (BOT_TOKEN && !BOT_TOKEN.includes(':')) {
    console.error('❌ ERROR: Token format is invalid!');
    console.error('👉 Token should be like: 1234567890:ABCdefGHIjklMNO');
    process.exit(1);
}

console.log('✅ Token validation passed!');
console.log('========================================');

// ============================================
// Bot ကို စတင်ခြင်း
// ============================================
const bot = new Telegraf(BOT_TOKEN);

// ============================================
// /start Command
// ============================================
bot.start((ctx) => {
    const userName = ctx.from.first_name || ctx.from.username || 'User';
    console.log(`✅ User ${ctx.from.id} (${userName}) started the bot`);
    
    ctx.reply(
        `🎉 ကြိုဆိုပါတယ် ${userName}!\n\n` +
        `🤖 **Digital Hub Store** မှ ကြိုဆိုပါတယ်။\n\n` +
        `📌 **သုံးနိုင်တဲ့ Command များ:**\n` +
        `/products - အကုန်ပစ္စည်းများ\n` +
        `/discounts - လျှော့စျေးရှိတဲ့ပစ္စည်းများ\n` +
        `/categories - အမျိုးအစားအလိုက်\n` +
        `/promo - Promo Code ထည့်ရန်\n` +
        `/help - အကူအညီ\n\n` +
        `💬 မေးစရာရှိရင် @william815 ကိုဆက်သွယ်ပါ။`,
        { parse_mode: 'Markdown' }
    );
});

// ============================================
// /help Command
// ============================================
bot.command('help', (ctx) => {
    ctx.reply(
        `🆘 **အကူအညီ**\n\n` +
        `/start - စတင်ရန်\n` +
        `/products - ပစ္စည်းအားလုံးကြည့်ရန်\n` +
        `/discounts - လျှော့စျေးပစ္စည်းများ\n` +
        `/categories - အမျိုးအစားအလိုက်\n` +
        `/promo - Promo Code ထည့်ရန်\n` +
        `/buy_[ID] - ပစ္စည်းဝယ်ယူရန် (ဥပမာ /buy_1)\n` +
        `/test - Bot အလုပ်လုပ်မလား စမ်းရန်`,
        { parse_mode: 'Markdown' }
    );
});

// ============================================
// /test Command (Bot အလုပ်လုပ်မလား စမ်းရန်)
// ============================================
bot.command('test', (ctx) => {
    console.log(`🧪 Test command from user ${ctx.from.id}`);
    ctx.reply('✅ Bot is working perfectly! 🎉');
});

// ============================================
// /products Command
// ============================================
bot.command('products', (ctx) => {
    console.log(`📦 Products list requested by ${ctx.from.id}`);
    
    ctx.reply(
        `🛍️ **ပစ္စည်းများစာရင်း**\n\n` +
        `1️⃣ *ChatGPT Plus* - AI Tools\n` +
        `   💰 120,000 MMK (-46%)\n` +
        `   📅 1 month\n` +
        `   /buy_1\n\n` +
        `2️⃣ *Canva Pro* - Photo Editing\n` +
        `   💰 8,000 MMK (-25%)\n` +
        `   📅 1 month\n` +
        `   /buy_2\n\n` +
        `3️⃣ *Express VPN* - VPNs\n` +
        `   💰 5,000 MMK (-30%)\n` +
        `   📅 1 month\n` +
        `   /buy_3\n\n` +
        `4️⃣ *Adobe Premiere Pro* - Video Editing\n` +
        `   💰 15,000 MMK (-40%)\n` +
        `   📅 1 month\n` +
        `   /buy_4\n\n` +
        `5️⃣ *YouTube Premium* - Others\n` +
        `   💰 6,000 MMK (-20%)\n` +
        `   📅 1 month\n` +
        `   /buy_5\n\n` +
        `📌 ပစ္စည်းကို ဝယ်ယူရန် /buy_[နံပါတ်] ကိုနှိပ်ပါ။`,
        { parse_mode: 'Markdown' }
    );
});

// ============================================
// /discounts Command (လျှော့စျေးရှိတဲ့ပစ္စည်းများ)
// ============================================
bot.command('discounts', (ctx) => {
    console.log(`🔥 Discounts list requested by ${ctx.from.id}`);
    
    ctx.reply(
        `🔥 **လျှော့စျေးရှိတဲ့ပစ္စည်းများ**\n\n` +
        `• *ChatGPT Plus* - 120,000 → 64,800 MMK (-46%)\n` +
        `• *Canva Pro* - 8,000 → 6,000 MMK (-25%)\n` +
        `• *Express VPN* - 5,000 → 3,500 MMK (-30%)\n` +
        `• *Adobe Premiere Pro* - 15,000 → 9,000 MMK (-40%)\n` +
        `• *YouTube Premium* - 6,000 → 4,800 MMK (-20%)\n\n` +
        `/products - အကုန်ကြည့်ရန်`,
        { parse_mode: 'Markdown' }
    );
});

// ============================================
// /categories Command
// ============================================
bot.command('categories', (ctx) => {
    console.log(`📁 Categories list requested by ${ctx.from.id}`);
    
    ctx.reply(
        `📁 **အမျိုးအစားများ**\n\n` +
        `🎨 *AI Tools* - ChatGPT Plus\n` +
        `📸 *Photo Editing* - Canva Pro\n` +
        `🎬 *Video Editing* - Adobe Premiere Pro\n` +
        `🔒 *VPNs* - Express VPN\n` +
        `📺 *Others* - YouTube Premium\n\n` +
        `📌 အမျိုးအစားတစ်ခုကို ရွေးရန်:\n` +
        `/cat_AI Tools\n` +
        `/cat_Photo Editing\n` +
        `/cat_Video Editing\n` +
        `/cat_VPNs\n` +
        `/cat_Others`,
        { parse_mode: 'Markdown' }
    );
});

// ============================================
// /cat_[Category Name] Command
// ============================================
bot.command(/cat_(.+)/, (ctx) => {
    const category = ctx.match[1];
    console.log(`📁 Category "${category}" requested by ${ctx.from.id}`);
    
    let replyText = '';
    
    switch(category) {
        case 'AI Tools':
            replyText = `🎨 *AI Tools*\n\n• ChatGPT Plus - 120,000 MMK (-46%)\n  /buy_1`;
            break;
        case 'Photo Editing':
            replyText = `📸 *Photo Editing*\n\n• Canva Pro - 8,000 MMK (-25%)\n  /buy_2`;
            break;
        case 'Video Editing':
            replyText = `🎬 *Video Editing*\n\n• Adobe Premiere Pro - 15,000 MMK (-40%)\n  /buy_4`;
            break;
        case 'VPNs':
            replyText = `🔒 *VPNs*\n\n• Express VPN - 5,000 MMK (-30%)\n  /buy_3`;
            break;
        case 'Others':
            replyText = `📺 *Others*\n\n• YouTube Premium - 6,000 MMK (-20%)\n  /buy_5`;
            break;
        default:
            replyText = `❌ အမျိုးအစား "${category}" မတွေ့ပါ။ /categories ကိုကြည့်ပါ။`;
    }
    
    ctx.reply(replyText, { parse_mode: 'Markdown' });
});

// ============================================
// /promo Command
// ============================================
bot.command('promo', (ctx) => {
    ctx.reply(
        `🎫 **Promo Code**\n\n` +
        `သင့်မှာ Promo Code ရှိရင် အောက်ပါအတိုင်း ရိုက်ထည့်ပါ။\n\n` +
        `/apply သင့်_code\n\n` +
        `ဥပမာ: /apply HUBBY10\n\n` +
        `✅ ပထမဆုံးဝယ်ယူမှုအတွက် Discount ရပါမယ်။`,
        { parse_mode: 'Markdown' }
    );
});

// ============================================
// /apply [code] Command
// ============================================
bot.command('apply', (ctx) => {
    const code = ctx.message.text.split(' ')[1];
    
    if (!code) {
        ctx.reply('❌ Promo Code ထည့်ပေးပါ။ ဥပမာ: /apply HUBBY10');
        return;
    }
    
    console.log(`🎫 Promo code "${code}" applied by user ${ctx.from.id}`);
    
    // နမူနာ Promo Codes
    const validCodes = ['HUBBY10', 'HUBBY20', 'WELCOME', 'FIRSTBUY'];
    
    if (validCodes.includes(code.toUpperCase())) {
        let discount = 10;
        if (code.toUpperCase() === 'HUBBY20') discount = 20;
        if (code.toUpperCase() === 'WELCOME') discount = 15;
        if (code.toUpperCase() === 'FIRSTBUY') discount = 25;
        
        ctx.reply(
            `✅ Promo Code *${code.toUpperCase()}* အောင်မြင်ပါပြီ!\n\n` +
            `🎉 ပထမဆုံးဝယ်ယူမှုအတွက် *${discount}% Discount* ရရှိမှာပါ။\n\n` +
            `/products - စတင်ဝယ်ယူရန်`,
            { parse_mode: 'Markdown' }
        );
    } else {
        ctx.reply(
            `❌ Promo Code *${code}* မမှန်ကန်ပါ။\n\n` +
            `ထပ်မံကြိုးစားပါ။ /promo`,
            { parse_mode: 'Markdown' }
        );
    }
});

// ============================================
// /buy_[id] Command
// ============================================
bot.command(/buy_(\d+)/, (ctx) => {
    const productId = parseInt(ctx.match[1]);
    console.log(`🛒 User ${ctx.from.id} wants to buy product ID: ${productId}`);
    
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
            ctx.reply('❌ ပစ္စည်းမတွေ့ပါ။ /products ကိုကြည့်ပါ။');
            return;
    }
    
    const finalPrice = price - (price * discount / 100);
    
    ctx.reply(
        `🛒 *${productName}* ဝယ်ယူရန်\n\n` +
        `📅 Duration: 1 month\n` +
        `💰 ဈေး: ${finalPrice.toLocaleString()} MMK\n` +
        `🏷️ လျှော့စျေး: -${discount}%\n\n` +
        `💳 **ငွေပေးချေရန်:**\n` +
        `• KBZ Bank: 0987654321 (William)\n` +
        `• WavePay: 09798268154\n\n` +
        `📸 Payment Proof ကို @will815 သို့ပို့ပါ။\n` +
        `📌 Order ID: #${Date.now()}\n\n` +
        `✅ ငွေလွှဲပြီးပါက Order ID နဲ့တကွ ပုံအထောက်အထား ပို့ပေးပါ။`,
        { parse_mode: 'Markdown' }
    );
});

// ============================================
// Unknown Command အတွက်
// ============================================
bot.on('text', (ctx) => {
    const text = ctx.message.text;
    if (!text.startsWith('/')) {
        ctx.reply(
            `❓ နားမလည်ပါ။\n\n` +
            `/start - စတင်ရန်\n` +
            `/help - အကူအညီ\n` +
            `/products - ပစ္စည်းများကြည့်ရန်`,
            { parse_mode: 'Markdown' }
        );
    }
});

// ============================================
// Bot ကို Launch လုပ်ခြင်း
// ============================================
bot.launch()
    .then(() => {
        console.log('========================================');
        console.log('✅ SUCCESS! Bot is running!');
        console.log('🤖 Bot: @digitalhub_official_bot');
        console.log('========================================');
    })
    .catch((err) => {
        console.error('========================================');
        console.error('❌ ERROR: Bot launch failed!');
        console.error('Error details:', err);
        console.error('========================================');
        process.exit(1);
    });

// ============================================
// Graceful shutdown
// ============================================
process.once('SIGINT', () => {
    console.log('🛑 Bot stopping (SIGINT)...');
    bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
    console.log('🛑 Bot stopping (SIGTERM)...');
    bot.stop('SIGTERM');
});

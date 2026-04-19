const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 1379973354; // Your Telegram ID

// ============================================
// DATA STORAGE
// ============================================
const users = new Map();
const pendingOrders = new Map();
let orderCounter = 1000;

// Announcement session
let announceSession = {
    active: false,
    targets: [],
    message: '',
    photo: null,
    step: null // 'target', 'message'
};

// Products Data
const products = [
    { id: 1, name: 'ChatGPT Plus', category: 'AI Tools', price: 120000, discount: 46, duration: '1 month', logo: '🤖' },
    { id: 2, name: 'Canva Pro', category: 'Photo Editing', price: 8000, discount: 25, duration: '1 month', logo: '🎨' },
    { id: 3, name: 'Express VPN', category: 'VPNs', price: 5000, discount: 30, duration: '1 month', logo: '🔒' },
    { id: 4, name: 'Adobe Premiere Pro', category: 'Video Editing', price: 15000, discount: 40, duration: '1 month', logo: '🎬' },
    { id: 5, name: 'YouTube Premium', category: 'Others', price: 6000, discount: 20, duration: '1 month', logo: '📺' }
];

console.log('========================================');
console.log('🤖 Digital Hub Bot Running');
console.log(`👑 Admin ID: ${ADMIN_ID}`);
console.log('========================================');

const bot = new Telegraf(BOT_TOKEN);

// ============================================
// HELPERS
// ============================================
function getFinalPrice(product) {
    return product.price - (product.price * product.discount / 100);
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
    [Markup.button.callback('◀️ Back', 'back_main')]
]);

const adminMenu = Markup.inlineKeyboard([
    [Markup.button.callback('👥 Show Users', 'admin_users')],
    [Markup.button.callback('📢 Announcement', 'admin_announce')],
    [Markup.button.callback('📊 Stats', 'admin_stats')],
    [Markup.button.callback('🧪 Test', 'admin_test')]
]);

// ============================================
// START COMMAND
// ============================================
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;
    
    if (!users.has(userId)) {
        users.set(userId, { username, firstName, joined: new Date().toISOString() });
        console.log(`✅ New user: ${userId} (@${username})`);
    }
    
    if (userId === ADMIN_ID) {
        await ctx.reply(
            `🔧 <b>Admin Panel</b>\n\nWelcome back, ${firstName}!\nUsers: ${users.size}`,
            { parse_mode: 'HTML', ...adminMenu }
        );
    } else {
        await ctx.reply(
            `🎉 <b>Welcome to Digital Hub Store!</b>\n\nHello ${firstName}!\n\nUse the buttons below to browse products.`,
            { parse_mode: 'HTML', ...mainMenu }
        );
    }
});

// ============================================
// MAIN MENU HANDLERS
// ============================================
bot.action('menu_products', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('<b>🛍️ Our Products</b>\n\nSelect a product:', { parse_mode: 'HTML', ...productsKeyboard });
});

bot.action('menu_discounts', async (ctx) => {
    await ctx.answerCbQuery();
    let msg = '<b>🔥 Discounted Products</b>\n\n';
    for (const p of products) {
        msg += `${p.logo} <b>${p.name}</b>\n   ${p.price.toLocaleString()} → ${getFinalPrice(p).toLocaleString()} MMK (-${p.discount}%)\n\n`;
    }
    await ctx.editMessageText(msg, { parse_mode: 'HTML', ...productsKeyboard });
});

bot.action('menu_categories', async (ctx) => {
    await ctx.answerCbQuery();
    const cats = [...new Set(products.map(p => p.category))];
    let msg = '<b>📁 Categories</b>\n\n';
    cats.forEach(c => { msg += `• ${c}\n`; });
    await ctx.editMessageText(msg, { parse_mode: 'HTML', ...productsKeyboard });
});

bot.action('menu_promo', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '<b>🎫 Promo Code</b>\n\nUse /apply CODE\n\nAvailable: HUBBY10, HUBBY20, WELCOME, FIRSTBUY',
        { parse_mode: 'HTML' }
    );
});

bot.action('menu_contact', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        '<b>📞 Contact</b>\n\nTelegram: @will815\n\n<b>💳 Payment</b>\n• KBZ: 0987654321\n• WavePay: 09798268154',
        { parse_mode: 'HTML' }
    );
});

bot.action('back_main', async (ctx) => {
    await ctx.answerCbQuery();
    if (ctx.from.id === ADMIN_ID) {
        await ctx.editMessageText('🔧 Admin Panel', { parse_mode: 'HTML', ...adminMenu });
    } else {
        await ctx.editMessageText('🏠 Main Menu', { parse_mode: 'HTML', ...mainMenu });
    }
});

// ============================================
// PURCHASE HANDLERS
// ============================================
bot.action(/buy_(\d+)/, async (ctx) => {
    const productId = parseInt(ctx.match[1]);
    await ctx.answerCbQuery();
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const finalPrice = getFinalPrice(product);
    const orderId = ++orderCounter;
    
    pendingOrders.set(orderId, {
        userId: ctx.from.id,
        username: ctx.from.username,
        product: product.name,
        price: finalPrice,
        status: 'pending'
    });
    
    const buyKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ I HAVE PAID', `paid_${orderId}`)],
        [Markup.button.callback('◀️ Back', 'menu_products')]
    ]);
    
    await ctx.editMessageText(
        `<b>🛒 Order Summary</b>\n\n` +
        `<b>Product:</b> ${product.name}\n` +
        `<b>Duration:</b> ${product.duration}\n` +
        `<b>Original:</b> ${product.price.toLocaleString()} MMK\n` +
        `<b>Discount:</b> -${product.discount}%\n` +
        `<b>Final:</b> ${finalPrice.toLocaleString()} MMK\n\n` +
        `<b>Order ID:</b> #${orderId}\n\n` +
        `<b>💳 Payment:</b>\n• KBZ: 0987654321\n• WavePay: 09798268154\n\n` +
        `<i>Click "I HAVE PAID" after payment and send your proof.</i>`,
        { parse_mode: 'HTML', ...buyKeyboard }
    );
});

bot.action(/paid_(\d+)/, async (ctx) => {
    const orderId = parseInt(ctx.match[1]);
    await ctx.answerCbQuery();
    
    const order = pendingOrders.get(orderId);
    if (!order || order.userId !== ctx.from.id) {
        await ctx.reply('❌ Order not found.');
        return;
    }
    
    pendingOrders.set(orderId, { ...order, status: 'waiting_proof' });
    
    await ctx.reply(
        `<b>📸 Send Payment Proof</b>\n\n` +
        `Order ID: #${orderId}\n` +
        `Amount: ${order.price.toLocaleString()} MMK\n\n` +
        `Please send a screenshot of your payment.`,
        { parse_mode: 'HTML' }
    );
});

// ============================================
// PAYMENT PROOF HANDLER
// ============================================
bot.on('photo', async (ctx) => {
    let orderId = null;
    let order = null;
    
    for (const [id, o] of pendingOrders) {
        if (o.userId === ctx.from.id && o.status === 'waiting_proof') {
            orderId = id;
            order = o;
            break;
        }
    }
    
    if (!order) return;
    
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    pendingOrders.set(orderId, { ...order, status: 'proof_submitted', proofId: photo.file_id });
    
    // Send to admin
    const adminKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Confirm', `confirm_${orderId}`)],
        [Markup.button.callback('❌ Cancel', `cancel_${orderId}`)]
    ]);
    
    await bot.telegram.sendPhoto(ADMIN_ID, photo.file_id, {
        caption: `🆕 ORDER #${orderId}\n\n👤 @${order.username || 'N/A'}\n🛍️ ${order.product}\n💰 ${order.price.toLocaleString()} MMK`,
        ...adminKeyboard
    });
    
    await ctx.reply(`✅ Payment proof received! Order #${orderId}\n\n⏳ Admin will confirm soon.`);
});

// ============================================
// ADMIN ORDER HANDLERS
// ============================================
bot.action(/confirm_(\d+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    const orderId = parseInt(ctx.match[1]);
    const order = pendingOrders.get(orderId);
    
    if (!order) {
        await ctx.reply('Order not found');
        return;
    }
    
    pendingOrders.set(orderId, { ...order, status: 'confirmed' });
    
    await bot.telegram.sendMessage(
        order.userId,
        `<b>✅ ORDER #${orderId} CONFIRMED!</b>\n\nProduct: ${order.product}\n\nThank you for shopping with Digital Hub!`,
        { parse_mode: 'HTML' }
    );
    
    await ctx.editMessageCaption(`✅ ORDER #${orderId} CONFIRMED! Customer notified.`);
});

bot.action(/cancel_(\d+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    const orderId = parseInt(ctx.match[1]);
    const order = pendingOrders.get(orderId);
    
    if (order) {
        await bot.telegram.sendMessage(
            order.userId,
            `<b>❌ ORDER #${orderId} CANCELLED</b>\n\nPlease contact support @will815.`,
            { parse_mode: 'HTML' }
        );
    }
    
    pendingOrders.delete(orderId);
    await ctx.editMessageCaption(`❌ ORDER #${orderId} CANCELLED.`);
});

// ============================================
// ADMIN COMMANDS & BUTTONS
// ============================================
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
    
    let msg = `👥 USERS (${users.size})\n\n`;
    let i = 1;
    for (const [id, data] of users) {
        msg += `${i}. ${data.firstName} (@${data.username || 'no username'})\n   ID: ${id}\n\n`;
        i++;
    }
    await ctx.reply(msg);
});

bot.action('admin_stats', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    const totalOrders = pendingOrders.size;
    const confirmed = Array.from(pendingOrders.values()).filter(o => o.status === 'confirmed').length;
    
    await ctx.reply(
        `<b>📊 STATISTICS</b>\n\n` +
        `Users: ${users.size}\n` +
        `Orders: ${totalOrders}\n` +
        `Confirmed: ${confirmed}\n` +
        `Pending: ${totalOrders - confirmed}`,
        { parse_mode: 'HTML' }
    );
});

bot.action('admin_test', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    await ctx.reply('✅ Bot is working!');
});

// ============================================
// ANNOUNCEMENT SYSTEM
// ============================================
bot.action('admin_announce', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    announceSession = { active: true, targets: [], message: '', photo: null, step: 'target' };
    
    const targetKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📢 ALL USERS', 'announce_all')],
        [Markup.button.callback('✏️ SPECIFIC', 'announce_specific')],
        [Markup.button.callback('❌ Cancel', 'announce_cancel_btn')]
    ]);
    
    await ctx.editMessageText(
        `📢 <b>Send Announcement</b>\n\nWho should receive it?\n\nAll Users: ${users.size} people`,
        { parse_mode: 'HTML', ...targetKeyboard }
    );
});

bot.action('announce_all', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    await ctx.answerCbQuery();
    
    announceSession.targets = Array.from(users.keys());
    announceSession.step = 'message';
    
    await ctx.editMessageText(
        `📢 <b>Target: ALL ${announceSession.targets.length} USERS</b>\n\nSend me your announcement message (text or photo with caption).\n\nType /cancel to abort.`,
        { parse_mode: 'HTML' }
    );
});

bot.action('announce_specific', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    await ctx.answerCbQuery();
    
    announceSession.step = 'usernames';
    
    await ctx.editMessageText(
        `📢 <b>Send usernames</b>\n\nSend one username per line:\n\n@user1\n@user2\n@user3\n\nType /cancel to abort.`,
        { parse_mode: 'HTML' }
    );
});

bot.action('announce_cancel_btn', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    await ctx.answerCbQuery();
    
    announceSession = { active: false, targets: [], message: '', photo: null, step: null };
    await ctx.editMessageText('❌ Announcement cancelled.', { parse_mode: 'HTML' });
});

// Handle announcement text input
bot.on('text', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    if (!announceSession.active) return;
    if (ctx.message.text === '/cancel') {
        announceSession = { active: false, targets: [], message: '', photo: null, step: null };
        await ctx.reply('❌ Cancelled.');
        return;
    }
    
    // Step: receiving usernames
    if (announceSession.step === 'usernames') {
        const lines = ctx.message.text.split('\n');
        const found = [];
        
        for (const line of lines) {
            const match = line.match(/@(\w+)/);
            if (match) {
                const username = match[1];
                for (const [id, data] of users) {
                    if (data.username === username) {
                        found.push(id);
                        break;
                    }
                }
            }
        }
        
        if (found.length === 0) {
            await ctx.reply('❌ No valid users found. Try again or /cancel');
            return;
        }
        
        announceSession.targets = found;
        announceSession.step = 'message';
        await ctx.reply(`✅ Target: ${found.length} users\n\nNow send your announcement message.`);
        return;
    }
    
    // Step: receiving message
    if (announceSession.step === 'message' && announceSession.targets.length > 0) {
        announceSession.message = ctx.message.text;
        
        const confirmKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('✅ SEND NOW', 'announce_send_msg')],
            [Markup.button.callback('❌ Cancel', 'announce_cancel_btn')]
        ]);
        
        await ctx.reply(
            `📢 <b>Preview</b>\n\nTarget: ${announceSession.targets.length} users\n\nMessage:\n━━━━━━━━━━━━━━━━━━━━━\n${announceSession.message}\n━━━━━━━━━━━━━━━━━━━━━\n\nSend?`,
            { parse_mode: 'HTML', ...confirmKeyboard }
        );
    }
});

// Handle announcement photo
bot.on('photo', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    if (!announceSession.active) return;
    if (announceSession.step !== 'message') return;
    if (announceSession.targets.length === 0) return;
    
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    announceSession.photo = photo.file_id;
    announceSession.message = ctx.message.caption || '';
    
    const confirmKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ SEND NOW', 'announce_send_msg')],
        [Markup.button.callback('❌ Cancel', 'announce_cancel_btn')]
    ]);
    
    await ctx.reply(
        `📢 <b>Preview</b>\n\nTarget: ${announceSession.targets.length} users\n\nPhoto + Caption: ${announceSession.message || '(no caption)'}\n\nSend?`,
        { parse_mode: 'HTML', ...confirmKeyboard }
    );
});

// Send announcement
bot.action('announce_send_msg', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    let sent = 0;
    let failed = 0;
    
    await ctx.editMessageText(`📢 Sending to ${announceSession.targets.length} users...`);
    
    for (const userId of announceSession.targets) {
        try {
            if (announceSession.photo) {
                await bot.telegram.sendPhoto(userId, announceSession.photo, {
                    caption: announceSession.message,
                    parse_mode: 'HTML'
                });
            } else {
                await bot.telegram.sendMessage(userId, announceSession.message, { parse_mode: 'HTML' });
            }
            sent++;
        } catch (err) {
            failed++;
        }
        await new Promise(r => setTimeout(r, 50));
    }
    
    await ctx.reply(`✅ Sent!\n\nSent: ${sent}\nFailed: ${failed}`);
    
    // Reset
    announceSession = { active: false, targets: [], message: '', photo: null, step: null };
});

// ============================================
// PROMO CODE
// ============================================
bot.command('apply', (ctx) => {
    const code = ctx.message.text.split(' ')[1];
    if (!code) {
        ctx.reply('Usage: /apply CODE\n\nAvailable: HUBBY10, HUBBY20, WELCOME, FIRSTBUY');
        return;
    }
    
    const valid = ['HUBBY10', 'HUBBY20', 'WELCOME', 'FIRSTBUY'];
    if (valid.includes(code.toUpperCase())) {
        ctx.reply(`✅ Promo code ${code.toUpperCase()} applied! You get discount on first purchase.`, { parse_mode: 'HTML', ...mainMenu });
    } else {
        ctx.reply(`❌ Invalid code: ${code}`);
    }
});

// ============================================
// CANCEL COMMAND
// ============================================
bot.command('cancel', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    announceSession = { active: false, targets: [], message: '', photo: null, step: null };
    ctx.reply('❌ Cancelled.');
});

// ============================================
// TEST COMMAND
// ============================================
bot.command('test', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        ctx.reply('Not available');
        return;
    }
    ctx.reply('✅ Bot is working!');
});

// ============================================
// LAUNCH
// ============================================
bot.launch()
    .then(() => {
        console.log('========================================');
        console.log('✅ BOT RUNNING!');
        console.log('========================================');
    })
    .catch(err => console.error('Error:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

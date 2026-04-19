const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 1379973354;

// File paths
const USERS_FILE = path.join(__dirname, 'users.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// ============================================
// PERSISTENT STORAGE
// ============================================
function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            const parsed = JSON.parse(data);
            const usersMap = new Map();
            for (const [key, value] of Object.entries(parsed)) {
                usersMap.set(parseInt(key), value);
            }
            console.log(`✅ Loaded ${usersMap.size} users`);
            return usersMap;
        }
    } catch (err) {}
    return new Map();
}

function saveUsers(usersMap) {
    try {
        const obj = Object.fromEntries(usersMap);
        fs.writeFileSync(USERS_FILE, JSON.stringify(obj, null, 2));
        console.log(`✅ Saved ${usersMap.size} users`);
    } catch (err) {}
}

function loadOrders() {
    try {
        if (fs.existsSync(ORDERS_FILE)) {
            const data = fs.readFileSync(ORDERS_FILE, 'utf8');
            const parsed = JSON.parse(data);
            const ordersMap = new Map();
            for (const [key, value] of Object.entries(parsed)) {
                ordersMap.set(parseInt(key), value);
            }
            console.log(`✅ Loaded ${ordersMap.size} orders`);
            return ordersMap;
        }
    } catch (err) {}
    return new Map();
}

function saveOrders(ordersMap) {
    try {
        const obj = Object.fromEntries(ordersMap);
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(obj, null, 2));
    } catch (err) {}
}

// ============================================
// INITIALIZE
// ============================================
const users = loadUsers();
const pendingOrders = loadOrders();
let orderCounter = 1000;

if (pendingOrders.size > 0) {
    const maxId = Math.max(...Array.from(pendingOrders.keys()));
    orderCounter = maxId + 1;
}

// Announcement session
let announceSession = {
    active: false,
    targets: [],
    message: '',
    photo: null,
    step: null,
    waitingForConfirmation: false
};

// Import session
let importMode = false;
let importList = [];

const products = [
    { id: 1, name: 'ChatGPT Plus', category: 'AI Tools', price: 120000, discount: 46, duration: '1 month', logo: '🤖' },
    { id: 2, name: 'Canva Pro', category: 'Photo Editing', price: 8000, discount: 25, duration: '1 month', logo: '🎨' },
    { id: 3, name: 'Express VPN', category: 'VPNs', price: 5000, discount: 30, duration: '1 month', logo: '🔒' },
    { id: 4, name: 'Adobe Premiere Pro', category: 'Video Editing', price: 15000, discount: 40, duration: '1 month', logo: '🎬' },
    { id: 5, name: 'YouTube Premium', category: 'Others', price: 6000, discount: 20, duration: '1 month', logo: '📺' }
];

console.log('========================================');
console.log('🤖 Digital Hub Bot Starting...');
console.log(`👑 Admin ID: ${ADMIN_ID}`);
console.log(`📊 Users in DB: ${users.size}`);
console.log('========================================');

const bot = new Telegraf(BOT_TOKEN);
bot.telegram.deleteWebhook().catch(() => {});

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
    [Markup.button.callback('➕ Import Users', 'admin_import')],
    [Markup.button.callback('📤 Export Users', 'admin_export')],
    [Markup.button.callback('🧪 Test', 'admin_test')]
]);

// ============================================
// NEW USER NOTIFICATION TO ADMIN
// ============================================
async function notifyAdminNewUser(userId, username, firstName) {
    const format = `<code>${username || 'no_username'} | ${userId}</code>`;
    const message = 
        `🆕 <b>NEW USER JOINED</b>\n\n` +
        `${format}\n\n` +
        `<b>Name:</b> ${firstName}\n` +
        `<b>Total Users:</b> ${users.size}\n\n` +
        `<i>Copy the line above to add to your sheet.</i>`;
    
    await bot.telegram.sendMessage(ADMIN_ID, message, { parse_mode: 'HTML' });
}

// ============================================
// START COMMAND
// ============================================
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;
    
    const isNewUser = !users.has(userId);
    
    if (isNewUser) {
        users.set(userId, { 
            username: username, 
            firstName: firstName, 
            joined: new Date().toISOString(),
            lastActive: new Date().toISOString()
        });
        saveUsers(users);
        console.log(`✅ New user: ${userId} (@${username})`);
        
        // Send notification to admin
        await notifyAdminNewUser(userId, username, firstName);
    } else {
        // Update last active and username (in case username changed)
        const existing = users.get(userId);
        users.set(userId, { 
            ...existing,
            username: username, 
            firstName: firstName,
            lastActive: new Date().toISOString()
        });
        saveUsers(users);
    }
    
    if (userId === ADMIN_ID) {
        await ctx.reply(
            `🔧 <b>Admin Panel</b>\n\nWelcome back!\n👥 Users: ${users.size}\n📦 Orders: ${pendingOrders.size}`,
            { parse_mode: 'HTML', ...adminMenu }
        );
    } else {
        await ctx.reply(
            `🎉 <b>Welcome to Digital Hub Store!</b>\n\nHello ${firstName}!\n\nUse the buttons below.`,
            { parse_mode: 'HTML', ...mainMenu }
        );
    }
});

// ============================================
// IMPORT USERS (Username | ID format)
// ============================================
bot.action('admin_import', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    importMode = true;
    
    await ctx.editMessageText(
        `<b>➕ IMPORT USERS</b>\n\n` +
        `Send me user data in this format (one per line):\n\n` +
        `<code>@username | 123456789</code>\n` +
        `<code>john_doe | 987654321</code>\n\n` +
        `Or just user IDs:\n\n` +
        `<code>123456789</code>\n` +
        `<code>987654321</code>\n\n` +
        `Type /cancel to abort.`,
        { parse_mode: 'HTML' }
    );
});

// Handle import input
bot.on('text', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    
    // Handle import mode
    if (importMode) {
        if (ctx.message.text === '/cancel') {
            importMode = false;
            await ctx.reply('❌ Import cancelled.', { parse_mode: 'HTML', ...adminMenu });
            return;
        }
        
        const lines = ctx.message.text.split('\n');
        let added = 0;
        let updated = 0;
        let invalid = 0;
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            let userId = null;
            let username = null;
            
            // Check format: "username | id" or "id"
            if (trimmed.includes('|')) {
                const parts = trimmed.split('|');
                const userPart = parts[0].trim();
                const idPart = parts[1].trim();
                
                // Extract username (remove @ if present)
                username = userPart.replace(/^@/, '');
                
                // Extract ID
                if (/^\d+$/.test(idPart)) {
                    userId = parseInt(idPart);
                }
            } else if (/^\d+$/.test(trimmed)) {
                userId = parseInt(trimmed);
                username = `user_${userId}`;
            }
            
            if (userId && !isNaN(userId)) {
                if (!users.has(userId)) {
                    users.set(userId, {
                        username: username,
                        firstName: `Imported_${userId}`,
                        joined: new Date().toISOString(),
                        imported: true
                    });
                    added++;
                } else {
                    // Update username if provided
                    if (username) {
                        const existing = users.get(userId);
                        users.set(userId, { ...existing, username: username });
                        updated++;
                    }
                }
            } else {
                invalid++;
            }
        }
        
        saveUsers(users);
        importMode = false;
        
        await ctx.reply(
            `<b>✅ Import Complete!</b>\n\n` +
            `Added: ${added} new users\n` +
            `Updated: ${updated} users\n` +
            `Invalid: ${invalid} lines\n\n` +
            `Total users now: ${users.size}`,
            { parse_mode: 'HTML', ...adminMenu }
        );
        return;
    }
    
    // Regular text handling for announcements
    if (!announceSession.active) return;
    if (ctx.message.text === '/cancel') {
        announceSession = { active: false, targets: [], message: '', photo: null, step: null, waitingForConfirmation: false };
        await ctx.reply('❌ Cancelled.');
        return;
    }
    
    // Handle announcement steps...
    if (announceSession.step === 'usernames') {
        const lines = ctx.message.text.split('\n');
        const found = [];
        const notFound = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            let userId = null;
            
            // Check if it's an ID directly
            if (/^\d+$/.test(trimmed)) {
                userId = parseInt(trimmed);
                if (users.has(userId)) {
                    found.push(userId);
                } else {
                    notFound.push(`ID: ${trimmed}`);
                }
            }
            // Check if it's username format
            else {
                const username = trimmed.replace(/^@/, '');
                for (const [id, data] of users) {
                    if (data.username === username) {
                        found.push(id);
                        break;
                    }
                }
                notFound.push(`@${username}`);
            }
        }
        
        if (found.length === 0) {
            await ctx.reply(`❌ No valid users found.\n\nUse /import to add users first.\n\nTry again or /cancel`);
            return;
        }
        
        announceSession.targets = found;
        announceSession.step = 'media';
        
        let reply = `✅ Target: ${found.length} users\n\n`;
        if (notFound.length > 0 && notFound.length <= 10) {
            reply += `⚠️ Not found: ${notFound.join(', ')}\n\n`;
        } else if (notFound.length > 10) {
            reply += `⚠️ ${notFound.length} users not found\n\n`;
        }
        reply += `Now send your announcement (text or photo with caption).`;
        
        await ctx.reply(reply);
        return;
    }
    
    if (announceSession.step === 'media' && announceSession.targets.length > 0 && !announceSession.waitingForConfirmation) {
        announceSession.message = ctx.message.text;
        announceSession.photo = null;
        announceSession.waitingForConfirmation = true;
        
        const confirmKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('✅ SEND NOW', 'announce_send_msg')],
            [Markup.button.callback('❌ Cancel', 'announce_cancel_btn')]
        ]);
        
        await ctx.reply(
            `📢 <b>Preview</b>\n\n` +
            `<b>Target:</b> ${announceSession.targets.length} users\n\n` +
            `<b>Message:</b>\n━━━━━━━━━━━━━━━━━━━━━\n${announceSession.message}\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Send now?`,
            { parse_mode: 'HTML', ...confirmKeyboard }
        );
    }
});

// ============================================
// EXPORT USERS
// ============================================
bot.action('admin_export', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    if (users.size === 0) {
        await ctx.editMessageText('❌ No users to export.');
        return;
    }
    
    let exportText = '';
    for (const [id, data] of users) {
        const username = data.username || 'no_username';
        exportText += `${username} | ${id}\n`;
    }
    
    // Send as file
    try {
        const tempFile = path.join(__dirname, 'export_users.txt');
        fs.writeFileSync(tempFile, exportText, 'utf8');
        await ctx.replyWithDocument({ source: tempFile }, { caption: `📤 Exported ${users.size} users` });
        fs.unlinkSync(tempFile);
    } catch (err) {
        await ctx.reply(exportText);
    }
});

// ============================================
// MENU HANDLERS
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
    const orderId = orderCounter++;
    
    pendingOrders.set(orderId, {
        userId: ctx.from.id,
        username: ctx.from.username,
        product: product.name,
        price: finalPrice,
        status: 'pending',
        createdAt: new Date().toISOString()
    });
    saveOrders(pendingOrders);
    
    const buyKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ I HAVE PAID', `paid_${orderId}`)],
        [Markup.button.callback('◀️ Back', 'menu_products')]
    ]);
    
    await ctx.editMessageText(
        `<b>🛒 Order Summary</b>\n\n` +
        `<b>Order ID:</b> #${orderId}\n` +
        `<b>Product:</b> ${product.name}\n` +
        `<b>Duration:</b> ${product.duration}\n` +
        `<b>Original:</b> ${product.price.toLocaleString()} MMK\n` +
        `<b>Discount:</b> -${product.discount}%\n` +
        `<b>Final:</b> ${finalPrice.toLocaleString()} MMK\n\n` +
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
    saveOrders(pendingOrders);
    
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
    saveOrders(pendingOrders);
    
    const adminKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Confirm', `confirm_${orderId}`)],
        [Markup.button.callback('❌ Cancel', `cancel_${orderId}`)]
    ]);
    
    await bot.telegram.sendPhoto(ADMIN_ID, photo.file_id, {
        caption: `🆕 ORDER #${orderId}\n\n👤 @${order.username || 'N/A'} | ${order.userId}\n🛍️ ${order.product}\n💰 ${order.price.toLocaleString()} MMK`,
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
    saveOrders(pendingOrders);
    
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
    saveOrders(pendingOrders);
    await ctx.editMessageCaption(`❌ ORDER #${orderId} CANCELLED.`);
});

// ============================================
// ADMIN BUTTONS
// ============================================
bot.action('admin_users', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    if (users.size === 0) {
        await ctx.reply('📊 No users in database.\n\nUsers appear when they send /start or you import them.');
        return;
    }
    
    let msg = `👥 <b>USER LIST</b> (${users.size} total)\n\n`;
    let i = 1;
    for (const [id, data] of users) {
        msg += `${i}. <code>${data.username || 'no_username'} | ${id}</code>\n`;
        i++;
        if (msg.length > 3000) {
            await ctx.reply(msg, { parse_mode: 'HTML' });
            msg = '';
        }
    }
    if (msg) await ctx.reply(msg, { parse_mode: 'HTML' });
});

bot.action('admin_stats', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    const confirmed = Array.from(pendingOrders.values()).filter(o => o.status === 'confirmed').length;
    
    await ctx.reply(
        `<b>📊 STATISTICS</b>\n\n` +
        `<b>Total Users:</b> ${users.size}\n` +
        `<b>Total Orders:</b> ${pendingOrders.size}\n` +
        `<b>Confirmed Orders:</b> ${confirmed}\n` +
        `<b>Pending Orders:</b> ${pendingOrders.size - confirmed}`,
        { parse_mode: 'HTML' }
    );
});

bot.action('admin_test', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    await ctx.reply(`✅ Bot is working!\n\nUsers: ${users.size}\nOrders: ${pendingOrders.size}`);
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
    
    announceSession = { 
        active: true, 
        targets: [], 
        message: '', 
        photo: null, 
        step: 'target',
        waitingForConfirmation: false 
    };
    
    const targetKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📢 ALL USERS', 'announce_all')],
        [Markup.button.callback('✏️ SPECIFIC USERS', 'announce_specific')],
        [Markup.button.callback('❌ Cancel', 'announce_cancel_btn')]
    ]);
    
    await ctx.editMessageText(
        `📢 <b>Send Announcement</b>\n\nWho should receive it?\n\n<b>All Users:</b> ${users.size} people`,
        { parse_mode: 'HTML', ...targetKeyboard }
    );
});

bot.action('announce_all', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    await ctx.answerCbQuery();
    
    if (users.size === 0) {
        await ctx.editMessageText('❌ No users. Use "Import Users" first.');
        announceSession.active = false;
        return;
    }
    
    announceSession.targets = Array.from(users.keys());
    announceSession.step = 'media';
    
    await ctx.editMessageText(
        `📢 <b>Target: ALL ${announceSession.targets.length} USERS</b>\n\n` +
        `Send your announcement (text or photo).\n\nType /cancel to abort.`,
        { parse_mode: 'HTML' }
    );
});

bot.action('announce_specific', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    await ctx.answerCbQuery();
    
    announceSession.step = 'usernames';
    
    await ctx.editMessageText(
        `📢 <b>Send user IDs or usernames</b>\n\nOne per line:\n\n` +
        `<code>123456789</code> (user ID)\n` +
        `<code>@username</code> (username)\n\n` +
        `Type /cancel to abort.`,
        { parse_mode: 'HTML' }
    );
});

bot.action('announce_cancel_btn', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    await ctx.answerCbQuery();
    
    announceSession = { active: false, targets: [], message: '', photo: null, step: null, waitingForConfirmation: false };
    await ctx.editMessageText('❌ Announcement cancelled.', { parse_mode: 'HTML' });
});

// Handle photo for announcement
bot.on('photo', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    if (!announceSession.active) return;
    if (announceSession.step !== 'media') return;
    if (announceSession.targets.length === 0) return;
    if (announceSession.waitingForConfirmation) return;
    
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    announceSession.photo = photo.file_id;
    announceSession.message = ctx.message.caption || '';
    announceSession.waitingForConfirmation = true;
    
    const confirmKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ SEND NOW', 'announce_send_msg')],
        [Markup.button.callback('❌ Cancel', 'announce_cancel_btn')]
    ]);
    
    let previewText = `📢 <b>Preview</b>\n\n<b>Target:</b> ${announceSession.targets.length} users\n\n`;
    if (announceSession.message) {
        previewText += `<b>Caption:</b>\n━━━━━━━━━━━━━━━━━━━━━\n${announceSession.message}\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }
    previewText += `Send now?`;
    
    await ctx.reply(previewText, { parse_mode: 'HTML', ...confirmKeyboard });
});

// Send announcement
bot.action('announce_send_msg', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('Admin only');
        return;
    }
    await ctx.answerCbQuery();
    
    if (!announceSession.targets.length || (!announceSession.message && !announceSession.photo)) {
        await ctx.reply('❌ No announcement to send.');
        announceSession = { active: false, targets: [], message: '', photo: null, step: null, waitingForConfirmation: false };
        return;
    }
    
    await ctx.editMessageText(`📢 <b>Sending to ${announceSession.targets.length} users...</b>`, { parse_mode: 'HTML' });
    
    let sent = 0;
    let failed = 0;
    
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
    
    await ctx.reply(
        `<b>✅ Announcement Sent!</b>\n\n` +
        `<b>Sent:</b> ${sent}\n` +
        `<b>Failed:</b> ${failed}\n\n` +
        `<b>Targeted:</b> ${announceSession.targets.length} users`,
        { parse_mode: 'HTML' }
    );
    
    announceSession = { active: false, targets: [], message: '', photo: null, step: null, waitingForConfirmation: false };
});

// ============================================
// CANCEL COMMAND
// ============================================
bot.command('cancel', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    importMode = false;
    announceSession = { active: false, targets: [], message: '', photo: null, step: null, waitingForConfirmation: false };
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
    ctx.reply(`✅ Bot working!\nUsers: ${users.size}\nOrders: ${pendingOrders.size}`);
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
        ctx.reply(`✅ Promo code ${code.toUpperCase()} applied!`, { parse_mode: 'HTML', ...mainMenu });
    } else {
        ctx.reply(`❌ Invalid code: ${code}`);
    }
});

// ============================================
// LAUNCH
// ============================================
bot.launch()
    .then(() => {
        console.log('========================================');
        console.log('✅ BOT RUNNING!');
        console.log(`📊 Users: ${users.size}`);
        console.log('========================================');
    })
    .catch(err => console.error('Error:', err));

process.once('SIGINT', () => {
    saveUsers(users);
    saveOrders(pendingOrders);
    bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
    saveUsers(users);
    saveOrders(pendingOrders);
    bot.stop('SIGTERM');
});

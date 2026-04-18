const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');

// မင်း Token ကို ဒီနေရာမှာ ထည့်
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';

const bot = new Telegraf(BOT_TOKEN);

// သိမ်းထားမယ့် Data (နောက်မှ Firebase ပြောင်းမယ်)
let products = [
  {
    id: 1,
    name: "ChatGPT Plus",
    category: "AI Tools",
    price: 120000,
    discount: 46,
    duration: "1 month"
  },
  {
    id: 2,
    name: "Canva Pro",
    category: "Photo Editing",
    price: 8000,
    discount: 25,
    duration: "1 month"
  },
  {
    id: 3,
    name: "Express VPN",
    category: "VPNs",
    price: 5000,
    discount: 30,
    duration: "1 month"
  },
  {
    id: 4,
    name: "Adobe Premiere Pro",
    category: "Video Editing",
    price: 15000,
    discount: 40,
    duration: "1 month"
  }
];

// /start command
bot.start((ctx) => {
  ctx.reply(
    `🎉 ကြိုဆိုပါတယ် ${ctx.from.first_name}!\n\n` +
    `Hubby Store မှ အကောင်းဆုံး Digital Products တွေကို ဈေးချိုချိုနဲ့ ဝယ်ယူနိုင်ပါတယ်။\n\n` +
    `📌 သုံးနိုင်တဲ့ Command တွေ:\n` +
    `/products - အကုန်ကြည့်မယ်\n` +
    `/categories - အမျိုးအစားအလိုက်ကြည့်မယ်\n` +
    `/discounts - လျှော့စျေးရှိတဲ့ပစ္စည်းများ\n` +
    `/new - အသစ်ထပ်ထည့်ထားတဲ့ပစ္စည်းများ\n` +
    `/promo - Promo Code ထည့်ရန်\n\n` +
    `💬 မေးစရာရှိရင် @william815 ကိုဆက်သွယ်ပါ။`
  );
});

// /products - အကုန်ပြမယ်
bot.command('products', (ctx) => {
  let message = `🛍️ အကုန်ပစ္စည်းများ (${products.length})\n━━━━━━━━━━━━━━━\n\n`;
  
  products.forEach((p, i) => {
    const finalPrice = p.price - (p.price * p.discount / 100);
    message += `${i+1}. *${p.name}*\n`;
    message += `   📅 ${p.duration}\n`;
    message += `   💰 ဈေး: ${finalPrice.toLocaleString()} MMK`;
    if (p.discount > 0) {
      message += ` (ဈေးကွက်ဈေး ${p.price.toLocaleString()} MMK, -${p.discount}%)\n`;
    } else {
      message += `\n`;
    }
    message += `   🏷️ ${p.category}\n\n`;
  });
  
  message += `━━━━━━━━━━━━━━━\n/buy_${products[0]?.id} - ဝယ်ယူရန်`;
  
  ctx.reply(message, { parse_mode: 'Markdown' });
});

// /categories - အမျိုးအစားအလိုက်
bot.command('categories', (ctx) => {
  const categories = [...new Set(products.map(p => p.category))];
  let message = `📁 အမျိုးအစားများ\n━━━━━━━━━━━━━━━\n\n`;
  
  categories.forEach((cat, i) => {
    const count = products.filter(p => p.category === cat).length;
    message += `${i+1}. ${cat} (${count})\n`;
  });
  
  message += `\n/cat_AI Tools - ဥပမာ\n/cat_VPNs - ဥပမာ`;
  ctx.reply(message);
});

// /discounts - လျှော့စျေးရှိတဲ့ပစ္စည်း
bot.command('discounts', (ctx) => {
  const discounted = products.filter(p => p.discount > 0);
  
  if (discounted.length === 0) {
    ctx.reply("😞 လက်ရှိ လျှော့စျေးရှိတဲ့ပစ္စည်း မရှိသေးပါဘူး။");
    return;
  }
  
  let message = `🔥 လျှော့စျေးရှိတဲ့ပစ္စည်းများ (${discounted.length})\n━━━━━━━━━━━━━━━\n\n`;
  
  discounted.forEach((p, i) => {
    const finalPrice = p.price - (p.price * p.discount / 100);
    message += `${i+1}. *${p.name}*\n`;
    message += `   💰 ${finalPrice.toLocaleString()} MMK (~~${p.price.toLocaleString()}~~ -${p.discount}%)\n`;
    message += `   🏷️ ${p.category}\n\n`;
  });
  
  ctx.reply(message, { parse_mode: 'Markdown' });
});

// /new - အသစ် (နမူနာအနေနဲ့)
bot.command('new', (ctx) => {
  ctx.reply(
    `🆕 အသစ်ထပ်ထည့်ထားတဲ့ပစ္စည်းများ\n\n` +
    `• *ChatGPT Plus* - 120,000 MMK (-46%)\n` +
    `• *Canva Pro* - 8,000 MMK (-25%)\n\n` +
    `/buy_1 - ဝယ်ယူရန်`,
    { parse_mode: 'Markdown' }
  );
});

// /promo - Promo Code ထည့်ရန်
bot.command('promo', (ctx) => {
  ctx.reply(
    `🎫 Promo Code ထည့်ရန်\n\n` +
    `သင့်မှာ Promo Code ရှိရင် အောက်ပါအတိုင်း ရိုက်ထည့်ပါ။\n\n` +
    `/apply CODE_HERE\n\n` +
    `ဥပမာ - /apply HUBBY10\n\n` +
    `✅ ပထမဆုံးဝယ်ယူမှုအတွက် Discount ရပါမယ်။`
  );
});

// /apply [code] - Promo Code လျှောက်ရန်
bot.command('apply', (ctx) => {
  const code = ctx.message.text.split(' ')[1];
  
  if (!code) {
    ctx.reply("❌ Promo Code ထည့်ပေးပါ။ ဥပမာ - /apply HUBBY10");
    return;
  }
  
  // နမူနာ Promo Code
  if (code.toUpperCase() === 'HUBBY10') {
    ctx.reply(
      `✅ Promo Code *${code}* အောင်မြင်ပါပြီ!\n\n` +
      `🎉 ပထမဆုံးဝယ်ယူမှုအတွက် *10% Discount* ရရှိမှာပါ။\n\n` +
      `/products - စတင်ဝယ်ယူရန်`,
      { parse_mode: 'Markdown' }
    );
  } else {
    ctx.reply(`❌ Promo Code *${code}* မမှန်ကန်ပါ။ ထပ်မံကြိုးစားပါ။`, { parse_mode: 'Markdown' });
  }
});

// /buy_[id] - ဝယ်ယူရန်
bot.command(/buy_(\d+)/, (ctx) => {
  const productId = parseInt(ctx.match[1]);
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    ctx.reply("❌ ပစ္စည်းမတွေ့ပါ။");
    return;
  }
  
  const finalPrice = product.price - (product.price * product.discount / 100);
  
  ctx.reply(
    `🛒 *${product.name}* ဝယ်ယူရန်\n\n` +
    `📅 ${product.duration}\n` +
    `💰 ဈေး: ${finalPrice.toLocaleString()} MMK\n` +
    (product.discount > 0 ? `🏷️ လျှော့စျေး: -${product.discount}%\n` : '') +
    `\n💳 ငွေပေးချေရန်:\n` +
    `• KBZ: 0987654321 (William)\n` +
    `• WavePay: 09798268154\n\n` +
    `📸 Payment Proof ကို @william815 သို့ပို့ပါ။\n` +
    `Order ID: #${Date.now()}`,
    { parse_mode: 'Markdown' }
  );
});

// Category လိုက်ပြမယ့် Handler (နမူနာ)
bot.command(/cat_(.+)/, (ctx) => {
  const category = ctx.match[1].replace(/_/g, ' ');
  const filtered = products.filter(p => p.category === category);
  
  if (filtered.length === 0) {
    ctx.reply(`📁 ${category} ထဲမှာ ပစ္စည်းမရှိသေးပါဘူး။`);
    return;
  }
  
  let message = `📁 *${category}* (${filtered.length})\n━━━━━━━━━━━━━━━\n\n`;
  
  filtered.forEach((p, i) => {
    const finalPrice = p.price - (p.price * p.discount / 100);
    message += `${i+1}. *${p.name}*\n`;
    message += `   💰 ${finalPrice.toLocaleString()} MMK`;
    if (p.discount > 0) message += ` (-${p.discount}%)`;
    message += `\n   /buy_${p.id}\n\n`;
  });
  
  ctx.reply(message, { parse_mode: 'Markdown' });
});

// Unknown command
bot.on(message('text'), (ctx) => {
  if (!ctx.message.text.startsWith('/')) {
    ctx.reply(
      `❓ နားမလည်ပါ။\n\n` +
      `/start - စတင်ရန်\n` +
      `/products - ပစ္စည်းများကြည့်ရန်`
    );
  }
});

// Bot စတင်ခြင်း
bot.launch()
  .then(() => console.log('🤖 Bot is running...'))
  .catch((err) => console.error('Bot error:', err));

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

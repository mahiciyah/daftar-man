// تحلیلگر پیامک‌های بانکی ایران (آفلاین، بدون هیچ سرویس خارجی)
const D1 = '۰۱۲۳۴۵۶۷۸۹', D2 = '٠١٢٣٤٥٦٧٨٩';
const norm = s => String(s || '')
  .replace(/ي/g, 'ی').replace(/ك/g, 'ک')
  .replace(/[۰-۹]/g, d => D1.indexOf(d)).replace(/[٠-٩]/g, d => D2.indexOf(d))
  .replace(/[٬،]/g, ',').replace(/[−–—‐]/g, '-').replace(/[\u200e\u200f]/g, '');
const num = s => Number(String(s).replace(/,/g, ''));

export function parseBankSms(body) {
  const t = norm(body);
  if (!/مانده/.test(t)) return null; // پیامک بانکی معمولاً «مانده» دارد

  let sign = null, amount = null, m;
  // مبلغ با علامت چسبیده: 400,000-  یا  10,000,000+
  if ((m = t.match(/(\d{1,3}(?:,\d{3})+|\d+)([+-])(?![\d])/))) { amount = num(m[1]); sign = m[2]; }
  // علامت قبل از عدد: -400,000
  else if ((m = t.match(/(?:^|[\s:])([+-])(\d{1,3}(?:,\d{3})+|\d{4,})/))) { amount = num(m[2]); sign = m[1]; }
  // بدون علامت: با کلمه‌های برداشت/واریز
  else if ((m = t.match(/مبلغ\s*:?\s*(\d[\d,]*)/))) {
    amount = num(m[1]);
    if (/برداشت|خرید|پرداخت|کسر/.test(t)) sign = '-';
    else if (/واریز|دریافت|افزایش/.test(t)) sign = '+';
  }
  if (!amount || !sign) return null;

  const account = (t.match(/حساب\s*:?\s*(\d+)/) || [])[1] || '';
  const bm = t.match(/مانده\s*:?\s*(-?\d[\d,]*)/);
  const balance = bm ? num(bm[1]) : null;
  const tm = t.match(/(\d{2})(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  const time = tm ? `${tm[3].padStart(2, '0')}:${tm[4]}` : '';
  const bank = ((t.match(/بانک[^\n\d:]*/) || [''])[0]).trim();

  let label = bank || 'تراکنش بانکی';
  if (/پایانه فروش/.test(t)) label = 'خرید با کارت (پایانه فروش)';
  else if (/خرید اینترنتی/.test(t)) label = 'خرید اینترنتی';
  else if (/انتقال/.test(t)) label = 'انتقال';
  else if (/برداشت/.test(t)) label = 'برداشت';
  else if (/واریز/.test(t)) label = 'واریز';

  const type = sign === '-' ? 'expense' : 'income';
  const category = type === 'expense' ? (/خرید/.test(label) ? 'خرید' : 'سایر') : 'سایر';
  return { type, amount, account, balance, label, bank, time, category };
}

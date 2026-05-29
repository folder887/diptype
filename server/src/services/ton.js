/**
 * Оплата криптовалютой через сеть TON (The Open Network).
 * Без TON_WALLET_ADDRESS работает в demo-режиме (платёж подтверждается без реальной транзакции).
 * С настроенным кошельком формирует ссылку на перевод и проверяет поступление через toncenter.
 */

const WALLET = process.env.TON_WALLET_ADDRESS;
const TONCENTER_BASE = process.env.TONCENTER_BASE || 'https://toncenter.com/api/v2';
const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY || '';
const FALLBACK_RATE = Number(process.env.TON_RUB_RATE || 350); // запасной курс RUB за 1 TON

const NANO = 1e9;

function isDemo() {
  return !WALLET;
}

// Курс RUB → TON. Пытаемся получить онлайн, иначе используем запасное значение из env.
async function getRubPerTon() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=rub',
      { signal: AbortSignal.timeout(6000) }
    );
    if (res.ok) {
      const data = await res.json();
      const rate = data?.['the-open-network']?.rub;
      if (rate && rate > 0) return rate;
    }
  } catch (_) {
    /* нет сети/курса — используем запасной */
  }
  return FALLBACK_RATE;
}

/**
 * Готовит реквизиты TON-платежа.
 * @param {{ amountRub:number, comment:string }} p
 */
async function buildPayment({ amountRub, comment }) {
  const rubPerTon = await getRubPerTon();
  const amountTon = Math.ceil((amountRub / rubPerTon) * 1000) / 1000; // округляем вверх до 0.001 TON
  const amountNano = Math.round(amountTon * NANO);
  const address = WALLET || 'UQDemoTONWalletAddressForLocalTesting_000000000000';

  const params = `amount=${amountNano}&text=${encodeURIComponent(comment)}`;
  return {
    method: 'ton',
    demo: isDemo(),
    address,
    amountTon,
    amountNano,
    rubPerTon,
    comment,
    tonLink: `ton://transfer/${address}?${params}`,
    tonkeeperLink: `https://app.tonkeeper.com/transfer/${address}?${params}`,
    tonhubLink: `https://tonhub.com/transfer/${address}?${params}`,
  };
}

/**
 * Проверяет поступление перевода с нужным комментарием и суммой.
 * @returns {Promise<boolean>}
 */
async function verifyPayment({ comment, amountNano }) {
  if (isDemo()) return true; // demo-режим: считаем оплату прошедшей

  try {
    const url = `${TONCENTER_BASE}/getTransactions?address=${encodeURIComponent(WALLET)}&limit=30&archival=true`;
    const res = await fetch(url, {
      headers: TONCENTER_API_KEY ? { 'X-API-Key': TONCENTER_API_KEY } : {},
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return false;
    const data = await res.json();
    const txs = data?.result || [];

    for (const tx of txs) {
      const inMsg = tx.in_msg;
      if (!inMsg) continue;
      const msgText = inMsg.message || inMsg.comment || '';
      const value = Number(inMsg.value || 0);
      if (msgText.trim() === comment && value >= amountNano * 0.99) {
        return true; // допускаем 1% на округление/комиссию
      }
    }
    return false;
  } catch (_) {
    return false;
  }
}

module.exports = { buildPayment, verifyPayment, isDemo };

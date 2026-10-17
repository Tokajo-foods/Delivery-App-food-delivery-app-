function groupIndian(whole: string): string {
  if (whole.length <= 3) return whole;
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

/**
 * Display a server amount exactly as the backend sent it — never re-round to whole rupees.
 * Whole rupees print without decimals (₹221, ₹1,25,000); paise print with two (₹10.95).
 * Same rule as the customer app and admin panel so amounts match to the paisa.
 */
export function formatInr(amount: number | null | undefined): string {
  const value = Math.round((Number(amount) || 0) * 100) / 100;
  const abs = Math.abs(value);
  const [whole, paise] = (Number.isInteger(abs) ? abs.toFixed(0) : abs.toFixed(2)).split('.');
  const body = paise ? `${groupIndian(whole!)}.${paise}` : groupIndian(whole!);
  return `${value < 0 ? '−' : ''}₹${body}`;
}

/** `null` when the server did not send an amount (render a placeholder, not ₹0). */
export function formatInrOrNull(amount: number | null | undefined): string | null {
  return typeof amount === 'number' && Number.isFinite(amount) ? formatInr(amount) : null;
}

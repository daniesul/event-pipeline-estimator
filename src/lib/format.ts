const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const usdPrecise = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

const safe = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/** $1,088,000 — whole dollars, used for all forecast outputs. */
export const formatCurrency = (n: number) => usd.format(Math.round(safe(n)));

/** Used for the user-entered opportunity value, which may include cents. */
export const formatCurrencyInput = (n: number) =>
  Number.isInteger(n) ? usd.format(safe(n)) : usdPrecise.format(safe(n));

/** Counts are rounded to the nearest whole number for display only. */
export const formatCount = (n: number) => integer.format(Math.round(safe(n)));

/** Plain number with thousands separators, no rounding to integer. */
export const formatPlain = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(safe(n));

/** 10.0% */
export const formatRate = (n: number, digits = 1) => `${safe(n).toFixed(digits)}%`;

/** Percent for conversion values: 16% or 16.5% */
export const formatPercent = (n: number) =>
  `${Number.isInteger(n) ? n : Number(safe(n).toFixed(2))}%`;

/** +1.5 pts / −2.0 pts / ±0.0 pts */
export const formatPoints = (n: number) => {
  const v = Math.round(n * 10) / 10;
  if (v === 0) return '±0.0 pts';
  return `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(1)} pts`;
};

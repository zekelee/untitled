export const formatCurrencyKRW = (value: number) =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("ko-KR").format(Math.round(value));

export const formatArea = (m2: number) => `${m2.toFixed(1)}㎡ (약 ${Math.round(
  m2 / 3.3058,
)}평)`;

export const priceDiffRatio = (current?: number, prev?: number) => {
  if (!current || !prev) return 0;
  return ((current - prev) / prev) * 100;
};

export const percentLabel = (ratio: number) =>
  `${ratio > 0 ? "+" : ""}${ratio.toFixed(1)}%`;

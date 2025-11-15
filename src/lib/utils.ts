export const formatCurrencyKRW = (value: number) =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("ko-KR").format(Math.round(value));

export const formatArea = (m2: number) =>
  `${m2.toFixed(1)}㎡ (약 ${(m2 / 3.3058).toFixed(1)}평)`;

export const formatKoreanPrice = (value?: number) => {
  if (value === undefined || value === null) return "-";
  const rounded = Math.round(value);
  const totalMan = Math.round(rounded / 10_000);
  if (totalMan === 0) return "0원";

  const eok = Math.floor(totalMan / 10_000);
  const man = totalMan % 10_000;

  const parts: string[] = [];
  if (eok) parts.push(`${eok}억`);
  if (man) parts.push(`${man}만`);

  return `${parts.join(" ")} 원`;
};

export const priceDiffRatio = (current?: number, prev?: number) => {
  if (!current || !prev) return 0;
  return ((current - prev) / prev) * 100;
};

export const percentLabel = (ratio: number) =>
  `${ratio > 0 ? "+" : ""}${ratio.toFixed(1)}%`;

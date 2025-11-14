import type { DealRecord, DealsSummary, PricePoint } from "./types";

const median = (values: number[]) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

const groupByMonth = (deals: DealRecord[]): Record<string, DealRecord[]> =>
  deals.reduce<Record<string, DealRecord[]>>((acc, deal) => {
    const key = `${deal.year}-${String(deal.month).padStart(2, "0")}`;
    if (!acc[key]) acc[key] = [];
    acc[key]?.push(deal);
    return acc;
  }, {});

const buildSeries = (deals: DealRecord[]): PricePoint[] => {
  const byMonth = groupByMonth(deals);
  return Object.entries(byMonth)
    .map(([label, rows]) => ({
      label,
      value:
        rows.reduce((sum, row) => sum + row.price, 0) /
        Math.max(rows.length, 1),
    }))
    .sort((a, b) => (a.label > b.label ? 1 : -1));
};

export const summarizeDeals = (deals: DealRecord[]): DealsSummary => {
  const prices = deals.map((deal) => deal.price);
  const latestPrice = deals[0]?.price;
  const previousPrice = deals[1]?.price;
  const minArea = Math.min(...deals.map((deal) => deal.area));
  const maxArea = Math.max(...deals.map((deal) => deal.area));

  return {
    averagePrice:
      prices.reduce((sum, price) => sum + price, 0) / Math.max(prices.length, 1),
    medianPrice: median(prices),
    latestPrice,
    previousPrice,
    totalDeals: deals.length,
    areaRange: [Number.isFinite(minArea) ? minArea : 0, Number.isFinite(maxArea) ? maxArea : 0],
    updatedAt: new Date().toISOString(),
    monthlySeries: buildSeries(deals),
  };
};

import { addDays, format } from "date-fns";
import { DEFAULT_REGION, DEFAULT_PROPERTY_TYPE } from "./constants";
import type { DealRecord, PropertyType } from "./types";

const basePrices = {
  apartment: 970_000_000,
  officetel: 520_000_000,
  house: 780_000_000,
} satisfies Record<PropertyType, number>;

export const buildMockDeals = ({
  regionCode = DEFAULT_REGION,
  propertyType = DEFAULT_PROPERTY_TYPE,
  rows = 24,
}: {
  regionCode?: string;
  propertyType?: PropertyType;
  rows?: number;
}): DealRecord[] => {
  const today = new Date();
  return Array.from({ length: rows }).map((_, index) => {
    const dealDate = addDays(today, -index * 5);
    const base = basePrices[propertyType];
    const seasonality = Math.sin(index / 4) * 25_000_000;
    const noise = Math.random() * 25_000_000 * (Math.random() > 0.5 ? 1 : -1);
    const price = Math.max(200_000_000, base + seasonality + noise);
    const area = 74 + (index % 5) * 3;

    return {
      id: `${regionCode}-${propertyType}-${index}`,
      propertyType,
      apartmentName: propertyType === "house" ? "전원주택" : "꿈에그린",
      area,
      floor: propertyType === "house" ? undefined : `${10 + (index % 15)}층`,
      contractDate: format(dealDate, "yyyy-MM-dd"),
      price: Math.round(price / 10000) * 10000,
      pricePerSquareMeter: Math.round(price / (area * 3.3058)),
      regionName: regionCode,
      lawdCode: regionCode,
      year: dealDate.getFullYear(),
      month: dealDate.getMonth() + 1,
    };
  });
};

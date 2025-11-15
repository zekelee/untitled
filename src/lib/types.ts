export type PropertyType = "apartment" | "officetel" | "house";

export interface DealRecord {
  id: string;
  propertyType: PropertyType;
  apartmentName: string;
  area: number;
  floor?: string;
  floorNumber?: number;
  totalFloors?: number;
  contractDate: string;
  price: number;
  pricePerSquareMeter: number;
  regionName: string;
  neighborhood?: string;
  roadName?: string;
  lawdCode: string;
  sggCode?: string;
  umdCode?: string;
  bonbun?: string;
  bubun?: string;
  year: number;
  month: number;
}

export interface PricePoint {
  label: string;
  value: number;
}

export interface DealsSummary {
  averagePrice: number;
  medianPrice: number;
  latestPrice?: number;
  previousPrice?: number;
  totalDeals: number;
  areaRange: [number, number];
  updatedAt: string;
  monthlySeries: PricePoint[];
}

export interface DealsApiResponse {
  deals: DealRecord[];
  summary: DealsSummary;
  source?: "api" | "mock";
  error?: string;
}

export interface RegionOption {
  code: string;
  label: string;
  shortLabel: string;
}

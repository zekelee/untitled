import { randomUUID } from "crypto";
import { DEFAULT_PROPERTY_TYPE } from "./constants";
import { buildMockDeals } from "./mockData";
import { summarizeDeals } from "./calculations";
import type {
  DealRecord,
  DealsApiResponse,
  PropertyType,
} from "./types";

const API_BASE =
  process.env.MOLIT_API_BASE?.replace(/\/$/, "") ?? "https://api.odcloud.kr/api";

const ENDPOINT_MAP: Record<PropertyType, string> = {
  apartment: "/ApartmentTransactionService/v1/getRTMSDataSvcAptTradeDev",
  officetel: "/HouseTransactionService/v1/getRTMSDataSvcOffiTrade",
  house: "/HouseTransactionService/v1/getRTMSDataSvcSHTrade",
};

const parseNumber = (value?: string | number) => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  return Number(String(value).replace(/[^\d.]/g, "")) || 0;
};

const normalizeDeal = (
  raw: Record<string, string>,
  propertyType: PropertyType,
): DealRecord => {
  const area = parseNumber(raw["전용면적"] ?? raw["exclusiveArea"]);
  const price = parseNumber(raw["거래금액"] ?? raw["dealAmount"]) * 10_000;
  const lawdCode = raw["법정동시군구코드"] ?? raw["lawdCd"] ?? "";
  const contractYear =
    parseNumber(raw["년"] ?? raw["dealYear"]) || new Date().getFullYear();
  const contractMonth =
    parseNumber(raw["월"] ?? raw["dealMonth"]) || new Date().getMonth() + 1;
  const contractDay =
    parseNumber(raw["일"] ?? raw["dealDay"]) || new Date().getDate();

  return {
    id: `${lawdCode}-${raw["일련번호"] ?? raw["serialNumber"] ?? randomUUID()}`,
    propertyType,
    apartmentName: raw["아파트"] ?? raw["aptName"] ?? raw["단지명"] ?? "미확인",
    area,
    floor: raw["층"] ?? raw["floor"],
    contractDate: `${contractYear}-${String(contractMonth).padStart(2, "0")}-${String(contractDay).padStart(2, "0")}`,
    price,
    pricePerSquareMeter: area ? price / area : price,
    regionName: raw["법정동"] ?? raw["region"] ?? lawdCode,
    lawdCode,
    year: contractYear,
    month: contractMonth,
  };
};

export const fetchDealsFromMolit = async ({
  regionCode,
  yearMonth,
  propertyType = DEFAULT_PROPERTY_TYPE,
  signal,
}: {
  regionCode: string;
  yearMonth: string;
  propertyType?: PropertyType;
  signal?: AbortSignal;
}): Promise<DealsApiResponse> => {
  const endpoint = ENDPOINT_MAP[propertyType] ?? ENDPOINT_MAP.apartment;
  const serviceKey = process.env.MOLIT_API_KEY;

  if (!serviceKey) {
    const deals = buildMockDeals({ regionCode, propertyType });
    return { deals, summary: summarizeDeals(deals) };
  }

  const url = new URL(`${API_BASE}${endpoint}`);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("LAWD_CD", regionCode);
  url.searchParams.set("DEAL_YMD", yearMonth);
  url.searchParams.set("numOfRows", "50");
  url.searchParams.set("pageNo", "1");

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });

  if (!res.ok) {
    throw new Error(`국토부 API 호출 실패: ${res.statusText}`);
  }

  const payload = await res.json();
  const candidates: Record<string, string>[] =
    payload?.data ??
    payload?.response?.body?.items?.item ??
    payload?.ApartmentTransactionService?.body?.items ??
    [];

  if (!Array.isArray(candidates) || candidates.length === 0) {
    const fallback = buildMockDeals({ regionCode, propertyType });
    return { deals: fallback, summary: summarizeDeals(fallback) };
  }

  const deals = candidates.map((item) => normalizeDeal(item, propertyType));
  return { deals, summary: summarizeDeals(deals) };
};

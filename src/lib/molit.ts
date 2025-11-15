import { randomUUID } from "crypto";
import { DEFAULT_PROPERTY_TYPE } from "./constants";
import { summarizeDeals } from "./calculations";
import type {
  DealRecord,
  DealsApiResponse,
  PropertyType,
} from "./types";

type RawRecord = Record<string, string | number | null | undefined>;

const API_BASE =
  process.env.MOLIT_API_BASE?.replace(/\/$/, "") ??
  "https://apis.data.go.kr/1613000";

const ENDPOINT_MAP: Record<PropertyType, string> = {
  apartment: "/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev",
  officetel: "/HouseTransactionService/v1/getRTMSDataSvcOffiTrade",
  house: "/HouseTransactionService/v1/getRTMSDataSvcSHTrade",
};

const KOREAN_KEYS = {
  area: [
    "\uC804\uC6A9\uBA74\uC801",
    "\uC804\uC6A9\uBA74\uC801(\u33A1)",
    "exclusiveArea",
    "excluUseAr",
  ],
  price: ["\uAC70\uB798\uAE08\uC561", "dealAmount"],
  lawdCode: [
    "\uBC95\uC815\uB3D9\uC2DC\uAD70\uAD6C\uCF54\uB4DC",
    "\uBC95\uC815\uB3D9\uBCF8\uBC88\uCF54\uB4DC",
    "lawdCd",
  ],
  year: ["\uB144", "dealYear"],
  month: ["\uC6D4", "dealMonth"],
  day: ["\uC77C", "dealDay"],
  apartment: [
    "\uC544\uD30C\uD2B8",
    "\uC544\uD30C\uD2B8\uBA85",
    "aptName",
    "buildingName",
    "aptNm",
  ],
  region: [
    "\uBC95\uC815\uB3D9",
    "\uC2DC\uAD70\uAD6C",
    "\uC74C\uBA74",
    "region",
    "sidoNm",
    "sggNm",
    "umdNm",
  ],
  floor: ["\uCE35", "floor"],
  totalFloors: ["\uCD1D\uCE35", "totalFloor", "flrCnt"],
  serial: ["\uC77C\uB828\uBC88\uD638", "serialNumber", "aptSeq"],
};

const parseNumber = (value?: string | number | null) => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const normalized = String(value).replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const pick = (raw: RawRecord, keys: string[]) => {
  for (const key of keys) {
    if (key in raw) {
      const value = raw[key];
      if (value === undefined || value === null) continue;
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) continue;
        return trimmed;
      }
      return value;
    }
  }
  return undefined;
};

const normalizeDeal = (
  raw: RawRecord,
  propertyType: PropertyType,
): DealRecord => {
  const area = parseNumber(pick(raw, KOREAN_KEYS.area));
  const price =
    parseNumber(pick(raw, KOREAN_KEYS.price)) * 10_000;
  const lawdCode = String(pick(raw, KOREAN_KEYS.lawdCode) ?? "");

  const contractYear =
    parseNumber(pick(raw, KOREAN_KEYS.year)) || new Date().getFullYear();
  const contractMonth =
    parseNumber(pick(raw, KOREAN_KEYS.month)) ||
    new Date().getMonth() + 1;
  const contractDay =
    parseNumber(pick(raw, KOREAN_KEYS.day)) || new Date().getDate();

  const apartmentRaw = pick(raw, KOREAN_KEYS.apartment);
  const apartmentName =
    (apartmentRaw !== undefined ? String(apartmentRaw).trim() : "") ||
    "미확인 단지";
  const regionRaw = pick(raw, KOREAN_KEYS.region);
  const regionName =
    (regionRaw !== undefined ? String(regionRaw).trim() : "") ||
    (lawdCode || "정보 없음");

  const floorRaw = pick(raw, KOREAN_KEYS.floor);
  const totalFloorsRaw = pick(raw, KOREAN_KEYS.totalFloors);

  return {
    id: `${lawdCode}-${pick(raw, KOREAN_KEYS.serial) ?? randomUUID()}`,
    propertyType,
    apartmentName,
    area,
    floor: floorRaw !== undefined ? String(floorRaw) : undefined,
    totalFloors: totalFloorsRaw
      ? parseNumber(totalFloorsRaw) || undefined
      : undefined,
    contractDate: `${contractYear}-${String(contractMonth).padStart(2, "0")}-${String(contractDay).padStart(2, "0")}`,
    price,
    pricePerSquareMeter: area > 0 ? price / area : price,
    regionName,
    lawdCode,
    year: contractYear,
    month: contractMonth,
  };
};

const parseJson = async (res: Response) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      text.includes("<html")
        ? "국토부 시스템에서 HTML 응답을 반환했습니다."
        : "국토부 응답 파싱에 실패했습니다.",
    );
  }
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
  const serviceKeyRaw = process.env.MOLIT_API_KEY;
  const serviceKey = (() => {
    if (!serviceKeyRaw) return "";
    try {
      return decodeURIComponent(serviceKeyRaw);
    } catch {
      return serviceKeyRaw;
    }
  })();

  if (!serviceKey) {
    throw new Error("MOLIT_API_KEY가 설정되지 않았습니다.");
  }

  const url = new URL(`${API_BASE}${endpoint}`);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("LAWD_CD", regionCode);
  url.searchParams.set("DEAL_YMD", yearMonth);
  url.searchParams.set("numOfRows", "50");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("_type", "json");

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });

  if (!res.ok) {
    throw new Error(`국토부 API 호출 실패: ${res.status} ${res.statusText}`);
  }

  const payload = await parseJson(res);
  const candidates: RawRecord[] =
    payload?.data ??
    payload?.response?.body?.items?.item ??
    payload?.ApartmentTransactionService?.body?.items ??
    [];

  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error("국토부 API에서 거래 데이터가 비어 있습니다.");
  }

  const deals = candidates.map((item) => normalizeDeal(item, propertyType));
  return { deals, summary: summarizeDeals(deals), source: "api" };
};

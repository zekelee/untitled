import { randomUUID } from "crypto";
import { DEFAULT_PROPERTY_TYPE } from "./constants";
import { summarizeDeals } from "./calculations";
import { getComplexMetadata } from "@/data/complexMetadata";
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

const TEXT_KEYS = {
  area: ["전용면적", "전용면적(㎡)", "exclusiveArea", "excluUseAr"],
  price: ["거래금액", "dealAmount"],
  lawdCode: ["법정동시군구코드", "법정동본번코드", "lawdCd"],
  year: ["년", "dealYear"],
  month: ["월", "dealMonth"],
  day: ["일", "dealDay"],
  apartment: ["아파트", "아파트명", "aptName", "buildingName", "aptNm"],
  region: ["법정동", "시군구", "읍면", "region", "sidoNm", "sggNm", "umdNm"],
  floor: ["층", "floor"],
  totalFloors: ["총층", "totalFloor", "flrCnt"],
  serial: ["일련번호", "serialNumber", "aptSeq"],
  road: ["도로명", "roadNm"],
};

const ALLOWED_NEIGHBORHOOD_KEYWORDS = [
  "운정",
  "동패",
  "교하",
  "야당",
  "문발",
  "목동",
  "산남",
  "동산",
  "당하",
  "와동",
  "다율",
  "서패",
];

const AREA_LIMIT_SQM = Number(process.env.APT_MAX_AREA_SQM ?? "84") || 84;

const parseNumber = (value?: string | number | null) => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const normalized = String(value).replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const pickValue = (raw: RawRecord, keys: string[]) => {
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

const detectAreaTag = (
  area: number,
  metadataTags?: ("59" | "84")[],
): "59" | "84" | undefined => {
  if (metadataTags?.length === 1) return metadataTags[0];
  if (!area) return undefined;
  if (area >= 55 && area <= 66) return "59";
  if (area >= 80 && area <= 90) return "84";
  return metadataTags?.[0];
};

const normalizeDeal = (
  raw: RawRecord,
  propertyType: PropertyType,
): DealRecord => {
  const area = parseNumber(pickValue(raw, TEXT_KEYS.area));
  const price = parseNumber(pickValue(raw, TEXT_KEYS.price)) * 10_000;
  const lawdCode = String(pickValue(raw, TEXT_KEYS.lawdCode) ?? "");

  const contractYear =
    parseNumber(pickValue(raw, TEXT_KEYS.year)) || new Date().getFullYear();
  const contractMonth =
    parseNumber(pickValue(raw, TEXT_KEYS.month)) ||
    new Date().getMonth() + 1;
  const contractDay =
    parseNumber(pickValue(raw, TEXT_KEYS.day)) || new Date().getDate();

  const apartmentName =
    (pickValue(raw, TEXT_KEYS.apartment) as string | undefined)?.trim() ??
    "미확인 단지";
  const regionName =
    (pickValue(raw, TEXT_KEYS.region) as string | undefined)?.trim() ??
    lawdCode;
  const roadName =
    (pickValue(raw, TEXT_KEYS.road) as string | undefined)?.trim();
  const floorRaw = pickValue(raw, TEXT_KEYS.floor);
  const floorNumber = floorRaw ? parseNumber(floorRaw) : undefined;
  const totalFloorsRaw = pickValue(raw, TEXT_KEYS.totalFloors);
  const buildYear = raw["buildYear"] ? parseNumber(raw["buildYear"]) : null;
  const metadata = getComplexMetadata(apartmentName);
  const areaTag = detectAreaTag(area, metadata?.areaTags);

  return {
    id: `${lawdCode}-${pickValue(raw, TEXT_KEYS.serial) ?? randomUUID()}`,
    propertyType,
    apartmentName,
    area,
    floor: floorRaw !== undefined ? String(floorRaw) : undefined,
    floorNumber: floorNumber || undefined,
    totalFloors: totalFloorsRaw ? parseNumber(totalFloorsRaw) || undefined : undefined,
    contractDate: `${contractYear}-${String(contractMonth).padStart(2, "0")}-${String(contractDay).padStart(2, "0")}`,
    price,
    pricePerSquareMeter: area > 0 ? price / area : price,
    regionName,
    neighborhood: regionName,
    roadName,
    lawdCode,
    buildYear: buildYear || undefined,
    households: metadata?.households,
    stationDistance: metadata?.stationDistance,
    areaTag,
    sggCode: raw["sggCd"] ? String(raw["sggCd"]) : undefined,
    umdCode: raw["umdCd"] ? String(raw["umdCd"]) : undefined,
    bonbun: raw["bonbun"] ? String(raw["bonbun"]) : undefined,
    bubun: raw["bubun"] ? String(raw["bubun"]) : undefined,
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

const matchesUnjeong = (deal: DealRecord) => {
  const text = `${deal.regionName ?? ""} ${deal.neighborhood ?? ""} ${deal.apartmentName ?? ""} ${deal.roadName ?? ""}`;
  return ALLOWED_NEIGHBORHOOD_KEYWORDS.some((keyword) => text.includes(keyword));
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
  url.searchParams.set("numOfRows", "100");
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

  if (!Array.isArray(candidates) || !candidates.length) {
    throw new Error("국토부 API에서 거래 데이터가 비어 있습니다.");
  }

  const deals = candidates.map((item) => normalizeDeal(item, propertyType));

  const filteredDeals = deals.filter((deal) => {
    const areaOk = !deal.area || deal.area <= AREA_LIMIT_SQM + 0.5;
    return areaOk && matchesUnjeong(deal);
  });

  if (!filteredDeals.length) {
    throw new Error("운정신도시 전용 84㎡ 이하 거래가 없습니다.");
  }

  filteredDeals.forEach((deal) => {
    if (!deal.totalFloors && deal.apartmentName) {
      const metadata = getComplexMetadata(deal.apartmentName);
      if (metadata?.totalFloors) {
        deal.totalFloors = metadata.totalFloors;
      }
    }
  });

  return {
    deals: filteredDeals,
    summary: summarizeDeals(filteredDeals),
    source: "api",
  };
};

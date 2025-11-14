import { format } from "date-fns";
import type { PropertyType, RegionOption } from "./types";

export const REGIONS: RegionOption[] = [
  { code: "11110", label: "서울 종로구", shortLabel: "종로구" },
  { code: "11140", label: "서울 중구", shortLabel: "중구" },
  { code: "11170", label: "서울 용산구", shortLabel: "용산구" },
  { code: "11215", label: "서울 광진구", shortLabel: "광진구" },
  { code: "11260", label: "서울 중랑구", shortLabel: "중랑구" },
  { code: "11305", label: "서울 은평구", shortLabel: "은평구" },
  { code: "11350", label: "서울 노원구", shortLabel: "노원구" },
  { code: "11500", label: "서울 강서구", shortLabel: "강서구" },
  { code: "11680", label: "서울 강남구", shortLabel: "강남구" },
  { code: "11710", label: "서울 송파구", shortLabel: "송파구" },
  { code: "11740", label: "서울 강동구", shortLabel: "강동구" },
  { code: "41131", label: "경기 수원시 영통구", shortLabel: "영통구" },
  { code: "41135", label: "경기 용인시 기흥구", shortLabel: "기흥구" },
  { code: "41173", label: "경기 성남시 분당구", shortLabel: "분당구" },
  { code: "41570", label: "경기 화성시", shortLabel: "화성시" },
  { code: "41465", label: "경기 하남시", shortLabel: "하남시" },
  { code: "41285", label: "경기 고양시 일산동구", shortLabel: "일산동구" },
  { code: "41480", label: "경기 파주시 (운정신도시)", shortLabel: "파주시" },
  { code: "42830", label: "인천 연수구", shortLabel: "연수구" },
];

export const DEFAULT_REGION =
  process.env.DEFAULT_REGION_CODE ?? "41480";

export const DEFAULT_PROPERTY_TYPE: PropertyType = "apartment";

export const currentYearMonth = () => format(new Date(), "yyyyMM");

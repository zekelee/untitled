export type ComplexMetadata = {
  households?: number;
  stationDistance?: string;
};

const METADATA_MAP: Record<string, ComplexMetadata> = {
  "한빛마을12단지e편한세상운정어반프라임": {
    households: 1224,
    stationDistance: "GTX 운정역 도보 12분",
  },
  "가람마을14단지푸르지오파르세나": {
    households: 596,
    stationDistance: "운정역 버스 7분",
  },
  "가람마을9단지힐스테이트운정": {
    households: 930,
    stationDistance: "운정역 도보 15분",
  },
  "한양수자인리버팰리스아파트": {
    households: 792,
    stationDistance: "야당역 도보 10분",
  },
  "우미린11단지현대아이파크": {
    households: 844,
    stationDistance: "GTX 운정역 도보 10분",
  },
};

const normalizeKey = (name?: string) =>
  name ? name.replace(/\s+/g, "").toLowerCase() : "";

export const getComplexMetadata = (name?: string): ComplexMetadata | undefined =>
  METADATA_MAP[normalizeKey(name)];

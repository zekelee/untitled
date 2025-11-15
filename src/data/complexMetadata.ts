export type ComplexMetadata = {
  households?: number;
  stationDistance?: string;
  buildYear?: number;
  totalFloors?: number;
  areaTags?: ("59" | "84")[];
};

const METADATA_MAP: Record<string, ComplexMetadata> = {
  "한빛마을12단지e편한세상운정어반프라임": {
    households: 1224,
    stationDistance: "GTX 운정역 도보 12분",
    buildYear: 2021,
    totalFloors: 29,
    areaTags: ["84"],
  },
  "가람마을14단지푸르지오파르세나": {
    households: 596,
    stationDistance: "운정역 버스 7분",
    buildYear: 2020,
    totalFloors: 25,
    areaTags: ["59", "84"],
  },
  "가람마을9단지힐스테이트운정": {
    households: 930,
    stationDistance: "운정역 도보 15분",
    buildYear: 2019,
    totalFloors: 30,
    areaTags: ["84"],
  },
  "한양수자인리버팰리스아파트": {
    households: 792,
    stationDistance: "야당역 도보 10분",
    buildYear: 2018,
    totalFloors: 29,
    areaTags: ["59", "84"],
  },
  "우미린11단지현대아이파크": {
    households: 844,
    stationDistance: "GTX 운정역 도보 10분",
    buildYear: 2022,
    totalFloors: 30,
    areaTags: ["84"],
  },
  "세양에이리": {
    households: 712,
    stationDistance: "야당역 버스 8분",
    buildYear: 2017,
    totalFloors: 25,
    areaTags: ["59"],
  },
};

const normalizeKey = (name?: string) =>
  name ? name.replace(/\s+/g, "").toLowerCase() : "";

export const getComplexMetadata = (name?: string): ComplexMetadata | undefined =>
  METADATA_MAP[normalizeKey(name)];

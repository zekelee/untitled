import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FX_URL = "https://open.er-api.com/v6/latest/USD";
const FRED_SERIES = {
  korea: "INTDSRKRM193N",
  us: "DFEDTARU",
};
const BOK_URL = "https://ecos.bok.or.kr/api/StatisticSearch";
const STALE_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 60;

type MarketPayload = {
  updatedAt: string;
  baseRates: {
    korea: IndicatorItem;
    us: IndicatorItem;
  };
  usdKrw: IndicatorItem;
  error?: string;
};

type IndicatorItem = {
  label: string;
  value: number;
  source: string;
  updatedAt?: string;
  change?: number;
};

const DEFAULT_BASE_RATES: Record<"korea" | "us", IndicatorItem> = {
  korea: {
    label: "한국 기준금리",
    value: 2.5,
    source: "기본값",
    updatedAt: new Date().toISOString(),
  },
  us: {
    label: "미국 기준금리(상단)",
    value: 4.0,
    source: "기본값",
    updatedAt: new Date().toISOString(),
  },
};

let cache: MarketPayload | null = null;
let cachedAt = 0;
const TTL = 1000 * 60 * 60; // 1시간 캐시

const formatYearMonth = (date: Date) =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;

const addMonths = (date: Date, delta: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + delta);
  return next;
};

const fetchFx = async (): Promise<IndicatorItem> => {
  const res = await fetch(FX_URL, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error("환율 API 호출 실패");
  }
  const fxJson = await res.json();
  const usdKrw = Number(fxJson?.rates?.KRW ?? fxJson?.rates?.krw ?? 0);
  if (!usdKrw) {
    throw new Error("환율 데이터를 파싱할 수 없습니다.");
  }
  const updatedAt = fxJson?.time_last_update_utc
    ? new Date(fxJson.time_last_update_utc).toISOString()
    : new Date().toISOString();
  return {
    label: "USD / KRW",
    value: usdKrw,
    source: "open.er-api.com",
    updatedAt,
  };
};

const FRED_URL = (seriesId: string) =>
  `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`;

const fetchBokBaseRate = async (): Promise<IndicatorItem> => {
  const apiKey = process.env.BOK_API_KEY ?? "sample";
  const now = new Date();
  const start = addMonths(now, -18);
  const url = `${BOK_URL}/${apiKey}/json/kr/1/36/722Y001/M/${formatYearMonth(
    start,
  )}/${formatYearMonth(now)}/0101000`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  const payload = await res.json();
  if (!res.ok || payload?.StatisticSearch?.row === undefined) {
    throw new Error("한국은행 API 응답 오류");
  }
  const rows = payload?.StatisticSearch?.row ?? [];
  const candidates = Array.isArray(rows) ? rows : [rows];
  const normalized = candidates
    .map((row: Record<string, string>) => ({
      date: row.TIME,
      value: Number(row.DATA_VALUE),
    }))
    .filter((row) => row.date && Number.isFinite(row.value))
    .sort((a, b) => Number(b.date) - Number(a.date));

  if (!normalized.length) {
    throw new Error("한국은행 API 데이터 부족");
  }

  const latest = normalized[0];
  const previous = normalized[1];
  const iso =
    latest.date && latest.date.length === 6
      ? `${latest.date.slice(0, 4)}-${latest.date.slice(4, 6)}-01`
      : new Date().toISOString();

  return {
    label: "한국 기준금리",
    value: latest.value,
    source: "한국은행 ECOS",
    updatedAt: new Date(iso).toISOString(),
    change: previous ? latest.value - previous.value : undefined,
  };
};

const fetchFredSeries = async (
  seriesId: string,
  label: string,
  source: string,
): Promise<IndicatorItem> => {
  const res = await fetch(FRED_URL(seriesId), { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`${label} 지표 응답 오류`);
  }
  const text = await res.text();
  const rows = text
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => {
      const [date, value] = line.split(",");
      return { date, value: Number(value) };
    })
    .filter((item) => Number.isFinite(item.value))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!rows.length) {
    throw new Error(`${label} 데이터가 비어 있습니다.`);
  }

  const latest = rows[0];
  const previous = rows[1];

  return {
    label,
    value: latest.value,
    source,
    updatedAt: new Date(latest.date).toISOString(),
    change: previous ? latest.value - previous.value : undefined,
  };
};

const readManualIndicator = (
  prefix: "KOREA" | "US",
  label: string,
): IndicatorItem | null => {
  const keys = [
    `${prefix}_BASE_RATE`,
    `${prefix}_RATE`,
    `${prefix}_VALUE`,
  ];
  const valueRaw =
    keys.map((key) => process.env[key]).find((val) => val !== undefined) ??
    null;
  if (!valueRaw) return null;
  const value = Number(valueRaw);
  if (!Number.isFinite(value)) return null;
  const changeRaw = process.env[`${prefix}_BASE_RATE_CHANGE`];
  const change = changeRaw ? Number(changeRaw) : undefined;
  return {
    label,
    value,
    source: process.env[`${prefix}_BASE_RATE_SOURCE`] ?? "환경설정",
    updatedAt:
      process.env[`${prefix}_BASE_RATE_UPDATED_AT`] ?? new Date().toISOString(),
    change: Number.isFinite(change ?? NaN) ? change : undefined,
  };
};

const pickIndicator = (
  value: IndicatorItem | null,
  manual: IndicatorItem | null,
  fallback: IndicatorItem,
  maxAgeMs?: number,
): IndicatorItem => {
  if (manual) return manual;
  if (value) {
    if (!maxAgeMs || !value.updatedAt) return value;
    const age = Date.now() - new Date(value.updatedAt).getTime();
    if (Number.isFinite(age) && age <= maxAgeMs) return value;
  }
  return fallback;
};

export async function GET() {
  if (cache && Date.now() - cachedAt < TTL) {
    return NextResponse.json(cache);
  }

  try {
    const [bokRes, usRes, fxRes] = await Promise.allSettled([
      fetchBokBaseRate(),
      fetchFredSeries(FRED_SERIES.us, "미국 기준금리(상단)", "FRED"),
      fetchFx(),
    ]);

    if (fxRes.status !== "fulfilled") {
      throw fxRes.reason ?? new Error("환율 정보를 불러오지 못했습니다.");
    }

    const manualKorea = readManualIndicator("KOREA", "한국 기준금리");
    const manualUs = readManualIndicator("US", "미국 기준금리(상단)");

    const koreaRate = pickIndicator(
      bokRes.status === "fulfilled" ? bokRes.value : null,
      manualKorea,
      DEFAULT_BASE_RATES.korea,
    );
    const usRate = pickIndicator(
      usRes.status === "fulfilled" ? usRes.value : null,
      manualUs,
      DEFAULT_BASE_RATES.us,
      STALE_THRESHOLD_MS,
    );

    const updatedAt = new Date().toISOString();
    const payload: MarketPayload = {
      updatedAt,
      baseRates: {
        korea: koreaRate,
        us: usRate,
      },
      usdKrw: fxRes.value,
    };

    cache = payload;
    cachedAt = Date.now();
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "지표 정보를 불러오지 못했습니다.";
    if (cache) {
      return NextResponse.json({ ...cache, error: message });
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

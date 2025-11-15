import { NextResponse } from "next/server";

const FX_URL = "https://open.er-api.com/v6/latest/USD";

type MarketPayload = {
  updatedAt: string;
  baseRates: {
    korea: IndicatorItem;
    us: IndicatorItem;
  };
  usdKrw: IndicatorItem;
};

type IndicatorItem = {
  label: string;
  value: number;
  source: string;
};

const BASE_RATES = {
  korea: {
    label: "한국 기준금리",
    value: 3.5,
    source: "한국은행 (2025-05)",
  },
  us: {
    label: "미국 기준금리",
    value: 5.25,
    source: "미 연준 (2025-05)",
  },
};

let cache: MarketPayload | null = null;
let cachedAt = 0;
const TTL = 1000 * 60 * 60; // 1시간

export async function GET() {
  if (cache && Date.now() - cachedAt < TTL) {
    return NextResponse.json(cache);
  }

  try {
    const fxResponse = await fetch(FX_URL, { next: { revalidate: 0 } });
    if (!fxResponse.ok) {
      throw new Error("환율 API 호출 실패");
    }
    const fxJson = await fxResponse.json();
    const usdKrw = Number(fxJson?.rates?.KRW ?? fxJson?.rates?.krw ?? 0);
    const updatedAt = fxJson?.time_last_update_utc
      ? new Date(fxJson.time_last_update_utc).toISOString()
      : new Date().toISOString();

    const payload: MarketPayload = {
      updatedAt,
      baseRates: {
        korea: BASE_RATES.korea,
        us: BASE_RATES.us,
      },
      usdKrw: {
        label: "USD / KRW",
        value: usdKrw,
        source: "open.er-api.com",
      },
    };

    cache = payload;
    cachedAt = Date.now();
    return NextResponse.json(payload);
  } catch (error) {
    if (cache) {
      return NextResponse.json({
        ...cache,
        error: error instanceof Error ? error.message : "최근 지표를 가져오는 중 오류",
      });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "지표 데이터를 불러올 수 없습니다.",
      },
      { status: 502 },
    );
  }
}

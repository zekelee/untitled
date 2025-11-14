import { NextResponse } from "next/server";

const FX_URL =
  "https://api.exchangerate.host/latest?base=USD&symbols=KRW";

export async function GET() {
  try {
    const fxResponse = await fetch(FX_URL, { next: { revalidate: 3600 } });
    if (!fxResponse.ok) {
      throw new Error("환율 API 호출 실패");
    }
    const fxJson = await fxResponse.json();
    const usdKrw = Number(fxJson?.rates?.KRW ?? 0);
    const updatedAt = fxJson?.date
      ? new Date(fxJson.date).toISOString()
      : new Date().toISOString();

    return NextResponse.json({
      updatedAt,
      baseRates: {
        korea: {
          label: "한국 기준금리",
          value: 3.5,
          source: "한국은행 (2025-02 기준)",
        },
        us: {
          label: "미국 기준금리",
          value: 5.25,
          source: "미 연준 (2025-03 FOMC)",
        },
      },
      usdKrw: {
        label: "USD / KRW",
        value: usdKrw,
        source: "exchangerate.host",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "지표 데이터를 불러올 수 없습니다.",
      },
      { status: 502 },
    );
  }
}

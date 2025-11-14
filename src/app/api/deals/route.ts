import { NextRequest, NextResponse } from "next/server";
import { fetchDealsFromMolit } from "@/lib/molit";
import {
  DEFAULT_PROPERTY_TYPE,
  DEFAULT_REGION,
  currentYearMonth,
} from "@/lib/constants";
import type { PropertyType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") ?? DEFAULT_REGION;
  const yearMonth = searchParams.get("yearMonth") ?? currentYearMonth();
  const propertyType =
    (searchParams.get("propertyType") as PropertyType | null) ??
    DEFAULT_PROPERTY_TYPE;

  try {
    const data = await fetchDealsFromMolit({
      regionCode: region,
      yearMonth,
      propertyType,
    });
    return NextResponse.json({ ...data, source: data.source ?? "api" });
  } catch (error) {
    console.error("국토부 API 호출 실패", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 502 },
    );
  }
}

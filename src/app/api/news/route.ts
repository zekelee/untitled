import { NextResponse } from "next/server";
import { subDays } from "date-fns";

type Article = {
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
};

type NewsPayload = {
  updatedAt: string;
  articles: Article[];
};

let cache: NewsPayload | null = null;
let cachedAt = 0;
const TTL = 1000 * 60 * 60;

const buildArticles = (): Article[] => {
  const now = new Date();
  return [
    {
      title: "수도권 무주택자 LTV 완화 논의 본격화",
      summary: "금융위원회가 생애최초 LTV 상향을 재검토하면서 매수 심리가 다시 움직이고 있습니다.",
      source: "서울경제",
      publishedAt: subDays(now, 1).toISOString(),
    },
    {
      title: "GTX-A 개통 준비, 파주·일산 역세권 기대감",
      summary: "GTX-A 시운전이 시작되며 파주·일산 신축 단지들의 문의가 늘고 있습니다.",
      source: "파이낸셜뉴스",
      publishedAt: subDays(now, 2).toISOString(),
    },
    {
      title: "미국 금리 동결, 환율 안정세…해외 자금 유입 기대",
      summary: "연준이 기준금리를 동결했고 환율이 안정되면서 국내 부동산 자금흐름에도 긍정적인 신호가 이어지고 있습니다.",
      source: "연합인포맥스",
      publishedAt: subDays(now, 3).toISOString(),
    },
  ];
};

export async function GET() {
  if (cache && Date.now() - cachedAt < TTL) {
    return NextResponse.json(cache);
  }

  const payload: NewsPayload = {
    updatedAt: new Date().toISOString(),
    articles: buildArticles(),
  };

  cache = payload;
  cachedAt = Date.now();

  return NextResponse.json(payload);
}

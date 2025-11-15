import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

export const dynamic = "force-dynamic";

type Article = {
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
};

type NewsPayload = {
  updatedAt: string;
  articles: Article[];
  error?: string;
};

const RSS_SOURCES = [
  {
    url: "https://news.google.com/rss/search?q=%EC%9A%B4%EC%A0%95%20%EB%B6%80%EB%8F%99%EC%82%B0&hl=ko&gl=KR&ceid=KR:ko",
    label: "Google News · 운정",
  },
  {
    url: "https://news.google.com/rss/search?q=%EB%B6%80%EB%8F%99%EC%82%B0%20%EA%B8%88%EB%A6%AC&hl=ko&gl=KR&ceid=KR:ko",
    label: "Google News · 금리",
  },
];

const parser = new XMLParser({
  ignoreAttributes: false,
  allowBooleanAttributes: true,
  processEntities: true,
});

let cache: NewsPayload | null = null;
let cachedAt = 0;
const TTL = 1000 * 60 * 30; // 30분
const WINDOW_MS = 1000 * 60 * 60 * 24 * 7;

const toArray = <T,>(value: T | T[] | undefined) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

type FeedItem = Record<string, unknown>;

const stripHtml = (input?: string) =>
  input?.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim() ?? "";

const mapFeedItem = (item: FeedItem, fallbackSource: string): Article => {
  const title = typeof item.title === "string" ? item.title.trim() : "제목 미확인";
  const summary = stripHtml(
    typeof item.description === "string" ? item.description : "",
  );
  const sourceValue = item.source;
  const source =
    typeof sourceValue === "string"
      ? sourceValue
      : (sourceValue as Record<string, string>)?.["#text"] ?? fallbackSource;
  const publishedAtRaw =
    (item.pubDate as string) ?? (item.published as string) ?? new Date().toISOString();
  const linkValue = item.link;
  const url =
    typeof linkValue === "string"
      ? linkValue
      : (linkValue as Record<string, string>)?.["#text"] ?? "#";

  return {
    title,
    summary: summary || title,
    source,
    publishedAt: new Date(publishedAtRaw).toISOString(),
    url,
  };
};

const fetchFeed = async ({ url, label }: { url: string; label: string }) => {
  const res = await fetch(url, {
    next: { revalidate: 0 },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36",
    },
  });
  if (!res.ok) {
    throw new Error(`RSS 응답 오류 (${label})`);
  }
  const xml = await res.text();
  const parsed = parser.parse(xml);
  const items = toArray<FeedItem>(parsed?.rss?.channel?.item);
  return items.map((item) => mapFeedItem(item, label));
};

export async function GET() {
  if (cache && Date.now() - cachedAt < TTL) {
    return NextResponse.json(cache);
  }

  try {
    const results = await Promise.allSettled(RSS_SOURCES.map(fetchFeed));
    const articles = results
      .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
      .filter(
        (article) => Date.now() - new Date(article.publishedAt).getTime() <= WINDOW_MS,
      )
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      )
      .slice(0, 8);

    const payload: NewsPayload = {
      updatedAt: new Date().toISOString(),
      articles,
    };

    cache = payload;
    cachedAt = Date.now();

    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "뉴스 정보를 불러오지 못했습니다.";
    if (cache) {
      return NextResponse.json({ ...cache, error: message });
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

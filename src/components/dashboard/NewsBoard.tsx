"use client";

import classNames from "classnames";
import { format } from "date-fns";
import useSWR, { useSWRConfig } from "swr";
import { IconNews, IconHomeSearch } from "@tabler/icons-react";
import { Loader } from "@mantine/core";
import MarketIndicators from "./MarketIndicators";
import RefreshButton from "./RefreshButton";
import styles from "./deal-dashboard.module.css";

const AUTOMATION_STEPS = [
  "국토부 API + 실시간 뉴스 RSS를 묶어 조건 매칭",
  "조건: 운정·수도권, 금리 변화, 정책 이슈 포함",
  "카카오톡 봇 · 이메일 리포트로 즉시 알림",
  "추후 Slack/Discord 채널로 확장 예정",
] as const;

interface NewsResponse {
  updatedAt: string;
  articles: {
    title: string;
    summary: string;
    source: string;
    publishedAt: string;
    url: string;
  }[];
  error?: string;
}

const fetcher = async (url: string): Promise<NewsResponse> => {
  const res = await fetch(url, { next: { revalidate: 0 } });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? "뉴스를 불러오지 못했습니다.");
  }
  return data;
};

export default function NewsBoard() {
  const { mutate } = useSWRConfig();
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate: mutateNews,
  } = useSWR<NewsResponse>("/api/news", fetcher, {
    refreshInterval: 1000 * 60 * 60,
  });

  const handleRefresh = () => {
    mutateNews();
    mutate("/api/market");
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <div className={styles.controlsBar}>
          <span className={styles.updatedAt}>
            {data?.updatedAt
              ? `업데이트 ${format(new Date(data.updatedAt), "yyyy.MM.dd HH:mm")}`
              : "업데이트 정보 없음"}
          </span>
        </div>

        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>시장 브리핑</p>
            <h1>부동산 + 금리/환율 트렌드</h1>
            <p className={styles.subtitle}>
              최근 7일 이내 기사만 모아 운정·수도권 이슈와 금리/환율 흐름을 동시에 점검합니다.
            </p>
          </div>
        </header>

        <section className={classNames(styles.card, styles.newsCard)}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardKicker}>최신 기사</p>
              <h2>핵심 부동산 뉴스</h2>
            </div>
            <IconNews size={20} />
          </div>
          {isLoading && (
            <div className={styles.placeholder}>
              <Loader color="var(--accent)" size="sm" />
              <span>뉴스를 불러오는 중...</span>
            </div>
          )}
          {!isLoading && error && (
            <div className={styles.alert}>뉴스 오류: {error.message}</div>
          )}
          {!isLoading && !error && data && (
            <>
              {data.articles.length === 0 ? (
                <div className={styles.placeholder}>최근 일주일 내 뉴스가 없습니다.</div>
              ) : (
                <ul className={styles.newsList}>
                  {data.articles.map((item) => (
                  <li key={`${item.title}-${item.publishedAt}`} className={styles.newsItem}>
                    <div className={styles.newsMeta}>
                      <span>{item.source}</span>
                      <span>{format(new Date(item.publishedAt), "MM.dd HH:mm")}</span>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.newsTitle}
                    >
                        {stripSourceSuffix(item.title, item.source)}
                    </a>
                  </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        <MarketIndicators />

        <div className={styles.floatingControls}>
          <RefreshButton loading={isLoading || isValidating} onClick={handleRefresh} />
        </div>

        <section className={classNames(styles.card, styles.automationCard)}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardKicker}>알림 계획</p>
              <h2>자동화 로드맵</h2>
            </div>
            <IconHomeSearch size={20} />
          </div>
          <ul className={styles.automationList}>
            {AUTOMATION_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

const stripSourceSuffix = (title: string, source?: string) => {
  if (!source) return title;
  const trimmedSource = source.replace(/[\s-]+$/, "").trim();
  const normalizedTitle = title.trim();
  if (!trimmedSource) return normalizedTitle;
  const suffixPatterns = [
    new RegExp(`\\s*-\\s*${trimmedSource}$`),
    new RegExp(`\\s*\\|\\s*${trimmedSource}$`),
  ];
  for (const pattern of suffixPatterns) {
    if (pattern.test(normalizedTitle)) {
      return normalizedTitle.replace(pattern, "").trim();
    }
  }
  return normalizedTitle;
};

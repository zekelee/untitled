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
  "국토부 실거래 API 수집 (3시간 간격)",
  "네이버부동산·직방 신규 매물 크롤링 → 운정 필터",
  "카카오봇/이메일로 신규 매물 요약 발송",
  "향후: Slack/Discord 채널, 가족 단톡 자동 공유",
];

interface NewsResponse {
  updatedAt: string;
  articles: {
    title: string;
    summary: string;
    source: string;
    publishedAt: string;
  }[];
}

const fetcher = async (url: string): Promise<NewsResponse> => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? "뉴스를 불러올 수 없습니다.");
  }
  return data;
};

export default function NewsBoard() {
  const { mutate } = useSWRConfig();
  const {
    data,
    error,
    isLoading,
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
              : "업데이트 대기"}
          </span>
          <RefreshButton loading={isLoading} onClick={handleRefresh} />
        </div>

        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>시장 브리핑</p>
            <h1>부동산 뉴스 & 자동화 계획</h1>
            <p className={styles.subtitle}>
              금리·GTX·PF 등 최신 이슈와 카카오봇 매물 알림 로드맵을 정리했습니다.
            </p>
          </div>
        </header>

        <section className={classNames(styles.card, styles.newsCard)}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardKicker}>최신 이슈</p>
              <h2>부동산 뉴스 클리핑</h2>
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
            <ul className={styles.newsList}>
              {data.articles.map((item) => (
                <li key={item.title} className={styles.newsItem}>
                  <div className={styles.newsMeta}>
                    <span>{item.source}</span>
                    <span>{format(new Date(item.publishedAt), "MM.dd")}</span>
                  </div>
                  <p className={styles.newsTitle}>{item.title}</p>
                  <p className={styles.newsSummary}>{item.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <MarketIndicators />

        <section className={classNames(styles.card, styles.automationCard)}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardKicker}>카카오봇 로드맵</p>
              <h2>운정 신규 매물 알림</h2>
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

"use client";

import useSWR from "swr";
import { Loader } from "@mantine/core";
import { IconFlag, IconWorldDollar } from "@tabler/icons-react";
import type { ReactNode } from "react";
import styles from "./deal-dashboard.module.css";

interface MarketData {
  updatedAt: string;
  baseRates: {
    korea: IndicatorItem;
    us: IndicatorItem;
  };
  usdKrw: IndicatorItem;
  error?: string;
}

interface IndicatorItem {
  label: string;
  value: number;
  source: string;
  updatedAt?: string;
}

const fetcher = async (url: string): Promise<MarketData> => {
  const res = await fetch(url, { next: { revalidate: 0 } });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? "지표를 불러올 수 없습니다.");
  }
  return data;
};

export default function MarketIndicators() {
  const { data, error, isLoading } = useSWR<MarketData>(
    "/api/market",
    fetcher,
    { refreshInterval: 1000 * 60 * 60 },
  );

  return (
    <section className={styles.marketGrid}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <p className={styles.cardKicker}>거시 지표</p>
            <h2>금리 & 환율 스냅샷</h2>
          </div>
          <span className={styles.updatedAt}>
            {data?.updatedAt
              ? `업데이트 ${new Date(data.updatedAt).toLocaleString("ko-KR")}`
              : "업데이트 대기"}
          </span>
        </div>

        {isLoading && (
          <div className={styles.placeholder}>
            <Loader color="var(--accent)" size="sm" />
            <span>거시 지표를 불러오는 중...</span>
          </div>
        )}

        {!isLoading && error && (
          <div className={styles.alert}>지표 오류: {error.message}</div>
        )}

        {!isLoading && !error && data && (
          <div className={styles.marketCards}>
            <IndicatorCard
              label={data.baseRates.korea.label}
              value={`${data.baseRates.korea.value.toFixed(2)}%`}
              icon={<IconFlag size={18} color="#00b894" />}
              source={`${data.baseRates.korea.source} (${data.baseRates.korea.updatedAt ?? ""})`}
            />
            <IndicatorCard
              label={data.baseRates.us.label}
              value={`${data.baseRates.us.value.toFixed(2)}%`}
              icon={<IconFlag size={18} color="#0984e3" />}
              source={`${data.baseRates.us.source} (${data.baseRates.us.updatedAt ?? ""})`}
            />
            <IndicatorCard
              label={data.usdKrw.label}
              value={`${data.usdKrw.value.toFixed(2)}원`}
              icon={<IconWorldDollar size={18} />}
              source={`${data.usdKrw.source} (${new Date(data.usdKrw.updatedAt ?? data.updatedAt).toLocaleString("ko-KR")})`}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function IndicatorCard({
  label,
  value,
  source,
  icon,
}: {
  label: string;
  value: string;
  source: string;
  icon?: ReactNode;
}) {
  return (
    <div className={styles.marketCard}>
      <p className={styles.marketLabel}>
        {icon}
        {label}
      </p>
      <p className={styles.marketValue}>{value}</p>
      <p className={styles.marketSource}>{source}</p>
    </div>
  );
}

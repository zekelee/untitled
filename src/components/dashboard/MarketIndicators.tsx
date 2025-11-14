"use client";

import useSWR from "swr";
import { Loader } from "@mantine/core";
import {
  IconFlag,
  IconWorldDollar,
} from "@tabler/icons-react";
import styles from "./deal-dashboard.module.css";

interface MarketData {
  updatedAt: string;
  baseRates: {
    korea: IndicatorItem;
    us: IndicatorItem;
  };
  usdKrw: {
    label: string;
    value: number;
    source: string;
  };
  error?: string;
}

interface IndicatorItem {
  label: string;
  value: number;
  source: string;
}

const fetcher = async (url: string): Promise<MarketData> => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? "지표를 불러오지 못했습니다.");
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
              ? `업데이트 ${new Date(data.updatedAt).toLocaleDateString("ko-KR")}`
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
              source={data.baseRates.korea.source}
            />
            <IndicatorCard
              label={data.baseRates.us.label}
              value={`${data.baseRates.us.value.toFixed(2)}%`}
              icon={<IconFlag size={18} color="#0984e3" />}
              source={data.baseRates.us.source}
            />
            <IndicatorCard
              label={data.usdKrw.label}
              value={`${data.usdKrw.value.toFixed(2)}원`}
              icon={<IconWorldDollar size={18} />}
              source={data.usdKrw.source}
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
}: {
  label: string;
  value: string;
  source: string;
  icon?: React.ReactNode;
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

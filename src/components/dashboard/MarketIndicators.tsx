"use client";

import useSWR from "swr";
import { Loader } from "@mantine/core";
import {
  IconCurrencyDollar,
  IconFlag,
  IconFlagStar,
} from "@tabler/icons-react";
import classNames from "classnames";
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
  change?: number;
}

const fetcher = async (url: string): Promise<MarketData> => {
  const res = await fetch(url, { next: { revalidate: 0 } });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? "시장 지표를 불러오지 못했습니다.");
  }
  return data;
};

const formatRate = (value: number) => `${value.toFixed(2)}%`;

const formatFx = (value: number) =>
  `${value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}원`;

const changeLabel = (change?: number) => {
  if (change === undefined) return "보합";
  if (change === 0) return "보합";
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}p`;
};

const changeClass = (change?: number) => {
  if (change === undefined || change === 0) return "";
  return change > 0 ? styles.marketUp : styles.marketDown;
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
            <h2>금리 & 환율 브리핑</h2>
          </div>
        </div>

        {isLoading && (
          <div className={styles.placeholder}>
            <Loader color="var(--accent)" size="sm" />
            <span>시장 지표를 불러오는 중...</span>
          </div>
        )}

        {!isLoading && error && (
          <div className={styles.alert}>지표 오류: {error.message}</div>
        )}

        {!isLoading && !error && data?.error && (
          <div className={styles.alert}>캐시 데이터 안내: {data.error}</div>
        )}

        {!isLoading && !error && data && (
          <div className={styles.marketCards}>
            <IndicatorCard
              label={data.baseRates.korea.label}
              value={formatRate(data.baseRates.korea.value)}
              change={changeLabel(data.baseRates.korea.change)}
              changeClass={changeClass(data.baseRates.korea.change)}
              icon={<IconFlag size={18} color="#ff4d6d" />}
              source={`${data.baseRates.korea.source} (${data.baseRates.korea.updatedAt?.slice(0, 10) ?? ""})`}
            />
            <IndicatorCard
              label={data.baseRates.us.label}
              value={formatRate(data.baseRates.us.value)}
              change={changeLabel(data.baseRates.us.change)}
              changeClass={changeClass(data.baseRates.us.change)}
              icon={<IconFlagStar size={18} color="#4dabf7" />}
              source={`${data.baseRates.us.source} (${data.baseRates.us.updatedAt?.slice(0, 10) ?? ""})`}
            />
            <IndicatorCard
              label={data.usdKrw.label}
              value={formatFx(data.usdKrw.value)}
              change="실시간 환율"
              changeClass=""
              icon={<IconCurrencyDollar size={18} color="#20c997" />}
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
  change,
  changeClass,
}: {
  label: string;
  value: string;
  source: string;
  icon?: ReactNode;
  change?: string;
  changeClass?: string;
}) {
  return (
    <div className={styles.marketCard}>
      <p className={styles.marketLabel}>
        {icon}
        {label}
      </p>
      <p className={styles.marketValue}>{value}</p>
      {change && (
        <p className={classNames(styles.marketChange, changeClass)}>{change}</p>
      )}
      <p className={styles.marketSource}>{source}</p>
    </div>
  );
}

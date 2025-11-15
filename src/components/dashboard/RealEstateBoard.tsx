"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import useSWR from "swr";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip as ChartTooltip,
  type TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";
import classNames from "classnames";
import { format } from "date-fns";
import {
  DEFAULT_PROPERTY_TYPE,
  DEFAULT_REGION,
  currentYearMonth,
} from "@/lib/constants";
import type { DealRecord, DealsApiResponse, PropertyType } from "@/lib/types";
import {
  formatCurrencyKRW,
  formatNumber,
  percentLabel,
  priceDiffRatio,
} from "@/lib/utils";
import { Select } from "@mantine/core";
import {
  IconActivity,
  IconBell,
  IconHomeSearch,
  IconScale,
  IconTrendingUp,
} from "@tabler/icons-react";
import AreaToggle, { AreaUnit } from "./AreaToggle";
import RefreshButton from "./RefreshButton";
import LoadingOverlay from "./LoadingOverlay";
import styles from "./deal-dashboard.module.css";

const PYEONG_RATIO = 3.3058;

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTooltip,
  Legend,
  Filler,
);

const fetcher = async (url: string): Promise<DealsApiResponse> => {
  const res = await fetch(url);
  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.error ?? "데이터를 불러오지 못했습니다.");
  }
  return payload;
};

export default function RealEstateBoard() {
  const region = DEFAULT_REGION;
  const propertyType: PropertyType = DEFAULT_PROPERTY_TYPE;
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("sqm");
  const [alertChannel, setAlertChannel] = useState("kakao");
  const selectedMonth = currentYearMonth();
  const alertPrice = 950_000_000;

  const searchKey = `/api/deals?region=${region}&propertyType=${propertyType}&yearMonth=${selectedMonth}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<DealsApiResponse>(
    searchKey,
    fetcher,
    {
      refreshInterval: 1000 * 60 * 10,
      revalidateOnFocus: false,
      errorRetryCount: 5,
      errorRetryInterval: 5000,
    },
  );

  const deals: DealRecord[] = useMemo(() => {
    if (!data?.deals) return [];
    return [...data.deals].sort(
      (a, b) =>
        new Date(b.contractDate).getTime() -
        new Date(a.contractDate).getTime(),
    );
  }, [data]);

  const summary = data?.summary;
  const priceDelta = priceDiffRatio(
    summary?.latestPrice,
    summary?.previousPrice,
  );

  const priceLineData = useMemo(() => {
    const labels = summary?.monthlySeries.map((row) => row.label) ?? [];
    const values = summary?.monthlySeries.map((row) => row.value) ?? [];
    return {
      labels,
      datasets: [
        {
          label: "평균 실거래가",
          data: values,
          borderColor: "rgba(90, 200, 250, 1)",
          backgroundColor: "rgba(90, 200, 250, 0.15)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    };
  }, [summary?.monthlySeries]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: TooltipItem<"line">) =>
              ` ${formatCurrencyKRW(Number(ctx.raw ?? ctx.parsed?.y ?? 0))}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "var(--muted)" },
          grid: { display: false },
        },
        y: {
          ticks: {
            color: "var(--muted)",
            callback: (value: number | string) =>
              `${Number(value) / 100_000_000}억`,
          },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
      },
    }),
    [],
  );

  const handleRefresh = useCallback(() => {
    mutate();
  }, [mutate]);

  const formatAreaValue = useCallback(
    (squareMeters: number) => {
      if (areaUnit === "pyeong") {
        return `${(squareMeters / PYEONG_RATIO).toFixed(1)}평`;
      }
      return `${squareMeters.toFixed(1)}㎡`;
    },
    [areaUnit],
  );

  const areaRangeLabel = summary
    ? `${formatAreaValue(summary.areaRange[0])} ~ ${formatAreaValue(summary.areaRange[1])}`
    : "면적 범위";

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <div className={styles.controlsBar}></div>

        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>운정 실거래 인텔리전스</p>
            <h1>아파트 가격 흐름 & 구매 전략</h1>
            <p className={styles.subtitle}>
              국토부 실거래가 API를 기반으로 파주 운정신도시 아파트 가격을
              추적하고 알림 조건을 정리합니다.
            </p>
          </div>
        </header>

        {error && (
          <div className={styles.alert}>
            국토부 API 오류: {error.message}
            {isValidating ? " · 재시도 중" : ""}
          </div>
        )}

        <section className={styles.statsGrid}>
          <StatCard
            label="평균 실거래가"
            value={
              summary ? formatCurrencyKRW(summary.averagePrice) : "–"
            }
            helper="최근 신고 기준"
            icon={<IconActivity size={20} />}
          />
          <StatCard
            label="중위 가격"
            value={summary ? formatCurrencyKRW(summary.medianPrice) : "–"}
            helper="이상/이하 균형 시세"
            icon={<IconScale size={20} />}
          />
          <StatCard
            label="전월 대비"
            value={percentLabel(priceDelta)}
            helper={
              summary?.latestPrice && summary?.previousPrice
                ? `${formatCurrencyKRW(summary.latestPrice)} → ${formatCurrencyKRW(summary.previousPrice)}`
                : "직전 신고 대비"
            }
            positive={priceDelta >= 0}
            icon={<IconTrendingUp size={20} />}
          />
          <StatCard
            label="계약 건수"
            value={summary ? formatNumber(summary.totalDeals) : "0"}
            helper={summary ? areaRangeLabel : "면적 범위"}
            icon={<IconHomeSearch size={20} />}
          />
        </section>

        <section className={styles.split}>
          <div className={classNames(styles.card, styles.chartCard)}>
            <LoadingOverlay
              visible={isLoading && !!data}
              label="국토부 데이터를 불러오는 중..."
            />
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.cardKicker}>가격 추이</p>
                <h2>운정 실거래 평균</h2>
              </div>
              <span className={styles.updatedAt}>
                {summary
                  ? `업데이트 ${format(
                      new Date(summary.updatedAt),
                      "MM월 dd일 HH:mm",
                    )}`
                  : "업데이트 준비중"}
              </span>
            </div>
            <div className={styles.chartWrapper}>
              {summary?.monthlySeries?.length ? (
                <Line data={priceLineData} options={chartOptions} />
              ) : error ? (
                <div className={styles.placeholder}>국토부 응답을 기다리고 있습니다.</div>
              ) : (
                <div className={styles.placeholder}>최근 월별 데이터가 없습니다.</div>
              )}
            </div>
          </div>

          <div className={classNames(styles.card, styles.alertCard)}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.cardKicker}>알림 조건</p>
                <h2>카카오봇 & 이메일 리포트</h2>
              </div>
              <IconBell size={20} />
            </div>
            <Select
              label="알림 채널"
              data={[
                { label: "카카오톡 봇", value: "kakao" },
                { label: "이메일 리포트", value: "email" },
                { label: "문자 메시지", value: "sms" },
              ]}
              value={alertChannel}
              onChange={(value) =>
                setAlertChannel(value ?? alertChannel)
              }
              radius="md"
            />
            <div className={styles.alertSummary}>
              {summary?.latestPrice ? (
                <>
                  <span>
                    최근 신고가 {formatCurrencyKRW(summary.latestPrice)}
                  </span>
                  <span>
                    목표 {formatCurrencyKRW(alertPrice)} 대비 {" "}
                    {percentLabel(
                      priceDiffRatio(alertPrice, summary.latestPrice),
                    )}
                  </span>
                </>
              ) : (
                <span>실거래를 불러오면 비교 수치가 표기됩니다.</span>
              )}
            </div>
          </div>
        </section>

        <section className={classNames(styles.card, styles.tableCard)}>
          <LoadingOverlay
            visible={isLoading && !!data}
            label="실거래 목록을 불러오는 중..."
          />
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardKicker}>최신 신고 내역</p>
              <h2>상세 실거래 목록</h2>
            </div>
            <span className={styles.helperText}>
              최근 신고 {deals.length}건
            </span>
          </div>

          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th>계약일</th>
                  <th>단지/건물</th>
                  <th>면적 ({areaUnit === "sqm" ? "㎡" : "평"})</th>
                  <th>층 (현/총)</th>
                  <th>거래금액</th>
                </tr>
              </thead>
              <tbody>
                {deals.slice(0, 8).map((deal) => (
                  <tr key={deal.id}>
                    <td>{format(new Date(deal.contractDate), "yyyy.MM.dd")}</td>
                    <td>{deal.apartmentName}</td>
                    <td>{formatAreaValue(deal.area)}</td>
                    <td>{formatFloorValue(deal)}</td>
                    <td>{formatCurrencyKRW(deal.price)}</td>
                  </tr>
                ))}
                {deals.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={5} className={styles.placeholder}>
                      국토부 실거래를 불러오는 중입니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={classNames(styles.card, styles.memoCard)}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardKicker}>체크 포인트</p>
              <h2>투자 근거 요약</h2>
            </div>
          </div>
          <ul className={styles.memoList}>
            <li>
              최근 신고 {deals[0]?.apartmentName ?? "단지"}
              {summary?.latestPrice
                ? ` ${formatCurrencyKRW(summary.latestPrice)} 수준`
                : " 가격 준비중"}
            </li>
            <li>
              월별 평균 {summary ? formatCurrencyKRW(summary.averagePrice) : "–"}
              / 전월 대비 {percentLabel(priceDelta)} 흐름
            </li>
            <li>면적 단위: {areaUnit === "sqm" ? "제곱미터" : "평"}</li>
            <li>보금자리론 한도·금리를 맞춰 자금 계획 확정</li>
          </ul>
        </section>
        <div className={styles.floatingControls}>
          <AreaToggle value={areaUnit} onChange={setAreaUnit} />
          <RefreshButton loading={isLoading} onClick={handleRefresh} />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  positive,
  icon,
}: {
  label: string;
  value: string;
  helper?: string;
  positive?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}>{icon}</div>
      <div>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>{value}</p>
        {helper && (
          <p
            className={classNames(styles.statHelper, {
              [styles.statPositive]: positive,
              [styles.statNegative]: positive === false,
            })}
          >
            {helper}
          </p>
        )}
      </div>
    </div>
  );
}

const formatFloorValue = (deal: DealRecord) => {
  const parseFloor = (value?: string) => {
    if (!value) return "-";
    const num = Number(value.toString().replace(/[^\d-]/g, ""));
    if (Number.isNaN(num)) return value;
    return `${num}층`;
  };

  const current = parseFloor(deal.floor);
  const total = deal.totalFloors ? `${deal.totalFloors}층` : "?";
  return `${current}/${total}`;
};

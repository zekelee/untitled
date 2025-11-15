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
  formatKoreanPrice,
  formatNumber,
  percentLabel,
  priceDiffRatio,
} from "@/lib/utils";
import {
  IconActivity,
  IconBell,
  IconHomeSearch,
  IconScale,
  IconTrendingUp,
} from "@tabler/icons-react";
import AreaToggle from "./AreaToggle";
import type { AreaUnit } from "./AreaToggle";
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
    throw new Error(payload?.error ?? "실거래 데이터를 불러오지 못했습니다.");
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
        new Date(b.contractDate).getTime() - new Date(a.contractDate).getTime(),
    );
  }, [data]);

  const summary = data?.summary;
  const priceDelta = priceDiffRatio(
    summary?.latestPrice,
    summary?.previousPrice,
  );

  const priceLineData = useMemo(() => {
    const labels = summary?.monthlySeries?.map((row) => row.label) ?? [];
    const values = summary?.monthlySeries?.map((row) => row.value) ?? [];
    return {
      labels,
      datasets: [
        {
          label: "월평균 실거래가",
          data: values,
          borderColor: "rgba(102, 251, 225, 1)",
          backgroundColor: "rgba(102, 251, 225, 0.2)",
          pointBackgroundColor: "#ff5da2",
          pointBorderColor: "#0d141f",
          fill: true,
          tension: 0.35,
          pointRadius: values.length === 1 ? 6 : 4,
          borderWidth: 3,
        },
      ],
    };
  }, [summary?.monthlySeries]);

  const formatAxisLabel = (value: number | string) => {
    const numeric = typeof value === "string" ? Number(value) : value;
    if (!Number.isFinite(numeric)) return value;
    return `${(numeric / 100_000_000).toFixed(1)}억`;
  };

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          callbacks: {
            label: (ctx: TooltipItem<"line">) =>
              ` ${formatKoreanPrice(Number(ctx.raw ?? ctx.parsed?.y ?? 0))}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "rgba(255,255,255,0.7)" },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
        y: {
          ticks: {
            color: "rgba(255,255,255,0.7)",
            callback: formatAxisLabel,
          },
          grid: { color: "rgba(255,255,255,0.1)", drawBorder: false },
        },
      },
    }),
    [],
  );

  const hasChartSeries = (summary?.monthlySeries?.length ?? 0) >= 2;

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
    : "면적 정보 없음";

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>운정신도시 아파트 집중 모니터링</p>
            <h1>최근 실거래 흐름 & 즉시 대응 인사이트</h1>
            <p className={styles.subtitle}>
              국토부 실거래 데이터를 실시간으로 불러와 평균가·면적·층 정보를 정리했습니다.
              API 오류 시 자동 재시도하며, 하단 목록은 최신 계약일 순으로 정렬됩니다.
            </p>
            <p className={styles.filterNote}>
              ※ 운정신도시 + 전용 84㎡ 이하(보금자리론 기준) 아파트만 집계합니다.
            </p>
          </div>
        </header>

        {error && (
          <div className={styles.alert}>
            국토부 API 오류: {error.message}
            {isValidating ? " · 재시도 중..." : ""}
          </div>
        )}

        <section className={styles.statsGrid}>
          <StatCard
            label="평균 실거래가"
            value={summary ? formatKoreanPrice(summary.averagePrice) : "정보 없음"}
            helper="최근 집계 기준"
            icon={<IconActivity size={20} />}
          />
          <StatCard
            label="중위 실거래가"
            value={summary ? formatKoreanPrice(summary.medianPrice) : "정보 없음"}
            helper="이상치 제거 기준"
            icon={<IconScale size={20} />}
          />
          <StatCard
            label="등락률"
            value={percentLabel(priceDelta)}
            helper={
              summary?.latestPrice && summary?.previousPrice
                ? `${formatKoreanPrice(summary.latestPrice)} → ${formatKoreanPrice(summary.previousPrice)}`
                : "직전 거래 대비"
            }
            positive={priceDelta >= 0}
            icon={<IconTrendingUp size={20} />}
          />
          <StatCard
            label="최근 거래 건수"
            value={summary ? formatNumber(summary.totalDeals) : "0"}
            helper={summary ? areaRangeLabel : "면적 표준화 중"}
            icon={<IconHomeSearch size={20} />}
          />
        </section>

        <section className={styles.split}>
          <div className={classNames(styles.card, styles.chartCard)}>
            <LoadingOverlay
              visible={isLoading && !!data}
              label="실거래 추세를 불러오는 중..."
            />
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.cardKicker}>가격 추세</p>
                <h2>월평균 거래가 차트</h2>
              </div>
              <span className={styles.updatedAt}>
                {summary
                  ? `업데이트 ${format(new Date(summary.updatedAt), "MM월 dd일 HH:mm")}`
                  : "업데이트 준비 중"}
              </span>
            </div>
            <div className={styles.chartWrapper}>
              {hasChartSeries ? (
                <Line data={priceLineData} options={chartOptions} />
              ) : summary?.monthlySeries?.length ? (
                <div className={styles.placeholder}>
                  월별 데이터가 2건 이상일 때 차트를 표시합니다.
                </div>
              ) : error ? (
                <div className={styles.placeholder}>
                  실거래 차트를 표시할 수 없습니다.
                </div>
              ) : (
                <div className={styles.placeholder}>
                  표시 가능한 월별 데이터가 부족합니다.
                </div>
              )}
            </div>
          </div>

          <div className={classNames(styles.card, styles.alertCard)}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.cardKicker}>알림 채널</p>
                <h2>카카오/이메일 가격 감시</h2>
              </div>
              <IconBell size={20} />
            </div>
            <select
              className={styles.alertSelect}
              value={alertChannel}
              onChange={(event) => setAlertChannel(event.target.value)}
              aria-label="알림 채널 선택"
            >
              <option value="kakao">카카오 채널</option>
              <option value="email">이메일 리포트</option>
              <option value="sms">문자 메시지</option>
            </select>
            <div className={styles.alertSummary}>
              {summary?.latestPrice ? (
                <>
                  <span>직전 실거래 {formatKoreanPrice(summary.latestPrice)}</span>
                  <span>
                    목표선 {formatKoreanPrice(alertPrice)} 대비 {" "}
                    {percentLabel(priceDiffRatio(alertPrice, summary.latestPrice))}
                  </span>
                </>
              ) : (
                <span>실거래가를 불러온 뒤 자동으로 벤치마크가 계산됩니다.</span>
              )}
            </div>
          </div>
        </section>

        <section className={classNames(styles.card, styles.tableCard)}>
          <LoadingOverlay
            visible={isLoading && !!data}
            label="실거래 목록을 정리하는 중..."
          />
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardKicker}>최신 계약</p>
              <h2>운정신도시 실거래</h2>
            </div>
            <span className={styles.helperText}>최근 계약 {deals.length}건</span>
          </div>

          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th>계약일</th>
                  <th>단지/동</th>
                  <th>면적 ({areaUnit === "sqm" ? "㎡" : "평"})</th>
                  <th>층 (현재/전체)</th>
                  <th>거래가</th>
                </tr>
              </thead>
              <tbody>
                {deals.slice(0, 8).map((deal, index) => (
                  <tr key={`${deal.id}-${index}`}>
                    <td data-label="계약일">
                      {format(new Date(deal.contractDate), "yyyy.MM.dd")}
                    </td>
                    <td data-label="단지/동">{deal.apartmentName}</td>
                    <td data-label="면적">{formatAreaValue(deal.area)}</td>
                    <td data-label="층">{formatFloorValue(deal)}</td>
                    <td data-label="거래가">{formatKoreanPrice(deal.price)}</td>
                  </tr>
                ))}
                {deals.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={5} className={styles.placeholder}>
                      운정신도시 실거래 데이터가 아직 없습니다.
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
              <p className={styles.cardKicker}>체크리스트</p>
              <h2>투자 근거 요약</h2>
            </div>
          </div>
          <ul className={styles.memoList}>
            <li>
              최근 계약: {deals[0]?.apartmentName ?? "집계 중"}{" "}
              {summary?.latestPrice
                ? `(${formatKoreanPrice(summary.latestPrice)})`
                : ""}
            </li>
            <li>
              평균 vs 중위 가격 격차{" "}
              {summary
                ? `${formatKoreanPrice(summary.averagePrice)} / ${formatKoreanPrice(summary.medianPrice)}`
                : "집계 중"}
            </li>
            <li>모니터링 면적 기준: {areaUnit === "sqm" ? "제곱미터" : "평"}</li>
            <li>신규 매물 알림: 카카오 봇 연동 완료 → 조건 만족 시 실시간 푸시</li>
          </ul>
        </section>

        <div className={styles.floatingControls}>
          <AreaToggle value={areaUnit} onChange={setAreaUnit} />
          <RefreshButton loading={isValidating || isLoading} onClick={handleRefresh} />
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
  const sanitize = (value?: string | number) => {
    if (value === undefined || value === null) return "-";
    const num = Number(String(value).replace(/[^\d-]/g, ""));
    if (Number.isNaN(num)) return String(value);
    return `${num}층`;
  };

  const current = sanitize(deal.floor);
  const total = deal.totalFloors ? `${deal.totalFloors}층` : "?층";
  return `${current} / ${total}`;
};

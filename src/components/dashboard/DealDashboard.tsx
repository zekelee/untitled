"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
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
  formatArea,
  formatCurrencyKRW,
  formatNumber,
  percentLabel,
  priceDiffRatio,
} from "@/lib/utils";
import styles from "./deal-dashboard.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

const fetcher = async (url: string): Promise<DealsApiResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("데이터를 불러오는데 실패했습니다.");
  }
  return res.json();
};

const toMonthInputValue = (yearMonth: string) =>
  `${yearMonth.slice(0, 4)}-${yearMonth.slice(4, 6)}`;

const fromMonthInputValue = (value: string) => value.replace("-", "");

export default function DealDashboard() {
  const initialMonth = toMonthInputValue(currentYearMonth());
  const region = DEFAULT_REGION;
  const propertyType: PropertyType = DEFAULT_PROPERTY_TYPE;
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [maxBudget, setMaxBudget] = useState(1_200_000_000);
  const [alertPrice, setAlertPrice] = useState(950_000_000);
  const [alertChannel, setAlertChannel] = useState("kakao");
  const [memo, setMemo] = useState(
    "부모님 지원 2억 포함 자금 계획과 실거래 추이 설명 자료 준비",
  );

  const searchKey = `/api/deals?region=${region}&propertyType=${propertyType}&yearMonth=${fromMonthInputValue(selectedMonth)}`;

  const { data, error, isLoading, mutate } = useSWR<DealsApiResponse>(
    searchKey,
    fetcher,
    {
      refreshInterval: 1000 * 60 * 10,
      revalidateOnFocus: false,
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

  const filteredDeals = useMemo(
    () => deals.filter((deal) => (maxBudget ? deal.price <= maxBudget : true)),
    [deals, maxBudget],
  );

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
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (ctx: TooltipItem<"line">) =>
              ` ${formatCurrencyKRW(
                Number(ctx.raw ?? ctx.parsed?.y ?? 0),
              )}`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "var(--muted)",
          },
          grid: {
            display: false,
          },
        },
        y: {
          ticks: {
            color: "var(--muted)",
            callback: (value: string | number) =>
              `${Number(value) / 100_000_000}억`,
          },
          grid: {
            color: "rgba(255,255,255,0.05)",
          },
        },
      },
    }),
    [],
  );

  const handleRefresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>수도권 실거래 인텔리전스</p>
            <h1>매물 모니터링 & 설득 자료</h1>
            <p className={styles.subtitle}>
              국토부 실거래가 공개 API를 기반으로 관심 지역의 가격 흐름과
              신규 계약 사례를 한눈에 확인하고, 가족 설득용 메모까지 정리할 수
              있는 대시보드입니다.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className={styles.refreshButton}
            disabled={isLoading}
          >
            {isLoading ? "불러오는 중..." : "데이터 새로고침"}
          </button>
        </header>

        <section className={styles.filters}>

          <FilterField label="조회 기준 월">
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />
          </FilterField>

          <FilterField label="상한 예산 (원)">
            <input
              type="number"
              min={0}
              step={10_000_000}
              value={maxBudget}
              onChange={(event) => setMaxBudget(Number(event.target.value))}
            />
          </FilterField>
        </section>

        {error && (
          <div className={styles.alert}>
            데이터를 불러오지 못했습니다. .env에 발급받은 서비스키를
            입력했는지, API 호출 제한을 초과하지 않았는지 확인해주세요.
          </div>
        )}

        <section className={styles.statsGrid}>
          <StatCard
            label="평균 실거래가"
            value={
              summary ? formatCurrencyKRW(summary.averagePrice) : "–"
            }
            helper="최근 신고 기준"
          />
          <StatCard
            label="중위 가격"
            value={summary ? formatCurrencyKRW(summary.medianPrice) : "–"}
            helper="이상/이하 균형 시세"
          />
          <StatCard
            label="전월 대비"
            value={percentLabel(priceDelta)}
            helper={
              summary?.latestPrice && summary?.previousPrice
                ? `${formatCurrencyKRW(summary.latestPrice)} ↔ ${formatCurrencyKRW(summary.previousPrice)}`
                : "직전 신고 대비"
            }
            positive={priceDelta >= 0}
          />
          <StatCard
            label="계약 건수"
            value={summary ? formatNumber(summary.totalDeals) : "0"}
            helper={
              summary
                ? `${summary.areaRange[0].toFixed(1)}㎡ ~ ${summary.areaRange[1].toFixed(1)}㎡`
                : "면적 범위"
            }
          />
        </section>

        <section className={styles.split}>
          <div className={classNames(styles.card, styles.chartCard)}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.cardKicker}>가격 추이</p>
                <h2>실거래 평균</h2>
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
              ) : (
                <div className={styles.placeholder}>
                  데이터를 불러오는 중입니다...
                </div>
              )}
            </div>
          </div>

          <div className={classNames(styles.card, styles.alertCard)}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.cardKicker}>알림 조건</p>
                <h2>매물 알림 & 메모</h2>
              </div>
            </div>
            <label className={styles.fieldLabel}>
              목표 알림가
              <input
                type="number"
                min={0}
                value={alertPrice}
                onChange={(event) => setAlertPrice(Number(event.target.value))}
              />
              <small>
                {alertPrice
                  ? `약 ${(alertPrice / 100_000_000).toFixed(1)}억 수준`
                  : "원 단위로 입력"}
              </small>
            </label>
            <label className={styles.fieldLabel}>
              알림 채널
              <select
                value={alertChannel}
                onChange={(event) => setAlertChannel(event.target.value)}
              >
                <option value="kakao">카카오톡 봇</option>
                <option value="email">이메일 리포트</option>
                <option value="sms">문자 메시지</option>
              </select>
            </label>
            <label className={styles.fieldLabel}>
              가족 설득 메모
              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                rows={5}
              />
            </label>
            <div className={styles.alertSummary}>
              {summary?.latestPrice ? (
                <>
                  <span>
                    최근 신고가 {formatCurrencyKRW(summary.latestPrice)}
                  </span>
                  <span>
                    목표 대비{" "}
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
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardKicker}>최신 신고 내역</p>
              <h2>상세 실거래 목록</h2>
            </div>
            <span className={styles.helperText}>
              예산 조건 이하 {filteredDeals.length}건 표시
            </span>
          </div>

          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th>계약일</th>
                  <th>단지/건물</th>
                  <th>면적</th>
                  <th>층</th>
                  <th>거래금액</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.slice(0, 8).map((deal) => (
                  <tr key={deal.id}>
                    <td>
                      {format(new Date(deal.contractDate), "yyyy.MM.dd")}
                    </td>
                    <td>{deal.apartmentName}</td>
                    <td>{formatArea(deal.area)}</td>
                    <td>{deal.floor ?? "-"}</td>
                    <td>{formatCurrencyKRW(deal.price)}</td>
                  </tr>
                ))}
                {filteredDeals.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.placeholder}>
                      예산 조건에 맞는 계약이 없습니다.
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
              <p className={styles.cardKicker}>가족 공유 포인트</p>
              <h2>투자 근거 요약</h2>
            </div>
          </div>
          <ul className={styles.memoList}>
            <li>
              최근 신고 {filteredDeals[0]?.apartmentName ?? "단지"}{" "}
              {summary?.latestPrice
                ? `${formatCurrencyKRW(summary.latestPrice)} 수준`
                : "가격 데이터 준비중"}
              으로, 지원금 2억을 포함한 자금 계획 검토 필요
            </li>
            <li>
              월별 평균{" "}
              {summary ? formatCurrencyKRW(summary.averagePrice) : "–"} /
              전월 대비 {percentLabel(priceDelta)} 흐름
            </li>
            <li>알림 기준가 {formatCurrencyKRW(alertPrice)} 설정 완료</li>
            <li>
              메모: <span>{memo}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.filterField}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function StatCard({
  label,
  value,
  helper,
  positive,
}: {
  label: string;
  value: string;
  helper?: string;
  positive?: boolean;
}) {
  return (
    <div className={styles.statCard}>
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
  );
}

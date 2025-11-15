"use client";

import {
  useCallback,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
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
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
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
const CTA_TARGET_ID = "deals-table";
const PAGE_SIZE = 10;
const MAX_PAGE_BUTTONS = 10;

type AreaFilter = "all" | "59" | "84";
type YearFilter = "all" | "new" | "mid" | "old";
type SortOrder = "none" | "price-asc" | "price-desc" | "recent";

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
  const selectedMonth = currentYearMonth();
  const currentYear = new Date().getFullYear();

  const [areaUnit, setAreaUnit] = useState<AreaUnit>("sqm");
  const [alertChannel, setAlertChannel] = useState("kakao");
  const [areaFilter, setAreaFilter] = useState<AreaFilter>("all");
  const [yearFilter, setYearFilter] = useState<YearFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

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

  const rawDeals = useMemo(() => data?.deals ?? [], [data?.deals]);

  const deals = useMemo(() => {
    return [...rawDeals].sort(
      (a, b) =>
        new Date(b.contractDate).getTime() - new Date(a.contractDate).getTime(),
    );
  }, [rawDeals]);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const areaMatch =
        areaFilter === "all"
          ? true
          : deal.areaTag
            ? deal.areaTag === areaFilter
            : matchesAreaBySize(deal.area, areaFilter);

      const yearMatch = (() => {
        if (yearFilter === "all") return true;
        if (!deal.buildYear) return false;
        const age = currentYear - deal.buildYear;
        if (yearFilter === "new") return age <= 5;
        if (yearFilter === "mid") return age > 5 && age <= 10;
        return age > 10;
      })();

      return areaMatch && yearMatch;
    });
  }, [deals, areaFilter, yearFilter, currentYear]);

  const sortedDeals = useMemo(() => {
    const base = [...filteredDeals];
    switch (sortOrder) {
      case "price-asc":
        return base.sort((a, b) => a.price - b.price);
      case "price-desc":
        return base.sort((a, b) => b.price - a.price);
      case "recent":
        return base.sort(
          (a, b) =>
            new Date(b.contractDate).getTime() - new Date(a.contractDate).getTime(),
        );
      default:
        return base;
    }
  }, [filteredDeals, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedDeals.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedDeals = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sortedDeals.slice(start, start + PAGE_SIZE);
  }, [sortedDeals, safePage]);

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

  const hasChartSeries = (summary?.monthlySeries?.length ?? 0) >= 1;

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

  const resetFilters = () => {
    startTransition(() => {
      setAreaFilter("all");
      setYearFilter("all");
      setSortOrder("none");
      setCurrentPage(1);
    });
  };

  const renderNoDealsMessage = () => (
    <tr>
      <td colSpan={8} className={styles.placeholder}>
        <div className={styles.emptyState}>
          <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M5 4h14a1 1 0 0 1 .97 1.24l-2.5 10A1 1 0 0 1 16.5 16H7.5a1 1 0 0 1-.97-.76L4 5.24A1 1 0 0 1 5 4zm2.11 2 2 8h7.78l2-8zM9 20a1 1 0 1 1 0-2h6a1 1 0 1 1 0 2z"
            />
          </svg>
          <p>조건을 완화하거나 다른 평형·준공연도를 선택해 보세요.</p>
          <button type="button" onClick={resetFilters}>
            필터 초기화
          </button>
        </div>
      </td>
    </tr>
  );

  const showSkeleton = (isPending || isLoading) && !error;

  const goToPage = (page: number) => {
    const clamped = Math.min(Math.max(1, page), totalPages);
    startTransition(() => setCurrentPage(clamped));
  };

  const pageNumbers = useMemo(() => {
    const count = Math.min(MAX_PAGE_BUTTONS, totalPages);
    const half = Math.floor(count / 2);
    let start = Math.max(1, safePage - half);
    let end = start + count - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - count + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  }, [safePage, totalPages]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>운정 59/84 실거주 집중 탐색</p>
            <h1>운정 내집마련 비교 서비스</h1>
            <p className={styles.subtitle}>
              59㎡·84㎡ 신축·준신축 중심 실거주 매물을 실거래 기준으로 비교합니다.
            </p>
            <p className={styles.filterNote}>
              ※ 보금자리론 요건(운정신도시 + 전용 84㎡ 이하)을 만족하는 단지 정보만 표시합니다.
            </p>
            <a className={styles.primaryCta} href={`#${CTA_TARGET_ID}`}>
              내 조건에 맞는 단지 찾기
            </a>
          </div>
        </header>

        {error && (
          <div className={styles.alert}>
            API 점검 중입니다. 잠시 후 다시 시도해주세요.
          </div>
        )}

        <section className={styles.statsGrid}>
          <StatCard
            label="평균 실거래가"
            value={summary ? formatKoreanPrice(summary.averagePrice) : "정보 없음"}
            helper="최근 집계 기준"
            icon={<IconActivity aria-hidden="true" size={20} />}
          />
          <StatCard
            label="중위 실거래가"
            value={summary ? formatKoreanPrice(summary.medianPrice) : "정보 없음"}
            helper="이상치 제거 기준"
            icon={<IconScale aria-hidden="true" size={20} />}
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
            icon={<IconTrendingUp aria-hidden="true" size={20} />}
          />
          <StatCard
            label="최근 거래 건수"
            value={summary ? formatNumber(summary.totalDeals) : "0"}
            helper={summary ? areaRangeLabel : "면적 표준화 중"}
            icon={<IconHomeSearch aria-hidden="true" size={20} />}
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
                <div className={styles.placeholder}>API 점검 중입니다.</div>
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
              <IconBell aria-hidden="true" size={20} />
            </div>
            <select
              className={classNames(
                styles.selectInput,
                styles.selectFullWidth,
                styles.alertSelect,
              )}
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
            <p className={styles.helperText}>카카오 알림 서비스 준비 중입니다.</p>
          </div>
        </section>

        <section className={classNames(styles.card, styles.tableCard)} id={CTA_TARGET_ID}>
          <LoadingOverlay
            visible={isLoading && !!data}
            label="실거래 목록을 정리하는 중..."
          />
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardKicker}>최신 계약</p>
              <h2>운정신도시 실거래</h2>
            </div>
            <span className={styles.helperText}>조건 일치 {sortedDeals.length}건</span>
          </div>
          <div className={styles.filterControls}>
            <label htmlFor="area-filter">
              평형 선택
              <select
                className={styles.selectInput}
                id="area-filter"
                value={areaFilter}
                onChange={(event) =>
                  startTransition(() => {
                    setAreaFilter(event.target.value as AreaFilter);
                    setCurrentPage(1);
                  })
                }
              >
                <option value="all">전체</option>
                <option value="59">59㎡</option>
                <option value="84">84㎡</option>
              </select>
            </label>
            <label htmlFor="year-filter">
              준공연도
              <select
                className={styles.selectInput}
                id="year-filter"
                value={yearFilter}
                onChange={(event) =>
                  startTransition(() => {
                    setYearFilter(event.target.value as YearFilter);
                    setCurrentPage(1);
                  })
                }
              >
                <option value="all">전체</option>
                <option value="new">신축 (0~5년)</option>
                <option value="mid">5~10년</option>
                <option value="old">10년 이상</option>
              </select>
            </label>
            <label htmlFor="sort-order">
              정렬
              <select
                className={styles.selectInput}
                id="sort-order"
                value={sortOrder}
                onChange={(event) =>
                  startTransition(() => {
                    setSortOrder(event.target.value as SortOrder);
                    setCurrentPage(1);
                  })
                }
              >
                <option value="none">정렬 없음</option>
                <option value="price-asc">가격 낮은순</option>
                <option value="price-desc">가격 높은순</option>
                <option value="recent">최근 등록순</option>
              </select>
            </label>
          </div>

          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th>계약일</th>
                  <th>단지/동</th>
                  <th>세대수</th>
                  <th>준공</th>
                  <th>역 거리</th>
                  <th>면적 ({areaUnit === "sqm" ? "㎡" : "평"})</th>
                  <th>층 (현재/전체)</th>
                  <th>거래가</th>
                </tr>
              </thead>
              <tbody>
                {showSkeleton && <SkeletonRows />}
                {!showSkeleton &&
                  paginatedDeals.map((deal, index) => (
                    <tr key={`${deal.id}-${index}`}>
                      <td data-label="계약일">
                        {format(new Date(deal.contractDate), "yyyy.MM.dd")}
                      </td>
                      <td data-label="단지/동">{deal.apartmentName}</td>
                      <td data-label="세대수">{formatHouseholds(deal)}</td>
                      <td data-label="준공">{formatBuildYear(deal)}</td>
                      <td data-label="역 거리">{formatStationDistance(deal)}</td>
                      <td data-label="면적">{formatAreaValue(deal.area)}</td>
                      <td data-label="층">{formatFloorValue(deal)}</td>
                      <td data-label="거래가" aria-label={`거래가 ${formatKoreanPrice(deal.price)}`}>
                        {formatKoreanPrice(deal.price)}
                      </td>
                    </tr>
                  ))}
                {!showSkeleton && sortedDeals.length === 0 && !isLoading && renderNoDealsMessage()}
              </tbody>
            </table>
          </div>
          {!showSkeleton && sortedDeals.length > PAGE_SIZE && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.paginationIconButton}
                onClick={() => goToPage(1)}
                disabled={safePage === 1}
                aria-label="첫 페이지"
              >
                <IconChevronsLeft aria-hidden="true" size={16} />
              </button>
              <button
                type="button"
                className={styles.paginationIconButton}
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage === 1}
                aria-label="이전 페이지"
              >
                <IconChevronLeft aria-hidden="true" size={16} />
              </button>
              {pageNumbers.map((page) => (
                <button
                  type="button"
                  key={page}
                  className={classNames(styles.pageButton, {
                    [styles.activePageButton]: page === safePage,
                  })}
                  onClick={() => goToPage(page)}
                  aria-label={`${page}페이지로 이동`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                className={styles.paginationIconButton}
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage === totalPages}
                aria-label="다음 페이지"
              >
                <IconChevronRight aria-hidden="true" size={16} />
              </button>
              <button
                type="button"
                className={styles.paginationIconButton}
                onClick={() => goToPage(totalPages)}
                disabled={safePage === totalPages}
                aria-label="마지막 페이지"
              >
                <IconChevronsRight aria-hidden="true" size={16} />
              </button>
            </div>
          )}
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
              최근 계약: {sortedDeals[0]?.apartmentName ?? "집계 중"}{" "}
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

const formatHouseholds = (deal: DealRecord) =>
  deal.households ? `${deal.households.toLocaleString()}세대` : "정보 준비중";

const formatBuildYear = (deal: DealRecord) =>
  deal.buildYear ? `${deal.buildYear}년` : "정보 준비중";

const formatStationDistance = (deal: DealRecord) =>
  deal.stationDistance ?? "정보 준비중";

const matchesAreaBySize = (area: number, filter: AreaFilter) => {
  if (!area) return false;
  if (filter === "59") {
    return area >= 55 && area <= 66;
  }
  if (filter === "84") {
    return area >= 80 && area <= 90;
  }
  return true;
};

function SkeletonRows() {
  return (
    <tr>
      <td colSpan={8}>
        <div className={styles.skeletonWrapper}>
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={`skeleton-${idx}`} className={styles.skeletonRow} />
          ))}
        </div>
      </td>
    </tr>
  );
}










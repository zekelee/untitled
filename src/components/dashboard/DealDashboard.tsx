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
  ActionIcon,
  SegmentedControl,
  Select,
  Textarea,
  Tooltip,
} from "@mantine/core";
import {
  IconActivity,
  IconBell,
  IconBriefcase,
  IconHomeSearch,
  IconNews,
  IconNote,
  IconRefresh,
  IconRulerMeasure,
  IconScale,
  IconTrendingUp,
} from "@tabler/icons-react";
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
import styles from "./deal-dashboard.module.css";

type AreaUnit = "sqm" | "pyeong";

const AREA_UNIT_OPTIONS = [
  { label: "㎡ (m²)", value: "sqm" },
  { label: "평 (py)", value: "pyeong" },
] satisfies { label: string; value: AreaUnit }[];

const PYEONG_RATIO = 3.3058;

const NEWS_ITEMS = [
  {
    title: "운정신도시 GTX-A 개통 앞두고 역세권 매물 관심↑",
    summary:
      "운정역 일대 신규 입주단지와 기존 브랜드 아파트 중심으로 신고가 거래가 이어지고 있습니다.",
    source: "매일경제",
    publishedAt: "2025-02-18",
    link: "#",
  },
  {
    title: "파주 운정, 신혼부부 특화 공공분양 2분기 공급 예고",
    summary:
      "신혼희망타운 잔여 물량과 공공분양 계획이 확정되면서 전세·매매 수요가 동시에 움직이고 있습니다.",
    source: "연합인포맥스",
    publishedAt: "2025-02-15",
    link: "#",
  },
  {
    title: "운정 호수공원 생활권 리모델링 추진 단지 리스트",
    summary:
      "준공 15년 이상 단지를 중심으로 리모델링 조합이 출범해 중대형 위주로 매수 문의가 늘었습니다.",
    source: "국토경제신문",
    publishedAt: "2025-02-12",
    link: "#",
  },
];

const LOAN_POINTS = [
  {
    label: "대출 한도",
    value: "최대 4.7억",
    helper: "생애최초 + 2인 이상 가구 기준",
  },
  {
    label: "우대 금리",
    value: "연 3.45%~",
    helper: "신혼부부·다자녀 우대 적용 시",
  },
  {
    label: "LTV / DTI",
    value: "70% / 60%",
    helper: "비규제지역·시가 9억 이하",
  },
  {
    label: "거치 · 상환",
    value: "거치 3년 / 30년 분할",
    helper: "중도상환수수료 3년간 1.2% → 0%",
  },
];

const AUTOMATION_STEPS = [
  "국토부 실거래 API + 부동산 플랫폼 신규 매물 크롤러 결합",
  "조건: 운정신도시, 전용 84㎡±, 매매가 9억 이하",
  "트리거 시 카카오톡 봇 메시지 & 이메일 리포트 발송",
  "향후: Slack/Discord 채널, 가족 단톡방 공유 자동화",
];

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
  if (!res.ok) {
    throw new Error("데이터를 불러오지 못했습니다.");
  }
  return res.json();
};

export default function DealDashboard() {
  const region = DEFAULT_REGION;
  const propertyType: PropertyType = DEFAULT_PROPERTY_TYPE;
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("sqm");
  const selectedMonth = currentYearMonth();
  const alertPrice = 950_000_000;
  const [alertChannel, setAlertChannel] = useState("kakao");
  const [memo, setMemo] = useState(
    "부모님 지원 2억과 생애최초 보금자리론을 조합해 운정 역세권 대형 평형을 노린다.",
  );

  const searchKey = `/api/deals?region=${region}&propertyType=${propertyType}&yearMonth=${selectedMonth}`;

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
            callback: (value: number | string) =>
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
        <div className={styles.floatingMenu}>
          <div className={styles.floatingSegment}>
            <IconRulerMeasure size={16} />
            <SegmentedControl
              value={areaUnit}
              onChange={(value: string) => setAreaUnit(value as AreaUnit)}
              data={AREA_UNIT_OPTIONS}
              radius="xl"
              size="xs"
            />
          </div>
          <Tooltip label="국토부 API 데이터 새로고침" position="bottom">
            <ActionIcon
              size="lg"
              radius="xl"
              variant="gradient"
              gradient={{ from: "cyan", to: "lime", deg: 120 }}
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
        </div>

        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>이진규 집사기 프로젝트</p>
            <h1>운정 아파트 집중 모니터링</h1>
            <p className={styles.subtitle}>
              파주 운정신도시 실거래가 흐름, 부동산 뉴스, 생애최초
              보금자리론 전략, 카카오톡 알림까지 한 화면에서 정리된
              개인 맞춤형 인사이트 보드입니다.
            </p>
          </div>
        </header>

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
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.cardKicker}>가격 추이</p>
                <h2>운정 실거래 평균</h2>
              </div>
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
            <div className={styles.chartTimestamp}>
              {summary
                ? `업데이트 ${format(new Date(summary.updatedAt), "MM월 dd일 HH:mm")}`
                : "업데이트 준비 중"}
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
            <Textarea
              label="가족 설득 메모"
              value={memo}
              onChange={(event) => setMemo(event.currentTarget.value)}
              minRows={4}
              radius="md"
              autosize
            />
            <div className={styles.alertSummary}>
              {summary?.latestPrice ? (
                <>
                  <span>
                    최근 신고가 {formatCurrencyKRW(summary.latestPrice)}
                  </span>
                  <span>
                    목표 {formatCurrencyKRW(alertPrice)} 대비{" "}
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
                  <th>층</th>
                  <th>거래금액</th>
                </tr>
              </thead>
              <tbody>
                {deals.slice(0, 8).map((deal) => (
                  <tr key={deal.id}>
                    <td>
                      {format(new Date(deal.contractDate), "yyyy.MM.dd")}
                    </td>
                    <td>{deal.apartmentName}</td>
                    <td>{formatAreaValue(deal.area)}</td>
                    <td>{deal.floor ?? "-"}</td>
                    <td>{formatCurrencyKRW(deal.price)}</td>
                  </tr>
                ))}
                {deals.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.placeholder}>
                      운정 아파트 실거래를 불러오는 중입니다.
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
            <IconNote size={20} />
          </div>
          <ul className={styles.memoList}>
            <li>
              최근 신고{" "}
              <strong>{deals[0]?.apartmentName ?? "단지"}</strong>{" "}
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
            <li>면적 단위: {areaUnit === "sqm" ? "제곱미터" : "평"}</li>
            <li>
              메모: <span>{memo}</span>
            </li>
          </ul>
        </section>

        <section className={styles.extraGrid}>
          <div className={classNames(styles.card, styles.newsCard)}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.cardKicker}>운정 이슈 브리핑</p>
                <h2>부동산 뉴스 클리핑</h2>
              </div>
              <IconNews size={20} />
            </div>
            <ul className={styles.newsList}>
              {NEWS_ITEMS.map((item) => (
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
          </div>

          <div className={classNames(styles.card, styles.loanCard)}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.cardKicker}>생애최초 보금자리론</p>
                <h2>대출 전략 요약</h2>
              </div>
              <IconBriefcase size={20} />
            </div>
            <div className={styles.loanGrid}>
              {LOAN_POINTS.map((item) => (
                <div key={item.label} className={styles.loanItem}>
                  <p>{item.label}</p>
                  <strong>{item.value}</strong>
                  <span>{item.helper}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={classNames(styles.card, styles.automationCard)}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.cardKicker}>자동화 로드맵</p>
                <h2>운정 매물 알림 계획</h2>
              </div>
              <IconHomeSearch size={20} />
            </div>
            <ul className={styles.automationList}>
              {AUTOMATION_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </section>
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
